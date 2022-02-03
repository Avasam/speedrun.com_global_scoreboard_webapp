"""
Provides the API endpoints for consuming and producing REST requests and
responses within the Global Scoreboard context
"""
from __future__ import annotations
from typing import cast, Optional, TYPE_CHECKING

from datetime import datetime
from flask import Blueprint, jsonify, request
from markupsafe import escape
from sqlalchemy import exc
from sqlalchemy.sql.schema import Column
from sqlalchemy.sql.sqltypes import String

from api.api_wrappers import authentication_required
from models.exceptions import UnderALotOfPressure, UnhandledThreadException, UserUpdaterError
from models.core_models import Player
from services.user_updater import get_updated_user
from services.utils import map_to_dto
import configs

api = Blueprint("global_scoreboard_api", __name__)


@api.route("/players", methods=("GET",))
def get_all_players():
    country_code_str: Optional[str] = request.args.get("region")
    if country_code_str is None:
        return jsonify(map_to_dto(Player.get_all()))
    country_codes = list(set(country_code_str.split(",")))
    return jsonify(Player.get_by_country_code(country_codes)), 200, {"Access-Control-Allow-Origin": "*"}


@api.route("/players/<user_id>/score-details", methods=("GET",))
def get_player_score_details(user_id: str):
    player = Player.get(user_id)
    if player:
        return player.score_details or ""
    return "", 404


@api.route("/players/<name_or_id>/update", methods=("POST",))
def update_player(name_or_id: str):
    try:
        if configs.bypass_update_restrictions:
            return __do_update_player_bypass_restrictions(name_or_id)
        # pylint: disable=no-value-for-parameter # TODO: Raise this issue upstream
        return __do_update_player(name_or_id)  # type: ignore # TODO: Raise this issue upstream
    except UserUpdaterError as exception:
        error_message = f"Error: {exception.args[0]['error']}\n{exception.args[0]['details']}"
        return error_message, 424
    except UnhandledThreadException as exception:
        error_message = f"{type(exception).__name__}: {exception.args[0]}"
        return error_message, 500


def __do_update_player_bypass_restrictions(name_or_id: str, current_user: Optional[Player] = None):
    try:
        result = get_updated_user(name_or_id)
    except UnderALotOfPressure:
        # Meme code for meme error
        return "", 418
    finally:
        # Upon update completing, allow the user to update again
        if current_user:
            __currently_updating_from.pop(current_user.user_id, None)
        __currently_updating_to.pop(name_or_id, None)
    return jsonify(result), 400 if result["state"] == "warning" else 200


if TYPE_CHECKING:
    ColumnString = Column[String]  # pylint: disable=unsubscriptable-object
__currently_updating_from: dict[ColumnString, datetime] = {}
__currently_updating_to: dict[str, datetime] = {}


@authentication_required
def __do_update_player(current_user: Player, name_or_id: str):
    global __currently_updating_from  # pylint: disable=global-variable-not-assigned
    global __currently_updating_to  # pylint: disable=global-variable-not-assigned
    now = datetime.now()
    minutes_5 = 5 * 60

    # Check if the current user is already updating someone
    # or if the player to be updated is currently being updated
    if current_user.user_id in __currently_updating_from:
        seconds_left = minutes_5 - (now - __currently_updating_from[current_user.user_id]).total_seconds()
        if seconds_left > 0:
            return {"messageKey": "current_user", "timeLeft": seconds_left}, 409
    if name_or_id in __currently_updating_to:
        seconds_left = minutes_5 - (now - __currently_updating_to[name_or_id]).total_seconds()
        if seconds_left > 0:
            return {"messageKey": "name_or_id", "timeLeft": seconds_left}, 409
    __currently_updating_from[current_user.user_id] = now
    __currently_updating_to[name_or_id] = now

    return __do_update_player_bypass_restrictions(name_or_id, current_user=current_user)


@api.route("/players/current/friends", methods=("GET",))
@authentication_required
def get_friends_current(current_user: Player):
    field: Optional[str] = request.args.get("field")
    friends_dto = map_to_dto(current_user.get_friends())

    if field is None:
        return jsonify(friends_dto)
    try:
        return jsonify([friend[cast(str, field)] for friend in friends_dto])
    except KeyError:
        return "", 400


@api.route("/players/current/friends/<user_id>", methods=("PUT",))
@authentication_required
def put_friends_current(current_user: Player, user_id: str):
    escaped_id = escape(user_id)
    if not escaped_id.isalnum():
        return jsonify({"message": "/user_id is not a valid user id", "authenticated": True}), 400
    if current_user.user_id == escaped_id:
        return "You can't add yourself as a friend!", 422
    try:
        result = current_user.befriend(user_id)
    except exc.IntegrityError:
        return f"User ID '{escaped_id}' is already one of your friends."
    else:
        if result:
            return f"Successfully added user ID '{escaped_id}' as a friend."
        return "You can't add yourself as a friend!", 422


@api.route("/players/current/friends/<user_id>", methods=("DELETE",))
@authentication_required
def delete_friends_current(current_user: Player, user_id: str):
    escaped_id = escape(user_id)
    if not escaped_id.isalnum():
        return jsonify({"message": "/user_id is not a valid user id", "authenticated": True}), 400
    if current_user.unfriend(user_id):
        return f"Successfully removed user ID '{escaped_id}' from your friends."
    return f"User ID '{escaped_id}' isn't one of your friends."
