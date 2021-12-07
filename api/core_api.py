"""
Provides the core API endpoints for consuming and producing REST requests and
responses. Like login and user management.
"""
from typing import Optional

from datetime import datetime, timedelta
from flask import Blueprint, current_app, jsonify, request
import jwt

from api.api_wrappers import authentication_required
from models.core_models import JSONObjectType
from models.tournament_scheduler_models import Player
import configs

api = Blueprint("core_api", __name__)


@api.route("/login", methods=("POST",))
def login():
    data: Optional[JSONObjectType] = request.get_json()
    try:
        api_key = data["speedruncomApiKey"] if data else ""
        if not isinstance(api_key, str):
            raise TypeError("api_key is not a string")
    except (KeyError, TypeError) as error:
        return jsonify({"message": str(error), "authenticated": False}), 400
    player, error_message = Player.authenticate(api_key)

    if not player:
        return jsonify({"message": error_message, "authenticated": False}), 401

    token: str = jwt.encode({
        "sub": player.user_id,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(days=1)},
        current_app.config["SECRET_KEY"])
    # Note: https://github.com/jpadilla/pyjwt/issues/529
    if isinstance(token, bytes):
        token = token.decode("UTF-8")
    return jsonify({
        "token": token,
        "user": {
            "userId": player.user_id,
            "name": player.name,
        }})


@api.route("/configs", methods=("GET",))
def get_configs():
    return jsonify({
        "bypassUpdateRestrictions": configs.bypass_update_restrictions,
        "lastUpdatedDays": configs.last_updated_days,
    })


@api.route("/users/current", methods=("GET",))
@authentication_required
def get_user_current(current_user: Player):
    return jsonify({
        "user": {
            "userId": current_user.user_id,
            "name": current_user.name,
        }})
