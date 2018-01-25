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
from math import ceil, floor
from sys import stdout
from threading import Thread, active_count
from time import strftime, sleep
import httplib2
import json
import simplejson
import re
import requests
import traceback

SEPARATOR = "-" * 64
MIN_LEADERBOARD_SIZE = 3 # This is just to optimize as the formula gives 0 points to leaderboards size < 3
TIME_BONUS_DIVISOR = 21600  # 6h (1/4 day) for +100%

HTTPERROR_RETRY_DELAY = 5
HTTP_RETRYABLE_ERRORS = [401, 420, 500, 502]
session = requests.Session()

class UserUpdaterError(Exception):
    """ raise UserUpdaterError({"error":"On Status Label", "details":"Details of error"}) """
    pass

class SpeedrunComError(UserUpdaterError):
    """ raise NotFoundError({"error":"404 Not Found", "details":"Details of error"}) """
    pass


class Run():
    id_ = ""
    primary_t = 0.0
    game = ""
    game_name = ""
    category = ""
    category_name = ""
    variables = {}
    level = ""
    level_name = ""
    level_count = 0
    _points = 0

    def __init__(self, id_, primary_t, game, category, variables={}, level=""):
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

    def __str__(self):
        level_str = "Level/{}: {}, ".format( self.level_count, self.level) if self.level else ""
        return "Run: <Game: {}, Category: {}, {}{} {}>".format(self.game, self.category, level_str, self.variables, ceil(self._points * 100) / 100)

    def __eq__(self, other):
        return (self.category, self.level) == (other.category, other.level)

    def __ne__(self, other):
        return not (self == other)

    def __hash__(self):
        return hash((self.category, self.level))

    def __set_points(self):
        self._points = 0
        # If the run is an Individual Level, adapt the request url
        lvl_cat_str = "level/{level}/".format(level=self.level) if self.level else "category/"
        url = "https://www.speedrun.com/api/v1/leaderboards/{game}/" \
              "{lvl_cat_str}{category}?video-only=true&embed=players".format(game=self.game, lvl_cat_str=lvl_cat_str, category=self.category)
        for var_id, var_value in self.variables.items():
            url += "&var-{id}={value}".format(id=var_id, value=var_value)
        leaderboard = get_file(url)

        if len(leaderboard["data"]["runs"]) >= MIN_LEADERBOARD_SIZE:  # Check to avoid useless computation
            previous_time = leaderboard["data"]["runs"][0]["run"]["times"]["primary_t"]
            is_speedrun = False

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
                if not is_speedrun:  # To avoid false negatives due to missing primary times, stop comparing once we know it's a speedrun
                    if value < previous_time:
                        break  # Score based leaderboard. No need to keep looking
                    elif value > previous_time:
                        is_speedrun = True

                # Check if the run is valid (place > 0 & no banned participant)
                if run["place"] > 0:
                    for player in run["run"]["players"]:
                        if player.get("id") in banned_players: break
                    else:
                        valid_runs.append(run)

            original_population = len(valid_runs)
            if is_speedrun and original_population >= MIN_LEADERBOARD_SIZE:  # Check to avoid useless computation and errors
                # Sort and remove last 5%
                valid_runs = sorted(valid_runs[:int(original_population*0.95) or None], key=lambda r: r["run"]["times"]["primary_t"])

                # Second iteration: maths!
                mean = 0.0
                sigma = 0.0
                population = 0
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
                    adjusted_deviation = signed_deviation+lowest_deviation
                    adjusted_standard_deviation = standard_deviation+lowest_deviation
                    adjusted_mean_deviation = 0+lowest_deviation
                    if adjusted_deviation > 0:  # The last 5% of runs isn't worth any points
                        # Scale all the normalized deviations so that the mean is worth 1 but the worse stays 0
                        normalized_deviation = (adjusted_deviation/adjusted_standard_deviation) * (1/(adjusted_mean_deviation/adjusted_standard_deviation))
                        # Bonus points for long games
                        length_bonus = (1+(wr_time/TIME_BONUS_DIVISOR))
                        # More people means more accurate relative time and more optimised/hard to reach high times
                        certainty_adjustment = 1-1/original_population

                        # Give points
                        self._points = ((normalized_deviation * certainty_adjustment) ** 2) * length_bonus * 10
                        # Set names
                        game_category = re.split("/|#", leaderboard["data"]["weblink"][leaderboard["data"]["weblink"].rindex("com/")+4:].replace("_", " ").title())
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
    _points = 0
    _name = ""
    _id = ""
    _banned = False
    _point_distribution_str = ""

    def __init__(self, id_or_name: str) -> None:
        self._id = id_or_name
        self._name = id_or_name

    def __str__(self) -> str:
        return "User: <{}, {}, {}{}>".format(self._name, ceil(self._points * 100) / 100, self._id, "(Banned)" if self._banned else "")

    def set_code_and_name(self) -> None:
        url = "https://www.speedrun.com/api/v1/users/{user}".format(user=self._id)
        infos = get_file(url)

        self._id = infos["data"]["id"]
        self._name = infos["data"]["names"].get("international")
        japanese_name = infos["data"]["names"].get("japanese")
        if japanese_name: self._name += " ({})".format(japanese_name)
        if infos["data"]["role"] == "banned":
            self._banned = True
            self._points = 0

    def set_points(self) -> None:
        counted_runs = []

        def set_points_thread(pb):
            try:
                # Check if it's a valid run (has a category AND has video verification)
                if pb["run"]["category"] and pb["run"].get("videos"):
                    # Get a list of the game's subcategory variables
                    url = "https://www.speedrun.com/api/v1/games/{game}/variables".format(game=pb["run"]["game"])
                    game_variables = get_file(url)
                    game_subcategory_ids = []
                    for game_variable in game_variables["data"]:
                        if game_variable["is-subcategory"]:
                            game_subcategory_ids.append(game_variable["id"])

                    pb_subcategory_variables = {}
                    # For every variable in the run...
                    for pb_var_id, pb_var_value in pb["run"]["values"].items():
                        # ...find if said variable is one of the game's subcategories...
                        if pb_var_id in game_subcategory_ids:
                            # ... and add it to the run's subcategory variables
                            pb_subcategory_variables[pb_var_id] = pb_var_value

                    run = Run(pb["run"]["id"], pb["run"]["times"]["primary_t"], pb["run"]["game"], pb["run"]["category"], pb_subcategory_variables, pb["run"]["level"])
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
            threads = []
            for pb in pbs["data"]:
                threads.append(Thread(target=set_points_thread, args=(pb,)))
            for t in threads:
                while True:
                    try:
                        if active_count() <= 8:
                            t.start()
                            break
                    except RuntimeError as error:
                        print("RuntimeError: Can't start {}th thread. Trying to just wait a bit as I don't have a better way to deal w/ it atm.".format(active_count()+1))
                        sleep(0.5)
            for t in threads: t.join()

            # Sum up the runs' score
            counted_runs.sort(key=lambda r: r._points, reverse=True)
            run_str_lst = []
            biggest_str_length = 0
            for run in counted_runs:
                self._points += run._points
                run_str = ("{game} - {category}{level}".format(game=run.game_name,
                                                               category=run.category_name,
                                                               level=" ({})".format(run.level_name) if run.level_name else ""))
                run_pts = ceil((run._points * 100)) / 100
                run_str_lst.append((run_str, run_pts))
                biggest_str_length = max(biggest_str_length, len(run_str))

            self._point_distribution_str = "\n{:<{}} | Points\n{} | -----".format("Game - Category (Level)", biggest_str_length, "-"*biggest_str_length)
            for run_infos in run_str_lst:
                self._point_distribution_str += "\n{game_cat_lvl:<{length}} | {points:.2f}".format(game_cat_lvl=run_infos[0], length=biggest_str_length, points=run_infos[1])

            if self._banned:
                self._points = 0  # In case the banned flag has been set mid-thread or the user doesn't have at least 1 point
        else:
            self._points = 0


