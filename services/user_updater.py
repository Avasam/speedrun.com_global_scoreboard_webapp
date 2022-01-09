from typing import Union

from datetime import datetime
from math import exp, floor, pi
from re import sub
from time import strftime
from urllib.parse import unquote
import httplib2
import requests

from models.game_search_models import GameValues
from models.core_models import db, Player
from models.global_scoreboard_models import PointsDistributionDto, Run, User
from services.user_updater_helpers import BasicJSONType, extract_valid_personal_bests, get_probability_terms, \
    get_subcategory_variables, keep_runs_before_soft_cutoff, MIN_LEADERBOARD_SIZE, update_runner_in_database, \
    extract_top_runs_and_score, extract_sorted_valid_runs_from_leaderboard
from services.utils import clear_cache_for_user_async, get_file, get_paginated_response, MAXIMUM_RESULTS_PER_PAGE, \
    SpeedrunComError, start_and_wait_for_threads, UserUpdaterError
import configs

TIME_BONUS_DIVISOR = 3600 * 12  # 12h (1/2 day) for +100%


def get_updated_user(user_id: str) -> dict[str, Union[str, None, float, int, PointsDistributionDto]]:
    """Called from flask_app and AutoUpdateUsers.run()"""
    text_output: str = user_id
    result_state: str = "info"

    try:
        user = User(user_id)
        print(f"Update request for: {user._name}")

        try:
            __set_user_code_and_name(user)
        except SpeedrunComError as exception:
            if not exception.args[0]["error"].startswith("404"):
                raise
            # ID doesn't exists on speedrun.com but it does in the database, remove it
            player = Player.get(user._name)
            if player:
                text_output = (f"User ID '{user._id}' not found on speedrun.com. "
                               "\nRemoved them from the database.")
                result_state = "warning"
                db.session.delete(player)
                db.session.commit()
            else:
                text_output = (f"User '{user._id}' not found. "
                               "\nMake sure the name or ID is typed properly. "
                               "It's possible the user you're looking for changed their name. "
                               "In case of doubt, use their ID.")
                result_state = "warning"
        else:
            # Setup a few checks
            player = Player.get(user._id)

            # If user doesn't exists or enough time passed since last update
            if (
                not player
                or not player.last_update
                or (datetime.now() - player.last_update).days >= configs.last_updated_days[0]
                or configs.bypass_update_restrictions
            ):
                __set_user_points(user)
                text_output, result_state = update_runner_in_database(player, user)
            else:
                cant_update_time = configs.last_updated_days[0]
                text_output = "This user has already been updated in the past " + \
                    f"{cant_update_time} day {'s' if cant_update_time != 1 else ''}"
                result_state = "warning"

        # When we can finally successfully update a player, clear the cache of their specific responses
        if not configs.skip_cache_cleanup:
            clear_cache_for_user_async(user._id)
        return {
            "userId": user._id,
            "name": user._name,
            "countryCode": user._country_code,
            "score": floor(user._points),
            "lastUpdate": strftime("%Y-%m-%d %H:%M"),
            "rank": None,
            "scoreDetails": user.get_points_distribution_dto(),
            "message": text_output,
            "state": result_state,
        }

    except httplib2.ServerNotFoundError as exception:
        raise UserUpdaterError({
            "error": "Server not found",
            "details": f"{exception}\nPlease make sure you have an active internet connection"}
        ) from exception
    except (requests.exceptions.ChunkedEncodingError, ConnectionAbortedError) as exception:
        raise UserUpdaterError({
            "error": "Connexion interrupted",
            "details": exception}
        ) from exception


def __set_user_code_and_name(user: User) -> None:
    url = "https://www.speedrun.com/api/v1/users/{user}".format(user=user._id)
    infos = get_file(url, {}, True)

    user._id = infos["data"]["id"]
    location = infos["data"]["location"]
    if location is not None:
        country = location["country"]
        region = location.get("region")
        user._country_code = region["code"] if region else country["code"]
    else:
        user._country_code = None
    user._name = infos["data"]["names"].get("international")
    if infos["data"]["role"] == "banned":
        user._banned = True
        user._points = 0


