#!/usr/bin/python
# -*- coding: utf-8 -*-

##########################################################################
# Ava's Global Speedrunning Scoreboard
# Copyright (C) 2018 Samuel Therrien
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
# Contact:
# samuel.06@hotmail.com
##########################################################################
from collections import Counter
from datetime import datetime
from math import ceil, exp, floor
from requests import Session
from threading import Thread, active_count
from time import strftime, sleep

from typing import Any, Dict, List, Tuple, Union
import configs
import httplib2
import json
import simplejson
import re
import requests
import traceback


SEPARATOR = "-" * 64
MIN_LEADERBOARD_SIZE = 3  # This is just to optimize as the formula gives 0 points to leaderboards size < 3
TIME_BONUS_DIVISOR = 21600  # 6h (1/4 day) for +100%

HTTP_ERROR_RETRY_DELAY = 5
HTTP_RETRYABLE_ERRORS = [401, 420, 500, 502]
session: Session = Session()


class UserUpdaterError(Exception):
    """ raise UserUpdaterError({"error":"On Status Label", "details":"Details of error"}) """
    pass


class SpeedrunComError(UserUpdaterError):
    """ raise NotFoundError({"error":"404 Not Found", "details":"Details of error"}) """
    pass


class Run:
    id_: str = ""
    primary_t: float = 0.0
    game: str = ""
    game_name: str = ""
    category: str = ""
    category_name: str = ""
    variables = {}
    level: str = ""
    level_name: str = ""
    level_count: int = 0
    _points: int = 0

    def __init__(self, id_: str, primary_t: str, game: str, category: str, variables={}, level: str=""):
        self.id_ = id_
        self.primary_t = primary_t
        self.game = game
        self.game_name = game
        self.category = category
        self.category_name = category
        self.variables = variables
        self.level = level
        self.level_name = level
        self.__set_points()

    def __str__(self) -> str:
        level_str = f"Level/{self.level_count}: {self.level}, " if self.level else ""
        return f"Run: <Game: {self.game}, " \
               f"Category: {self.category}, {level_str}{self.variables} {ceil(self._points * 100) / 100}>"

    def __eq__(self, other) -> bool:
        """
        :type other: Run
        """
        return (self.category, self.level) == (other.category, other.level)

    def __ne__(self, other) -> bool:
        """
        :type other: Run
        """
        return not (self == other)

    def __hash__(self):
        return hash((self.category, self.level))

    def __set_points(self) -> None:
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
        leaderboard = get_file(url)

        if len(leaderboard["data"]["runs"]) >= MIN_LEADERBOARD_SIZE:  # Check to avoid useless computation
            previous_time = leaderboard["data"]["runs"][0]["run"]["times"]["primary_t"]
            is_speedrun: bool = False

            # Get a list of all banned players in this leaderboard
            banned_players = []
            for player in leaderboard["data"]["players"]["data"]:
                if player.get("role") == "banned":
                    banned_players.append(player["id"])

            # First iteration: build a list of valid runs
            valid_runs = []
            for run in leaderboard["data"]["runs"]:
                value = run["run"]["times"]["primary_t"]

                # Making sure this is a speedrun and not a score leaderboard
                # To avoid false negatives due to missing primary times, stop comparing once we know it's a speedrun
                if not is_speedrun:
                    if value < previous_time:
                        break  # Score based leaderboard. No need to keep looking
                    elif value > previous_time:
                        is_speedrun: bool = True

                # Check if the run is valid (place > 0 & no banned participant)
                if run["place"] > 0:
                    for player in run["run"]["players"]:
                        if player.get("id") in banned_players:
                            break
                    else:
                        valid_runs.append(run)

            original_population = len(valid_runs)
            if is_speedrun and original_population >= MIN_LEADERBOARD_SIZE:  # Avoid useless computation and errors
                # Sort and remove last 5%
                valid_runs = sorted(valid_runs[:int(original_population * 0.95) or None],
                                    key=lambda r: r["run"]["times"]["primary_t"])

                # Second iteration: maths!
                mean: float = 0.0
                sigma: float = 0.0
                population: int = 0
                for run in valid_runs:
                    value = run["run"]["times"]["primary_t"]
                    population += 1
                    mean_temp = mean
                    mean += (value - mean_temp) / population
                    sigma += (value - mean_temp) * (value - mean)

                wr_time = valid_runs[0]["run"]["times"]["primary_t"]
                worst_time = valid_runs[-1]["run"]["times"]["primary_t"]
                standard_deviation = (sigma / population) ** 0.5
                if standard_deviation > 0:  # All runs must not have the exact same time
                    # Get the +- deviation from the mean
                    signed_deviation = mean - self.primary_t
                    # Get the deviation from the mean of the worse time as a positive number
                    lowest_deviation = worst_time - mean
                    # These three shift the deviations up so that the worse time is now 0
                    adjusted_deviation = signed_deviation + lowest_deviation
                    adjusted_standard_deviation = standard_deviation + lowest_deviation
                    adjusted_mean_deviation = 0 + lowest_deviation
                    if adjusted_deviation > 0:  # The last 5% of runs isn't worth any points
                        # Scale all the normalized deviations so that the mean is worth 1 but the worse stays 0
                        normalized_deviation = (adjusted_deviation / adjusted_standard_deviation) \
                                               * (1 / (adjusted_mean_deviation / adjusted_standard_deviation))
                        # Bonus points for long games
                        length_bonus = 1 + (wr_time / TIME_BONUS_DIVISOR)
                        # More people means more accurate relative time and more optimised/hard to reach high times
                        certainty_adjustment = 1 - 1 / (population + 1)

                        # Give points
                        self._points = exp(normalized_deviation * certainty_adjustment) * length_bonus * 10
                        # Set names
                        game_category = re.split(
                            "[/#]",
                            leaderboard["data"]["weblink"][leaderboard["data"]["weblink"].rindex("com/") + 4:]
                            .replace("_", " ")
                            .title())
                        self.game_name = game_category[0]  # Always first of 2-3 items
                        self.category_name = game_category[-1]  # Always last of 2-3 items

                        # If the run is an Individual Level and worth looking at, set the level count and name
                        if self.level and self._points > 0:
                            self.level_name = game_category[1]  # Always 2nd of 3 items
                            url = "https://www.speedrun.com/api/v1/games/{game}/levels".format(game=self.game)
                            levels = get_file(url)
                            self.level_count = len(levels["data"])
                            self._points /= self.level_count or 1
        print(self)


