#!/usr/bin/python
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, logout_user, login_user, UserMixin
from user_updater import update_user, UserUpdaterError, get_file
import traceback
import configs

# Setup Flask app
app = Flask(__name__)
app.config['DEBUG'] = configs.debug
app.config["PREFERRED_URL_SCHEME"] = "https"

# Setup SQLAlchemy
SQLALCHEMY_DATABASE_URI = "mysql+mysqlconnector://{username}:{password}@{hostname}/{databasename}".format(
    username="Avasam",
    password=configs.sql_password,
    hostname=configs.sql_hostname,
    databasename=configs.sql_databasename)
app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_POOL_RECYCLE"] = 299
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = configs.sql_track_modifications
db = SQLAlchemy(app)

class Player(db.Model, UserMixin):
    __tablename__ = "player"

    user_id = db.Column(db.String(8), primary_key=True)
    name = db.Column(db.String(32), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    last_update = db.Column(db.DateTime())

    def get_id(self):
        return self.user_id

# Setup Flask-Login
app.config["SECRET_KEY"] = configs.secret_key
login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return Player.query.get(user_id)





def write_text(s):
    pass

@app.route('/', methods=["GET", "POST"])
def index():
    action = request.form.get("action")
    if request.method == "GET":
        return render_template('index.html', players=Player.query.order_by(Player.score.desc(), Player.name).filter(Player.score>0))
    elif request.method == "POST" and action:
        if action == "update-user":
            try:
                result = update_user(request.form.get("name-or-id"))
                write_text(result)
            except UserUpdaterError as exception:
                print("\n{}\n{}".format(exception.args[0]["error"], exception.args[0]["details"]))
                write_text(exception.args[0]["details"])
            except Exception as exception:
                print("\nError: Unknown\n{}".format(traceback.format_exc()))
                write_text(traceback.format_exc())
            finally:
                return redirect(url_for('index'))

        elif action == "login":
            api_key = request.form.get("api-key")

            try: # Get user from speedrun.com using the API key
                user_id = get_file("https://www.speedrun.com/api/v1/profile", {"X-API-Key": api_key})["data"]["id"]
            except Exception as e:
                print(e)
                user_id = None
            if(user_id): # Confirms the API key is valid
                #TODO: optionally update that user
                login_user(load_user(user_id))
                return redirect(url_for('index'))
            else:
                write_text("Invalid key")

        elif action == "logout":
            logout_user()
            return redirect(url_for('index'))
    return redirect(url_for('index'))