def __set_user_points(user: User) -> None:
    counted_runs: list[Run] = []

    def set_points_thread(pb: BasicJSONType) -> None:
        pb_subcategory_variables = get_subcategory_variables(pb)
        pb_level_id = ""
        pb_level_name = ""
        level_count = 0

        if pb["level"]["data"]:
            pb_level_id = pb["level"]["data"]["id"]
            pb_level_name = pb["level"]["data"]["name"]
            url = "https://www.speedrun.com/api/v1/games/{game}/levels".format(game=pb["game"]["data"]["id"])
            levels = get_file(url, {"max": str(MAXIMUM_RESULTS_PER_PAGE)}, True)
            level_count = len(levels["data"])

        run: Run = Run(pb["id"],
                       pb["times"]["primary_t"],
                       pb["game"]["data"]["id"],
                       pb["game"]["data"]["names"]["international"],
                       pb["category"],
                       pb_subcategory_variables,
                       pb_level_id,
                       pb_level_name,
                       level_count)
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

    if user._banned:
        user._points = 0
        return

    url = "https://www.speedrun.com/api/v1/runs"
    params = {
        "user": user._id,
        "status": "verified",
        "embed": "level,game.variables",
        "max": str(MAXIMUM_RESULTS_PER_PAGE),
    }
    runs: list[BasicJSONType] = get_paginated_response(url, params)["data"]
    runs = extract_valid_personal_bests(runs)

    start_and_wait_for_threads(set_points_thread, runs)

    # Sum up the runs' score, only the top 60 will end up giving points
    top_runs, lower_runs = extract_top_runs_and_score(counted_runs)
    user._points = sum(run._points for run in top_runs)
    user._points_distribution = [top_runs, lower_runs]


def __set_run_points(run: Run) -> None:
    run._points = 0
    # If the run is an Individual Level, adapt the request url
    lvl_cat_str = "level/{level}/".format(level=run.level) if run.level else "category/"
    url = "https://www.speedrun.com/api/v1/leaderboards/{game}/{lvl_cat_str}{category}".format(
        game=run.game,
        lvl_cat_str=lvl_cat_str,
        category=run.category)
    params = {"video-only": True, "embed": "players"}
    for var_id, var_value in run.variables.items():
        params[f"var-{var_id}"] = var_value
    try:
        leaderboard = get_file(url, params, True)
    # If SR.C returns 404 here, most likely the run references a category or level that does not exist anymore
    except SpeedrunComError as exception:
        if exception.args[0]["error"].startswith("404"):
            return
        raise

    valid_runs = extract_sorted_valid_runs_from_leaderboard(leaderboard["data"], run.level_fraction)
    len_valid_runs = len(valid_runs)

    # CHECK: Avoid useless computation and errors
    if len_valid_runs < MIN_LEADERBOARD_SIZE:
        return

    # Remove last 5%
    valid_runs = valid_runs[:int(len_valid_runs * 0.95) or None]

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
    signed_deviation = mean - run.primary_t
    # Get the deviation from the mean of the worse time as a positive number
    worst_time = valid_runs[-1]["run"]["times"]["primary_t"]
    lowest_deviation = worst_time - mean
    # Shift the deviations up so that the worse time is now 0
    adjusted_deviation = signed_deviation + lowest_deviation

    # CHECK: The last counted run isn't worth any points, if this is 0 the rest of the formula will return 0
    if adjusted_deviation <= 0:
        return

    # Scale all the adjusted deviations so that the mean is worth 1 but the worse stays 0...
    # using the lowest time"s deviation from before the "repeated times" fix!
    # (runs not affected by the prior fix won't see any difference)
    pre_cutoff_lowest_deviation = pre_cutoff_worst_time - mean
    normalized_deviation = adjusted_deviation / pre_cutoff_lowest_deviation

    # More people means more accurate relative time and more optimised/hard to reach low times
    # This function would equal 0 if population = MIN_LEADERBOARD_SIZE - 1
    certainty_adjustment = 1 - 1 / (population - MIN_LEADERBOARD_SIZE + 2)
    # Cap the deviation to π
    e_exponent = min(normalized_deviation, pi) * certainty_adjustment
    # Bonus points for long games
    length_bonus = 1 + (wr_time / TIME_BONUS_DIVISOR)

    # Give points, hard cap to 6 character
    run._points = (exp(e_exponent) - 1) * 10 * length_bonus * run.level_fraction

    # Set category name
    run.category_name = sub(
        r"((\d\d)$|Any)(?!%)",
        r"\1%",
        unquote(leaderboard["data"]["weblink"].split("#")[1])
        .rstrip("1")
        .replace("_", " ")
        .title()
    )

    # Set game search data
    run._is_wr_time = wr_time == run.primary_t
    run._mean_time = mean
