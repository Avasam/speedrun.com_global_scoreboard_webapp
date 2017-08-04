#!/usr/bin/python
# -*- coding: utf-8 -*-

###########################################################################
## Speedrun.com (unofficial) Global leaderboard
## Copyright (C) 2017 Samuel Therrien
##
## This program is free software: you can redistribute it and/or modify
## it under the terms of the GNU Affero General Public License as published
## by the Free Software Foundation, either version 3 of the License, or
## (at your option) any later version.
##
## This program is distributed in the hope that it will be useful,
## but WITHOUT ANY WARRANTY; without even the implied warranty of
## MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
## GNU Affero General Public License for more details.
##
## You should have received a copy of the GNU Affero General Public License
## along with this program.  If not, see <http://www.gnu.org/licenses/>.
##
## Contact:
## samuel.06@hotmail.com
###########################################################################
from collections import Counter
from math import log, ceil
import requests
import time
from threading import Thread
import traceback

SEPARATOR = "-"*64
MIN_LEADERBOARD_SIZE = 4
MIN_RANK_PERCENT = 60/100
HTTPERROR_RETRY_DELAY = 5
HTTP_RETRYABLE_ERRORS = [401, 420, 500, 502]

class UserUpdaterError(Exception):
    """ raise UserUpdaterError({"error":"On Status Label", "details":"Details of error"}) """
    pass


class Run():
    ID = ""
    game = ""
    category = ""
    variables = {}
    _place = 0
    _points = 0
    __leaderboard_size = 0

    def __init__(self, ID, game, category, variables):
        self.ID = ID
        self.game = game
        self.category = category
        self.variables = variables
        self.__set_points()

    def __str__(self):
        return "Run: <Game: {}, Category: {}, {}/{}>".format(self.game, self.category, self._place, self._leaderboard_size)

    def get_leaderboard_size_and_rank(p_game, p_category, p_variables, p_run_id=None):
        try:
            url = "https://www.speedrun.com/api/v1/leaderboards/{game}/category/{category}?video-only=true".format(game=p_game, category=p_category)
            for var_id, var_value in p_variables.items(): url += "&var-{id}={value}".format(id=var_id, value=var_value)
            leaderboard = get_file(url)
            # Manually recalculating a player's rank as leaderboards w/ only video verification may be smaller than the run originally showed
            if p_run_id:
                rank = -1
                for run in leaderboard["data"]["runs"]:
                    if run["run"]["id"] == p_run_id and run["place"] > 0:
                        rank = run["place"]
                        break
                return len(leaderboard["data"]["runs"]), rank
            else:
                return len(leaderboard["data"]["runs"])
        except UserUpdaterError as exception:
            threadsException.append(exception.args[0])
        except Exception as exception:
            threadsException.append({"error":"Unhandled", "details":traceback.format_exc()})

    def __set_leaderboard_size_and_place(self):
        self._leaderboard_size, self._place = Run.get_leaderboard_size_and_rank(self.game, self.category, self.variables, self.ID)

    def __set_points(self):
        self._points = 0
        self.__set_leaderboard_size_and_place()
        print(self)
        # Check to avoid errors
        if self._leaderboard_size > self._place and self._leaderboard_size >= MIN_LEADERBOARD_SIZE and self._place > 0:
            # Give points according to the formula
            #ROUNDUP(MAX(0;LN(MAX(1;B$2-$D$34+2))*LN(MAX(1;(-$A3)+(B$2*$D$35+2)))*(1+$D$35/$A3)))
            LN1 = log(self._leaderboard_size-MIN_LEADERBOARD_SIZE+2)
            LN2 = log(max(1,-self._place+(self._leaderboard_size*MIN_RANK_PERCENT+2)))
            self._points = ceil(max(0, LN1 * LN2 * (1+MIN_RANK_PERCENT/self._place)))

