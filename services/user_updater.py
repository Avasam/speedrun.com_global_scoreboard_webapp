from collections import Counter
from datetime import datetime
from math import exp, floor, pi
from models.game_search_models import GameValues
from models.core_models import db, Player
from models.global_scoreboard_models import Run, SrcRequest, User
from time import strftime
from typing import Dict, List, Union
from threading import Thread
from services.user_updater_helpers import BasicJSONType, extract_valid_personal_bests, get_probability_terms, \
    get_subcategory_variables, keep_runs_before_soft_cutoff, MIN_LEADERBOARD_SIZE, update_runner_in_database, \
    extract_top_runs_and_score, extract_sorted_valid_runs_from_leaderboard
from services.utils import map_to_dto, SpeedrunComError, start_and_wait_for_threads, UserUpdaterError
from urllib.parse import unquote
import configs
import httplib2
import json
import re
import requests
import traceback

TIME_BONUS_DIVISOR = 3600 * 12  # 12h (1/2 day) for +100%


def get_updated_user(p_user_id: str) -> Dict[str, Union[str, None, float, int]]:
    """Called from flask_app and AutoUpdateUsers.run()"""
    global threads_exceptions
    threads_exceptions = []
    text_output: str = p_user_id
    result_state: str = "info"

    try:
        user = User(p_user_id)
        print(f"Update request for: {user._name}")

        try:
            __set_user_code_and_name(user)
        except SpeedrunComError:
            # ID doesn't exists on speedrun.com but it does in the database, remove it
            player = Player.get(user._name)
            if player:
                text_output = (f"User ID \"{user._id}\" not found on speedrun.com. "
                               "\nRemoved it from the database.")
                result_state = "warning"
                db.session.delete(player)
                db.session.commit()
            else:
                text_output = (f"User \"{user._id}\" not found. "
                               "\nMake sure the name or ID is typed properly. "
                               "It's possible the user you're looking for changed their name. "
                               "In case of doubt, use their ID.")
                result_state = "warning"
        else:
            # Setup a few checks
            player = Player.get(user._id)

            # If user doesn't exists or enough time passed since last update
            if not player or \
                not player.last_update or \
                (datetime.now() - player.last_update).days >= configs.last_updated_days[0] or \
                    configs.bypass_update_restrictions:

                __set_user_points(user)

                if not threads_exceptions:
                    print(f"\nLooking for {user._id}")
                    text_output, result_state = update_runner_in_database(player, user)
                    text_output += user._point_distribution_str
                else:
                    errors_str = "Please report to: https://github.com/Avasam/Global_Speedrunning_Scoreboard/issues\n" \
                        "\nNot uploading data as some errors were caught during execution:\n"
                    if len(threads_exceptions) == 1:
                        raise UserUpdaterError({
                            "error": threads_exceptions[0]["error"],
                            "details": errors_str + str(threads_exceptions[0]["details"])})
                    else:
                        error_str_items = Counter(
                            [f"Error: {e['error']}\n{e['details']}"
                             for e in threads_exceptions]) \
                            .items()
                        for error, count in error_str_items:
                            errors_str += f"[x{count}] {error}\n"
                        raise UserUpdaterError({
                            "error": "Multiple Unhandled Exceptions",
                            "details": errors_str})
            else:
                cant_update_time = configs.last_updated_days[0]
                text_output = f"This user has already been updated in the past {cant_update_time} day" \
                    "s" if cant_update_time != 1 else ""
                result_state = "warning"

        return {'state': result_state,
                'rank': None,
                'name': user._name,
                'countryCode': user._country_code,
                'score': floor(user._points),
                'lastUpdate': strftime("%Y-%m-%d %H:%M"),
                'userId': user._id,
                'message': text_output}

    except httplib2.ServerNotFoundError as exception:
        raise UserUpdaterError({"error": "Server not found",
                                "details": f"{exception}\nPlease make sure you have an active internet connection"})
    except (requests.exceptions.ChunkedEncodingError, ConnectionAbortedError) as exception:
        raise UserUpdaterError({"error": "Connexion interrupted", "details": exception})


def __set_user_code_and_name(user: User) -> None:
    url = "https://www.speedrun.com/api/v1/users/{user}".format(user=user._id)
    infos = SrcRequest.get_cached_response_or_new(url)

    user._id = infos["data"]["id"]
    location = infos["data"]["location"]
    user._country_code = location["country"]["code"] if location else None
    user._name = infos["data"]["names"].get("international")
    japanese_name = infos["data"]["names"].get("japanese")
    if japanese_name:
        user._name += f" ({japanese_name})"
    if infos["data"]["role"] == "banned":
        user._banned = True
        user._points = 0