class User:
    _points: int = 0
    _name: str = ""
    _id: str = ""
    _banned: bool = False
    _point_distribution_str: str = ""

    def __init__(self, id_or_name: str) -> None:
        self._id = id_or_name
        self._name = id_or_name

    def __str__(self) -> str:
        return f"User: <{self._name}, {ceil(self._points * 100) / 100}, {self._id}{'(Banned)' if self._banned else ''}>"

    def set_code_and_name(self) -> None:
        url = "https://www.speedrun.com/api/v1/users/{user}".format(user=self._id)
        infos = get_file(url)

        self._id = infos["data"]["id"]
        self._name = infos["data"]["names"].get("international")
        japanese_name = infos["data"]["names"].get("japanese")
        if japanese_name:
            self._name += f" ({japanese_name})"
        if infos["data"]["role"] == "banned":
            self._banned = True
            self._points = 0

    def set_points(self) -> None:
        counted_runs: List[Run] = []

        def set_points_thread(pb) -> None:
            try:
                # Check if it's a valid run (has a category AND has video verification)
                if pb["run"]["category"] and pb["run"].get("videos"):
                    # Get a list of the game's subcategory variables
                    url = "https://www.speedrun.com/api/v1/games/{game}/variables".format(game=pb["run"]["game"])
                    game_variables = get_file(url)
                    game_subcategory_ids: List[str] = []
                    for game_variable in game_variables["data"]:
                        if game_variable["is-subcategory"]:
                            game_subcategory_ids.append(game_variable["id"])

                    pb_subcategory_variables: Dict[str, Dict[str, str]] = {}
                    # For every variable in the run...
                    for pb_var_id, pb_var_value in pb["run"]["values"].items():
                        # ...find if said variable is one of the game's subcategories...
                        if pb_var_id in game_subcategory_ids:
                            # ... and add it to the run's subcategory variables
                            pb_subcategory_variables[pb_var_id] = pb_var_value

                    run: Run = Run(pb["run"]["id"],
                                   pb["run"]["times"]["primary_t"],
                                   pb["run"]["game"],
                                   pb["run"]["category"],
                                   pb_subcategory_variables,
                                   pb["run"]["level"])
                    # If a category has already been counted, only keep the one that's worth the most.
                    # This can happen in leaderboards with multiple coop runs or multiple subcategories.
                    if run._points > 0:
                        for counted_run in counted_runs:
                            if counted_run == run:
                                if run._points > counted_run._points:
                                    counted_run = run
                                break
                        else:
                            counted_runs.append(run)

            except UserUpdaterError as exception:
                threadsException.append(exception.args[0])
            except Exception:
                threadsException.append({"error": "Unhandled", "details": traceback.format_exc()})

        if not self._banned:
            url = "https://www.speedrun.com/api/v1/users/{user}/personal-bests".format(user=self._id)
            pbs = get_file(url)
            self._points = 0
            threads: List[Thread] = []
            for pb in pbs["data"]:
                threads.append(Thread(target=set_points_thread, args=(pb,)))
            for t in threads:
                while True:
                    try:
                        if active_count() <= 8:
                            t.start()
                            break
                    except RuntimeError:
                        print(
                            f"RuntimeError: Can't start {active_count()+1}th thread. "
                            f"Trying to just wait a bit as I don't have a better way to deal w/ it atm.")
                        sleep(0.5)
            for t in threads:
                t.join()

            # Sum up the runs' score
            counted_runs.sort(key=lambda r: r._points, reverse=True)
            run_str_lst: List[Tuple[str, float]] = []
            biggest_str_length: int = 0
            for run in counted_runs:
                self._points += run._points
                run_str = ("{game} - {category}{level}".format(game=run.game_name,
                                                               category=run.category_name,
                                                               level=f" ({run.level_name})" if run.level_name else ""))
                run_pts = ceil((run._points * 100)) / 100
                run_str_lst.append((run_str, run_pts))
                biggest_str_length = max(biggest_str_length, len(run_str))

            self._point_distribution_str = f"\n{'Game - Category (Level)':<{biggest_str_length}} | Points" \
                                           f"\n{'-'*biggest_str_length} | -----"
            for run_infos in run_str_lst:
                self._point_distribution_str += f"\n{run_infos[0]:<{biggest_str_length}} | {run_infos[1]:.2f}"

            if self._banned:
                self._points = 0  # In case the banned flag has been set mid-thread
        else:
            self._points = 0