def get_file(p_url: str, p_headers=None) -> dict:
    """
    Returns the content of "url" parsed as JSON dict.

    Parameters
    ----------
    p_url : str   # The url to query
    """
    global session
    print(p_url)  # debugstr
    while True:
        try:
            rawdata = session.get(p_url, headers=p_headers)
        except requests.exceptions.ConnectionError as exception:  # Connexion error
            raise UserUpdaterError({"error": "Can't establish connexion to speedrun.com", "details": exception})

        try:
            jsondata = rawdata.json()
        except (json.decoder.JSONDecodeError, simplejson.scanner.JSONDecodeError) as exception:  # Didn't recieve a JSON file ...
            try:
                rawdata.raise_for_status()
            except requests.exceptions.HTTPError as exception:  # ... because it's an HTTP error
                if rawdata.status_code in HTTP_RETRYABLE_ERRORS:
                    print("WARNING: {}. Retrying in {} seconds.".format(exception.args[0], HTTPERROR_RETRY_DELAY))  # debugstr
                    sleep(HTTPERROR_RETRY_DELAY)
                    # No break or raise as we want to retry
                else:
                    raise UserUpdaterError({"error": "HTTPError {}".format(rawdata.status_code), "details": exception.args[0]})
            else:  # ... we don't know why (elevate the exception)
                print("ERROR/WARNING: rawdata=({})\'{}\'\n".format(type(rawdata), rawdata)) # debugstr
                raise UserUpdaterError({"error": "JSONDecodeError", "details": "{} in:\n{}".format(exception.args[0],rawdata)})

        else:
            if "status" in jsondata:  # Speedrun.com custom error
                if jsondata["status"] in HTTP_RETRYABLE_ERRORS:
                    print("WARNING: {}. {}. Retrying in {} seconds.".format(jsondata["status"], jsondata["message"], HTTPERROR_RETRY_DELAY))  # debugstr
                    sleep(HTTPERROR_RETRY_DELAY)
                    # No break or raise as we want to retry
                else:
                    raise SpeedrunComError({"error": "{} (speedrun.com)".format(jsondata["status"]), "details": jsondata["message"]})

            else:  # No error
                return (jsondata)