class User():
    _points = 0
    _name = ""
    _ID = ""
    _banned = False

    def __init__(self, ID_or_name):
        self._ID = ID_or_name
        self._name = ID_or_name

    def __str__(self):
        return "User: <{}, {}, {}>".format(self._name, self._points, self._ID)

    def set_code_and_name(self):
        try:
            url = "https://www.speedrun.com/api/v1/users/{user}".format(user=self._ID)
            infos = get_file(url)
            if "status" in infos: raise UserUpdaterError({"error":"{} (speedrun.com)".format(infos["status"]), "details":infos["message"]})
            if infos["data"]["role"] != "banned":
                self._ID = infos["data"]["id"]
                self._name = infos["data"]["names"].get("international")
                japanese_name = infos["data"]["names"].get("japanese")
                if japanese_name: self._name += " ({})".format(japanese_name)
            else:
                self._banned = True
                self._points = 0
        except UserUpdaterError as exception:
            threadsException.append(exception.args[0])
        except Exception:
            threadsException.append({"error":"Unhandled", "details":traceback.format_exc()})

    def set_points(self):
        counted_runs = {}
        def set_points_thread(pb):
            try:
                # Check if it's a valid run (has a category, isn't an IL, has video verification)
                if pb["run"]["category"] and not pb["run"]["level"] and pb["run"].get("videos"): # TODO?: allow runs for games that have levels, but no category?
                    #Get a list of the game's subcategory variables
                    url = "https://www.speedrun.com/api/v1/games/{game}/variables?max=200".format(game=pb["run"]["game"])
                    game_variables = get_file(url)
                    game_subcategory_ids = []
                    for game_variable in game_variables["data"]:
                        if game_variable["is-subcategory"] == True:
                            game_subcategory_ids.append(game_variable["id"])

                    pb_subcategory_variables = {}
                    # For every variable in the run...
                    for pb_var_id, pb_var_value in pb["run"]["values"].items():
                        # ...find if said variable is one of the game's subcategories...
                        if pb_var_id in game_subcategory_ids:
                            # ... and add it to the run's subcategory variables
                            pb_subcategory_variables[pb_var_id] = pb_var_value

                    run = Run(pb["run"]["id"], pb["run"]["game"], pb["run"]["category"], pb_subcategory_variables)
                    # If a category has already been counted, only keep the one that's worth the most.
                    # This can happen in leaderboards with multiple coop runs or multiple subcategories.
                    if run.category in counted_runs:
                        counted_runs[run.category] = max(counted_runs[run.category], run._points)
                    else:
                        counted_runs[run.category] = run._points
            except UserUpdaterError as exception:
                threadsException.append(exception.args[0])
            except Exception as exception:
                threadsException.append({"error":"Unhandled", "details":traceback.format_exc()})

        try:
            if not self._banned:
                url = "https://www.speedrun.com/api/v1/users/{user}/personal-bests".format(user=self._ID)
                PBs = get_file(url)
                if "status" in PBs: raise UserUpdaterError({"error":"{} (speedrun.com)".format(PBs["status"]), "details":PBs["message"]})
                self._points = 0
                threads = []
                for pb in PBs["data"]:
                    threads.append(Thread(target=set_points_thread, args=(pb,)))
                for t in threads:
                    while True:
                        try:
                            t.start()
                            break
                        except RuntimeError:
                            print("RuntimeError: can't start new thread. Trying to just wait a bit as I don't have a better way to deal w/ it atm.")
                            time.sleep(0.5)
                for t in threads: t.join()
                # Sum up the runs' score
                for points in counted_runs.values():
                    self._points += points
                if self._banned: self._points = 0 # In case the banned flag has been set mid-thread
            else: self._points = 0
        except UserUpdaterError as exception:
            threadsException.append(exception.args[0])
        except Exception as exception:
            threadsException.append({"error":"Unhandled", "details":traceback.format_exc()})


def get_file(p_url, p_headers=None):
    """
    Returns the content of "url" parsed as JSON dict.

    Parameters
    ----------
    url : str   # The url to query
    """
    print("\n{}".format(p_url)) #debugstr
    while True:
        try:
            data = requests.get(p_url, headers=p_headers)
            data.raise_for_status()
            break
        except requests.exceptions.ConnectionError as exception:
            raise UserUpdaterError({"error":"Can't establish connexion to speedrun.com", "details":exception})
        except requests.exceptions.HTTPError as exception:
            if data.status_code in HTTP_RETRYABLE_ERRORS:
                print("{}. Retrying in {} seconds.".format(exception.args[0], HTTPERROR_RETRY_DELAY)) #debugstr
                time.sleep(HTTPERROR_RETRY_DELAY)
            else: raise UserUpdaterError({"error":"HTTPError {}".format(data.status_code), "details":exception.args[0]})

    data = data.json()

    if type(data) != dict: print("{}:{}".format(type(data), data)) #debugstr
    if "error" in data: raise UserUpdaterError({"error":data["status"], "details":data["error"]})
    return(data)


def update_user(p_user_name_or_ID):
    """Called from flask_app and AutoUpdateUsers.run()"""
    global threadsException
    threadsException = []

    user = User(p_user_name_or_ID)
    print("{}\n{}".format(SEPARATOR, user._name)) #debugstr

    user.set_code_and_name()
    user.set_points()

    textOutput = ""
    if threadsException == []:
        print("\nLooking for {}".format(user._ID)) #debugstr

        # Try and find the user by its ID
        player = flask_app.Player.query.get(user._ID)
        timestamp = time.strftime("%Y/%m/%d %H:%M")

        # If user exists, update the database entry
        if player:
            textOutput = "{} found. Updated its entry.".format(user)
            flask_app.Player.query.filter(flask_app.Player.user_id == user._ID).\
                         update({"user_id": user._ID,
                                 "name": user._name,
                                 "score": user._points,
                                 "last_update": timestamp})
            flask_app.db.session.commit()
        # If user not found and has points, add it to the database
        elif user._points > 0:
            textOutput = "{} not found. Added a new row.".format(user)
            player = flask_app.Player(user_id = user._ID,
                                      name = user._name,
                                      score = user._points,
                                      last_update = timestamp)
            flask_app.db.session.add(player)
            flask_app.db.session.commit()
        else:
            textOutput = "Not inserting new data as {} has a score of 0.".format(user)

    else:
        errorStrList = []
        for e in threadsException: errorStrList.append("Error: {}\n{}".format(e["error"], e["details"]))
        errorStrCounter = Counter(errorStrList)
        errorsStr = "{0}\nNot updloading data as some errors were caught during execution:\n{0}\n".format(SEPARATOR)
        for error, count in errorStrCounter.items(): errorsStr += "[x{}] {}\n".format(count, error)
        textOutput += ("\n" if textOutput else "") + errorsStr

    print(textOutput)
    return(textOutput)


#!Autoupdater
BASE_URL = "https://www.speedrun.com/api/v1/users?orderby=signup&max=200&offset=20000"
def auto_update_users():
    url = BASE_URL
    while True:
        users = get_file(url)
        for user in users["data"]:
            update_user(user["id"])

        link_found = False
        for link in users["pagination"]["links"]:
            if link["rel"] == "next":
                url = link["uri"]
                link_found = True
        if not link_found: url = BASE_URL

import flask_app