def get_file(p_url: str, p_headers: Dict[str, Any] = None) -> dict:
    """
    Returns the content of "url" parsed as JSON dict.

    Parameters
    ----------
    :param p_url:  # The url to query
    :param p_headers:
    """
    global session
    print(p_url)  # debug_str
    while True:
        try:
            raw_data = session.get(p_url, headers=p_headers)
        except requests.exceptions.ConnectionError as exception:  # Connexion error
            raise UserUpdaterError({"error": "Can't establish connexion to speedrun.com", "details": exception})

        try:
            json_data = raw_data.json()
        # Didn't receive a JSON file ...
        except (json.decoder.JSONDecodeError, simplejson.scanner.JSONDecodeError) as exception:
            try:
                raw_data.raise_for_status()
            except requests.exceptions.HTTPError as exception:  # ... because it's an HTTP error
                if raw_data.status_code in HTTP_RETRYABLE_ERRORS:
                    print(f"WARNING: {exception.args[0]}. Retrying in {HTTP_ERROR_RETRY_DELAY} seconds.")  # debug_str
                    sleep(HTTP_ERROR_RETRY_DELAY)
                    # No break or raise as we want to retry
                else:
                    raise UserUpdaterError({"error": f"HTTPError {raw_data.status_code}", "details": exception.args[0]})
            else:  # ... we don't know why (elevate the exception)
                print(f"ERROR/WARNING: raw_data=({type(raw_data)})\'{raw_data}\'\n")  # debug_str
                raise UserUpdaterError({"error": "JSONDecodeError", "details": f"{exception.args[0]} in:\n{raw_data}"})

        else:
            if "status" in json_data:  # Speedrun.com custom error
                if json_data["status"] in HTTP_RETRYABLE_ERRORS:
                    print("WARNING: {status}. {message}. Retrying in {delay} seconds.".format(
                        status=json_data["status"],
                        message=json_data["message"],
                        delay=HTTP_ERROR_RETRY_DELAY))  # debug_str
                    sleep(HTTP_ERROR_RETRY_DELAY)
                    # No break or raise as we want to retry
                else:
                    raise SpeedrunComError(
                        {"error": f"{json_data['status']} (speedrun.com)", "details": json_data["message"]})

            else:  # No error
                return json_data