def get_updated_user(p_user_id: str) -> str:
    """Called from flask_app and AutoUpdateUsers.run()"""
    global session
    global worksheet
    global gs_client
    global threadsException
    threadsException = []
    text_output = p_user_id
    result_state = "info"

    try:
        user = User(p_user_id)
        print("{}\n{}".format(SEPARATOR, user._name))  # debugstr

        try:
            user.set_code_and_name()
        except SpeedrunComError as exception:
            # ID doesn't exists on speedrun.com but it does in the database, remove it
            player = flask_app.Player.query.get(user._name)
            if (player):
                text_output = ("User ID \"{}\" not found on speedrun.com. \n"
                              "Removed it from the database.".format(user._id))
                result_state = "warning"
                flask_app.db.session.delete(player)
                flask_app.db.session.commit()
            else:
                text_output = ("User \"{}\" not found. \n"
                              "Make sure the name or ID is typed properly. It's possible the user you're looking for changed its name. "
                              "In case of doubt, use its ID.".format(user._id))
                result_state = "warning"
        else:
            #Setup a few checks
            player = flask_app.Player.query.get(user._id)

            # If user doesn't exists or enough time passed since last update
            if not (player and (datetime.now()-player.last_update).days < 1):

                user.set_points()
                if threadsException == []:

                    print("\nLooking for {}".format(user._id))  # debugstr
                    timestamp = strftime("%Y-%m-%d %H:%M")

                    # If user exists, update the database entry
                    if player:
                        text_output = "{} found. Updated its entry.".format(user)
                        result_state = "success"
                        flask_app.Player.query.filter(flask_app.Player.user_id == user._id).\
                                        update({"user_id": user._id,
                                                "name": user._name,
                                                "score": user._points,
                                                "last_update": timestamp})
                        flask_app.db.session.commit()

                    # If user not found and has points, add it to the database
                    elif user._points >= 1:
                        text_output = "{} not found. Added a new row.".format(user)
                        result_state = "success"
                        player = flask_app.Player(user_id = user._id,
                                                  name = user._name,
                                                  score = user._points,
                                                  last_update = timestamp)
                        flask_app.db.session.add(player)
                        flask_app.db.session.commit()
                    else:
                        text_output = "Not inserting new data as {} {}.".format(user, "is banned" if user._banned else "has a score lower than 1.")
                        result_state = "warning"
                    text_output += user._point_distribution_str

                else:
                    error_str_list = []
                    for e in threadsException: error_str_list.append("Error: {}\n{}".format(e["error"], e["details"]))
                    error_str_counter = Counter(error_str_list)
                    errors_str = "{0}\nhttps://github.com/Avasam/Global_Speedrunning_Scoreboard/issues\nNot updloading data as some errors were caught during execution:\n{0}\n".format(SEPARATOR)
                    for error, count in error_str_counter.items(): errors_str += "[x{}] {}\n".format(count, error)
                    text_output += ("\n" if text_output else "") + errors_str
                    result_state = "danger"
            else:
                text_output = "This user has already been updated in the last 24h"
                result_state = "warning"

        print(text_output)
        return ({'state':result_state, 'rank':None, 'name':user._name, 'score':floor(user._points), 'last_updated':strftime("%Y-%m-%d %H:%M"), 'user_id':user._id, 'message':text_output})

    except httplib2.ServerNotFoundError as exception:
        raise UserUpdaterError({"error": "Server not found",
                                "details": "{}\nPlease make sure you have an active internet connection".format(exception)})
    except (requests.exceptions.ChunkedEncodingError, ConnectionAbortedError) as exception:
        raise UserUpdaterError({"error": "Connexion interrupted", "details": exception})
    except requests.exceptions.ConnectionError as exception:
        raise UserUpdaterError({"error": "Can't connect to Google Sheets", "details": exception})


import flask_app
