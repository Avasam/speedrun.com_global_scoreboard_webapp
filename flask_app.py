#!/usr/bin/python
# -*- coding: utf-8 -*-

##########################################################################
# Ava's Global Speedrunning Scoreboard
# Copyright (C) 2020 Samuel Therrien
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
from api import api
from datetime import date
from flask import Flask, send_from_directory, render_template, Response, request, redirect, url_for
from flask_login import LoginManager, logout_user, login_user, current_user
from models import db, Player
from sqlalchemy import exc
from typing import List, Union
from user_updater import get_updated_user
from utils import get_file, UserUpdaterError, SpeedrunComError
import configs
import json
import traceback

# Setup Flask app
app = Flask(__name__, static_folder="assets")
app.config["ENV"] = configs.flask_environment
app.config["DEBUG"] = configs.debug
app.config["PREFERRED_URL_SCHEME"] = "https"
app.config["SECRET_KEY"] = configs.secret_key
app.config["TEMPLATE_AUTO_RELOAD"] = configs.auto_reload_templates

# Setup access to the API
app.register_blueprint(api, url_prefix="/api")
if (configs.allow_cors):
    from flask_cors import CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})

# Setup the dal (SQLAlchemy)
SQLALCHEMY_DATABASE_URI = "mysql+{connector}://{username}:{password}@{hostname}/{database_name}".format(
    connector=configs.sql_connector,
    username=configs.sql_username,
    password=configs.sql_password,
    hostname=configs.sql_hostname,
    database_name=configs.sql_database_name)
app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_POOL_RECYCLE"] = 299
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = configs.sql_track_modifications
db.init_app(app)

# Setup Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id: str) -> Union[Player, None]:
    # type: (str) -> Union[Player, None]
    return Player.get(user_id)


@app.route('/global-scoreboard', defaults={'asset': 'index.html'})
@app.route('/global-scoreboard/<path:asset>', methods=["GET"])
def react_app(asset: str):
    return send_from_directory('global-scoreboard/build/', asset)


@app.route('/tournament-scheduler', defaults={'asset': 'index.html'})
@app.route('/tournament-scheduler/<path:asset>', methods=["GET"])
def tournament_scheduler(asset: str):
    return send_from_directory('tournament-scheduler/build/', asset)


@app.route('/', methods=["GET", "POST"])
def index():
    global result
    form_action: str = request.form.get("action")
    arg_action: str = request.args.get('action')
    if request.method == "GET":
        if arg_action == "ajaxDataTable":
            players = Player.get_all()
            return Response(
                response=json.dumps(
                    {'data': [(dict(player.items())) for player in players]}, default=str),
                status=200,
                mimetype="application/json")
        else:
            friends: List[Player] = [] if not current_user.is_authenticated else current_user.get_friends()
            return render_template(
                'index.html',
                friends=friends,
                bypass_update_restrictions=str(
                    configs.bypass_update_restrictions).lower(),
                current_year=str(date.today().year)
            )

    elif request.method == "POST" and form_action:
        friend_id: str = request.form.get("friend-id")
        if form_action == "update-user":
            if current_user.is_authenticated or configs.bypass_update_restrictions:
                try:
                    result = get_updated_user(request.form.get("name-or-id"))
                except UserUpdaterError as exception:
                    print("\n{}\n{}".format(exception.args[0]["error"], exception.args[0]["details"]))
                    result = {"state": "danger",
                              "message": exception.args[0]["details"]}
                except Exception:
                    print("\nError: Unknown\n{}".format(traceback.format_exc()))
                    result = {"state": "danger",
                              "message": traceback.format_exc()}
                finally:
                    return json.dumps(result)
            else:
                return json.dumps({'state': 'warning',
                                   'message': 'You must be logged in to update a user!'})

        elif form_action == "unfriend":
            if current_user.is_authenticated:
                if friend_id:
                    if current_user.unfriend(friend_id).rowcount > 0:
                        return json.dumps(
                            {'state': 'success',
                             'message': f"Successfully removed user ID \"{friend_id}\" from your friends."})
                    else:
                        return json.dumps({'state': 'warning',
                                           'message': f"User ID \"{friend_id}\" isn't one of your friends."})
                else:
                    return json.dumps({'state': 'warning',
                                       'message': 'You must specify a friend ID to remove!'})
            else:
                return json.dumps({'state': 'warning',
                                   'message': 'You must be logged in to remove friends!'})

        elif form_action == "befriend":
            if current_user.is_authenticated:
                if friend_id:
                    try:
                        result = current_user.befriend(friend_id)
                    except exc.IntegrityError:
                        return json.dumps({'state': 'warning',
                                           'message': f"User ID \"{friend_id}\" is already one of your friends."})
                    else:
                        if result:
                            return json.dumps({'state': 'success',
                                               'message': f"Successfully added user ID \"{friend_id}\" as a friend."})
                        else:
                            return json.dumps({'state': 'warning',
                                               'message': "You can't add yourself as a friend!"})
                else:
                    return json.dumps({'state': 'warning',
                                       'message': 'You must specify a friend ID to add!'})
            else:
                return json.dumps({'state': 'warning',
                                   'message': 'You must be logged in to add friends!'})

        elif form_action == "login":
            api_key = request.form.get("api-key")
            print("api_key = ", api_key)
            if api_key:
                try:  # Get user from speedrun.com using the API key
                    print("in try")
                    user_id = get_file("https://www.speedrun.com/api/v1/profile", {"X-API-Key": api_key})["data"]["id"]
                    print("user_id = ", user_id)
                except SpeedrunComError:
                    print("\nError: Unknown\n{}".format(traceback.format_exc()))
                    return json.dumps({'state': 'warning',
                                       'message': 'Invalid API key.'})
                except Exception:
                    print("\nError: Unknown\n{}".format(traceback.format_exc()))
                    return json.dumps({"state": "danger",
                                       "message": traceback.format_exc()})

                if user_id:  # Confirms the API key is valid
                    # TODO: optionally update that user
                    login_user(load_user(user_id))
                    return json.dumps({'state': 'success',
                                       'message': "Successfully logged in. "
                                                  "Please refresh the page if it isn't done automatically."})
                else:
                    return json.dumps({'state': 'warning',
                                       'message': 'Invalid API key.'})
            else:
                return json.dumps({'state': 'warning',
                                   'message': 'You must specify an API key to log in!'})

        elif form_action == "logout":
            logout_user()
            return redirect(url_for('index'))
    return redirect(url_for('index'))


if __name__ == '__main__':
    if configs.flask_environment == "development":
        app.run(host='0.0.0.0')
    else:
        app.run()