def get_updated_user(p_user_id: str) -> Dict[str, Union[str, None, float, int]]:
    """Called from flask_app and AutoUpdateUsers.run()"""
    global session
    global threadsException
    threadsException = []
    text_output: str = p_user_id
    result_state: str = "info"

    try:
        user = User(p_user_id)
        print(f"{SEPARATOR}\n{user._name}")  # debug_str

        try:
            user.set_code_and_name()
        except SpeedrunComError:
            # ID doesn't exists on speedrun.com but it does in the database, remove it
            player = flask_app.Player.query.get(user._name)
            if player:
                text_output = (f"User ID \"{user._id}\" not found on speedrun.com. "
                               "\nRemoved it from the database.")
                result_state = "warning"
                flask_app.db.session.delete(player)
                flask_app.db.session.commit()
            else:
                text_output = (f"User \"{user._id}\" not found. "
                               "\nMake sure the name or ID is typed properly. "
                               "It's possible the user you're looking for changed their name. "
                               "In case of doubt, use its ID.")
                result_state = "warning"
        else:
            # Setup a few checks
            player = flask_app.Player.query.get(user._id)

            # If user doesn't exists or enough time passed since last update
            if not player or (datetime.now() - player.last_update).days >= 1 or configs.bypass_update_restrictions:

                user.set_points()
                if not threadsException:

                    print(f"\nLooking for {user._id}")  # debug_str
                    timestamp = strftime("%Y-%m-%d %H:%M")

                    # If user exists, update the database entry
                    if player:
                        text_output = f"{user} found. Updated its entry."
                        result_state = "success"
                        flask_app \
                            .Player \
                            .query \
                            .filter(flask_app.Player.user_id == user._id) \
                            .update({"user_id": user._id,
                                     "name": user._name,
                                     "score": user._points,
                                     "last_update": timestamp})
                        flask_app.db.session.commit()

                    # If user not found and has points, add it to the database
                    elif user._points >= 1:
                        text_output = "{} not found. Added a new row.".format(user)
                        result_state = "success"
                        player = flask_app.Player(user_id=user._id,
                                                  name=user._name,
                                                  score=user._points,
                                                  last_update=timestamp)
                        flask_app.db.session.add(player)
                        flask_app.db.session.commit()
                    else:
                        text_output = f"Not inserting new data as {user} " \
                                      f"{'is banned' if user._banned else 'has a score lower than 1.'}."
                        result_state = "warning"
                    text_output += user._point_distribution_str

                else:
                    error_str_list: List[str] = []
                    for e in threadsException:
                        error_str_list.append("Error: {}\n{}".format(e["error"], e["details"]))
                    error_str_counter = Counter(error_str_list)
                    errors_str = "{0}" \
                                 "\nhttps://github.com/Avasam/Global_Speedrunning_Scoreboard/issues" \
                                 "\nNot uploading data as some errors were caught during execution:" \
                                 "\n{0}\n".format(SEPARATOR)
                    for error, count in error_str_counter.items():
                        errors_str += f"[x{count}] {error}\n"
                    text_output += ("\n" if text_output else "") + errors_str
                    result_state = "danger"
            else:
                text_output = "This user has already been updated in the last 24h"
                result_state = "warning"

        print(text_output)
        return {'state': result_state,
                'rank': None,
                'name': user._name,
                'score': floor(user._points),
                'last_updated': strftime("%Y-%m-%d %H:%M"),
                'user_id': user._id,
                'message': text_output}

    except httplib2.ServerNotFoundError as exception:
        raise UserUpdaterError({"error": "Server not found",
                                "details": f"{exception}\nPlease make sure you have an active internet connection"})
    except (requests.exceptions.ChunkedEncodingError, ConnectionAbortedError) as exception:
        raise UserUpdaterError({"error": "Connexion interrupted", "details": exception})


import flask_app
