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
from flask import Flask
from flask_login import LoginManager, UserMixin
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from typing import Union
import configs

# Setup Flask app
app = Flask(__name__, static_folder="assets")
app.config["ENV"] = configs.flask_environment
app.config['DEBUG'] = configs.debug
app.config["PREFERRED_URL_SCHEME"] = "https"
app.config["TEMPLATE_AUTO_RELOAD"] = configs.auto_reload_templates

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
db = SQLAlchemy(app)

friend = db.Table(
    'friend',
    db.Column(
        'user_id',
        db.String(8),
        db.ForeignKey('player.user_id')),
    db.Column(
        'friend_id',
        db.String(8),
        db.ForeignKey('player.user_id'))
)


class Player(db.Model, UserMixin):
    __tablename__ = "player"

    user_id = db.Column(db.String(8), primary_key=True)
    name = db.Column(db.String(32), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    last_update = db.Column(db.DateTime())

    @staticmethod
    def get_all():
        sql = text("SELECT *, rank FROM ( "
                   "    SELECT *, "
                   "        IF(score = @_last_score, @cur_rank := @cur_rank, @cur_rank := @_sequence) AS rank, "
                   "        @_sequence := @_sequence + 1, "
                   "        @_last_score := score "
                   "    FROM player, (SELECT @cur_rank := 1, @_sequence := 1, @_last_score := NULL) r "
                   "    ORDER BY score DESC "
                   ") ranked;")
        return db.engine.execute(sql).fetchall()

    def get_friends(self):
        sql = text("SELECT DISTINCT friend_id FROM friend "
                   "WHERE friend.user_id = '{user_id}';".format(
                       user_id=self.user_id))
        return [friend_id[0] for friend_id in db.engine.execute(sql).fetchall()]

    def befriend(self, friend_id: str) -> bool:
        if self.user_id == friend_id:
            return False
        sql = text("INSERT INTO friend (user_id, friend_id) "
                   "VALUES ('{user_id}', '{friend_id}');".format(
                       user_id=self.user_id,
                       friend_id=friend_id))
        return db.engine.execute(sql)

    def unfriend(self, friend_id: str) -> Union[bool]:
        sql = text("DELETE FROM friend "
                   "WHERE user_id = '{user_id}' AND friend_id = '{friend_id}';".format(
                       user_id=self.user_id,
                       friend_id=friend_id))
        return db.engine.execute(sql)

    # Override from UserMixin for Flask-Login
    def get_id(self):
        return self.user_id


# Setup Flask-Login
app.config["SECRET_KEY"] = configs.secret_key
login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    return Player.query.get(user_id)
