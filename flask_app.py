#!/usr/bin/python
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from user_updater import update_user, UserUpdaterError, auto_update_users
import traceback
import configs


app = Flask(__name__)
app.config['DEBUG'] = configs.debug
SQLALCHEMY_DATABASE_URI = "mysql+mysqlconnector://{username}:{password}@{hostname}/{databasename}".format(
    username="Avasam",
    password=configs.sql_password,
    hostname=configs.sql_hostname,
    databasename=configs.sql_databasename,
)
app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_POOL_RECYCLE"] = 299
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = configs.sql_track_modifications

db = SQLAlchemy(app)


class Player(db.Model):
    __tablename__ = "player"

    user_id = db.Column(db.String(8), primary_key=True)
    name = db.Column(db.String(32), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    last_update = db.Column(db.DateTime())


def write_text(s):
    pass

@app.route('/', methods=["GET", "POST"])
def index():
    if request.method == "GET":
        return render_template('index.html', players=Player.query.order_by(Player.score.desc()).filter(Player.score>0))
    elif request.method == "POST":
        try:
            result = update_user(request.form["user_name_or_id"])
            write_text(result)
        except UserUpdaterError as exception:
            print("\n{}\n{}".format(exception.args[0]["error"], exception.args[0]["details"]))
            write_text(exception.args[0]["details"])
        except Exception as exception:
            print("\nError: Unknown\n{}".format(traceback.format_exc()))
            write_text(traceback.format_exc())
        finally:
            return redirect(url_for('index'))

#@app.route('/auto_update_starter')
#def auto_update_starter():
#    auto_update_users()
