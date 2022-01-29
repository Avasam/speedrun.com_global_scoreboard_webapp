#!/usr/bin/python3.9
# -*- coding: utf-8 -*-
"""
Ava's Global Speedrunning Scoreboard
Copyright (C) 2020 Samuel Therrien

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

Contact:
samuel.06@hotmail.com
"""

from flask import Flask, send_file, send_from_directory, redirect, url_for

from api.core_api import api as core_api
from api.game_search_api import api as game_search_api
from api.global_scoreboard_api import api as global_scoreboard_api
from api.tournament_scheduler_api import api as tournament_scheduler_api
from models.core_models import db
import configs

# Setup Flask app
app = Flask(__name__, static_folder="assets")
app.config["ENV"] = configs.flask_environment
app.config["DEBUG"] = configs.debug
app.config["PREFERRED_URL_SCHEME"] = "https"
app.config["SECRET_KEY"] = configs.secret_key
app.config["TEMPLATE_AUTO_RELOAD"] = configs.auto_reload_templates

# Setup access to the API
app.register_blueprint(core_api, url_prefix="/api")
app.register_blueprint(game_search_api, url_prefix="/api")
app.register_blueprint(global_scoreboard_api, url_prefix="/api")
app.register_blueprint(tournament_scheduler_api, url_prefix="/api")

# Setup the dal (SQLAlchemy)
SQLALCHEMY_DATABASE_URI = "mysql+{connector}://{username}:{password}@{hostname}/{database_name}".format(
    connector=configs.sql_connector,
    username=configs.sql_username,
    password=configs.sql_password,
    hostname=configs.sql_hostname,
    database_name=configs.sql_database_name)
app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_POOL_RECYCLE"] = 299
app.config["SQLALCHEMY_POOL_SIZE"] = 3  # PythonAnywhere allows 3 connections per webworker
app.config["SQLALCHEMY_MAX_OVERFLOW"] = 0
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = configs.sql_track_modifications
db.app = app  # type: ignore # TODO: Raise issue upstream
db.init_app(app)


@app.route("/global-scoreboard/", defaults={"asset": "index.html"})
@app.route("/global-scoreboard/<path:asset>", methods=["GET"])
def global_scoreboard(asset: str):
    if asset[:6] == "static":
        return send_from_directory("../global-scoreboard/build/", asset)
    return send_file("../global-scoreboard/build/index.html")


@app.route("/tournament-scheduler/", defaults={"asset": "index.html"})
@app.route("/tournament-scheduler/<path:asset>", methods=["GET"])
def tournament_scheduler(asset: str):
    if asset[:6] == "static":
        return send_from_directory("../tournament-scheduler/build/", asset)
    return send_file("../tournament-scheduler/build/index.html")


@app.route("/", methods=["GET"])
def index():
    return redirect(url_for("global_scoreboard"))


if __name__ == "__main__":
    if configs.flask_environment == "development":
        print(" * Running on http://localhost:5000/ (Press CTRL+C to quit)")
        app.run(host="0.0.0.0")  # nosec
    else:
        app.run()