def __set_user_points(user: User) -> None:
    global threads_exceptions
    counted_runs: List[Run] = []

    def set_points_thread(pb: BasicJSONType) -> None:
        try:
            if threads_exceptions:
                # Don't keep going if previous threads already threw something
                print("Aborted thread due to previous thread exceptions")
                return
            pb_subcategory_variables = get_subcategory_variables(pb)

            pb_level_id = pb["level"]["data"]["id"] if pb["level"]["data"] else ""
            pb_level_name = pb["level"]["data"]["name"] if pb["level"]["data"] else ""
            run: Run = Run(pb["id"],
                           pb["times"]["primary_t"],
                           pb["game"]["data"]["id"],
                           pb["game"]["data"]["names"]["international"],
                           pb["category"],
                           pb_subcategory_variables,
                           pb_level_id,
                           pb_level_name,
                           len(pb["game"]["data"]["levels"]["data"]))
            __set_run_points(run)

            # If a category has already been counted, only keep the one that's worth the most.
            # This can happen in leaderboards with coop runs or subcategories.
            if run._points > 0:
                for i, counted_run in enumerate(counted_runs):
                    if counted_run == run:
                        if run._points > counted_run._points:
                            counted_runs[i] = run
                        break
                else:
                    counted_runs.append(run)

            # Used to allow searching for games by their worth
            # Run should be worth more than 1 point, not be a level and be made by WR holder
            if run._points >= 1 and not run.level and run._is_wr_time:
                # TODO : Current issues with subcategories where they try to create at the same time bc in two threads
                # Solution 1: Include subcategories as part of PRIMARY key
                # Solution 2: Batch create/update AFTER all threads are done running
                GameValues.create_or_update(
                    run_id=run.id_,
                    game_id=run.game,
                    category_id=run.category,
                    platform_id=pb["system"]["platform"],
                    wr_time=floor(run.primary_t),
                    wr_points=floor(run._points),
                    mean_time=floor(run._mean_time),
                )

        except UserUpdaterError as exception:
            threads_exceptions.append(exception.args[0])
        except Exception:
            threads_exceptions.append({"error": "Unhandled", "details": traceback.format_exc()})

    if user._banned:
        user._points = 0
        return

    url = "https://www.speedrun.com/api/v1/runs?user={user}&status=verified" \
        "&embed=level,game.levels,game.variables&max={pagesize}" \
        .format(user=user._id, pagesize=200)
    runs: List[BasicJSONType] = SrcRequest.get_paginated_response(url)["data"]
    runs = extract_valid_personal_bests(runs)

    threads = [Thread(target=set_points_thread, args=(run,))
               for run in runs]
    start_and_wait_for_threads(threads)

    # Sum up the runs' score, only the top 60 will end up giving points
    top_runs, lower_runs = extract_top_runs_and_score(counted_runs)
    user._points = sum(run._points for run in top_runs)
    user._point_distribution_str = "\n" + json.dumps([map_to_dto(top_runs), map_to_dto(lower_runs)])


def __set_run_points(self) -> None:
    self._points = 0
    # If the run is an Individual Level, adapt the request url
    lvl_cat_str = "level/{level}/".format(level=self.level) if self.level else "category/"
    url = "https://www.speedrun.com/api/v1/leaderboards/{game}/" \
        "{lvl_cat_str}{category}?video-only=true&embed=players".format(
            game=self.game,
            lvl_cat_str=lvl_cat_str,
            category=self.category)
    for var_id, var_value in self.variables.items():
        url += "&var-{id}={value}".format(id=var_id, value=var_value)
    leaderboard = SrcRequest.get_cached_response_or_new(url)

    valid_runs = extract_sorted_valid_runs_from_leaderboard(leaderboard["data"], self.level_fraction)
    original_population = len(valid_runs)

    # CHECK: Avoid useless computation and errors
    if original_population < MIN_LEADERBOARD_SIZE:
        return

    # Remove last 5%
    valid_runs = valid_runs[:int(original_population * 0.95) or None]

    # Find the time that's most often repeated in the leaderboard
    # (after the 80th percentile) and cut off everything after that
    pre_cutoff_worst_time = valid_runs[-1]["run"]["times"]["primary_t"]
    valid_runs = keep_runs_before_soft_cutoff(valid_runs)

    wr_time = valid_runs[0]["run"]["times"]["primary_t"]
    mean, standard_deviation, population = get_probability_terms(valid_runs)

    # CHECK: All runs must not have the exact same time
    if standard_deviation <= 0:
        return

    # Get the +- deviation from the mean
    signed_deviation = mean - self.primary_t
    # Get the deviation from the mean of the worse time as a positive number
    worst_time = valid_runs[-1]["run"]["times"]["primary_t"]
    lowest_deviation = worst_time - mean
    # Shift the deviations up so that the worse time is now 0
    adjusted_deviation = signed_deviation + lowest_deviation

    # CHECK: The last counted run isn't worth any points, if this is 0 the rest of the formula will return 0
    if adjusted_deviation <= 0:
        return

    # Scale all the adjusted deviations so that the mean is worth 1 but the worse stays 0...
    # using the lowest time's deviation from before the "repeated times" fix!
    # (runs not affected by the prior fix won't see any difference)
    adjusted_lowest_deviation = pre_cutoff_worst_time - mean
    normalized_deviation = adjusted_deviation / adjusted_lowest_deviation

    # More people means more accurate relative time and more optimised/hard to reach low times
    # This function would equal 0 if population = MIN_LEADERBOARD_SIZE - 1
    certainty_adjustment = 1 - 1 / (population - MIN_LEADERBOARD_SIZE + 2)
    # Cap the deviation to π
    e_exponent = min(normalized_deviation, pi) * certainty_adjustment
    # Bonus points for long games
    length_bonus = 1 + (wr_time / TIME_BONUS_DIVISOR)

    # Give points, hard cap to 6 character
    self._points = (exp(e_exponent) - 1) * 10 * length_bonus * self.level_fraction

    # Set category name
    self.category_name = re.sub(
        r"((\d\d)$|Any)(?!%)",
        r"\1%",
        unquote(leaderboard["data"]["weblink"].split('#')[1])
        .rstrip('1')
        .replace("_", " ")
        .title()
    )

    # Set game search data
    self._is_wr_time = wr_time == self.primary_t
    self._mean_time = mean
