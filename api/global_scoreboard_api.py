"""
Provides the API endpoints for consuming and producing REST requests and
responses within the Global Scoreboard context
"""
from api.api_wrappers import authentication_required
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from models.core_models import Player
from sqlalchemy import exc
from typing import cast, Dict, Optional
from services.user_updater import get_updated_user
from services.utils import UnhandledThreadException, map_to_dto, UnderALotOfPressure, UserUpdaterError
import configs

api = Blueprint('global_scoreboard_api', __name__)


@api.route('/players', methods=('GET',))
def get_all_players():
    country_code_str: Optional[str] = request.args.get('region')
    if country_code_str is None:
        return jsonify(map_to_dto(Player.get_all()))
    country_codes = list(set(country_code_str.split(',')))
    return jsonify(Player.get_by_country_code(country_codes)), 200, {'Access-Control-Allow-Origin': '*'}


@api.route('/players/<id>/score-details', methods=('GET',))
def get_player_score_details(id: str):
    player = Player.get(id)
    if player:
        return player.score_details or ""
    else:
        return "", 404


@api.route('/players/<name_or_id>/update', methods=('POST',))
def update_player(name_or_id: str):
    try:
        if configs.bypass_update_restrictions:
            return __do_update_player_bypass_restrictions(name_or_id)
        else:
            return __do_update_player(name_or_id)
    except UserUpdaterError as exception:
        error_message = f"Error: {exception.args[0]['error']}\n{exception.args[0]['details']}"
        return error_message, 424
    except UnhandledThreadException as exception:
        error_message = f"{type(exception).__name__}: {exception.args[0]}"
        return error_message, 500


def __do_update_player_bypass_restrictions(name_or_id: str):
    try:
        result = get_updated_user(name_or_id)
        return jsonify(result), 400 if result["state"] == "warning" else 200
    except UnderALotOfPressure:
        # Meme code for meme error
        return "", 418


__currently_updating_from: Dict[str, datetime] = {}
__currently_updating_to: Dict[str, datetime] = {}


@authentication_required
def __do_update_player(current_user: Player, name_or_id: str):
    global __currently_updating_from
    global __currently_updating_to
    now = datetime.now()

    # Check if the current user is already updating someone
    # or if the player to be updated is currently being updated
    if current_user.user_id in __currently_updating_from \
            and now - __currently_updating_from[current_user.user_id] <= timedelta(minutes=5):
        # CONSIDER: #seconds_left = (5 * 60) - (now - __currently_updating_from[name_or_id])
        # return {"messageKey": "current_user", "timeLeft": seconds_left}, 409
        return "current_user", 409
    if name_or_id in __currently_updating_to \
            and now - __currently_updating_to[name_or_id] <= timedelta(minutes=5):
        # CONSIDER: #seconds_left = (5 * 60) - (now - __currently_updating_to[name_or_id]).seconds
        # return {"messageKey": "name_or_id", "timeLeft": seconds_left}, 409
        return "name_or_id", 409
    __currently_updating_from[current_user.user_id] = now
    __currently_updating_to[name_or_id] = now

    try:
        # Actually do the update process
        result = get_updated_user(name_or_id)
    except UnderALotOfPressure:
        # Meme code for meme error
        return "", 418
    finally:
        # Upon update completing, allow the user to update again
        __currently_updating_from.pop(current_user.user_id, None)

    return jsonify(result), 400 if result["state"] == "warning" else 200


@api.route('/players/current/friends', methods=('GET',))
@authentication_required
def get_friends_current(current_user: Player):
    field: Optional[str] = request.args.get('field')
    friends_dto = map_to_dto(current_user.get_friends())

    if field is None:
        return jsonify(friends_dto)
    try:
        return jsonify([friend[cast(str, field)] for friend in friends_dto])
    except KeyError:
        return "", 400


@api.route('/players/current/friends/<id>', methods=('PUT',))
@authentication_required
def put_friends_current(current_user: Player, id: str):
    if not id.isalnum():
        return jsonify({'message': '/id is not a valid user id', 'authenticated': True}), 400
    if current_user.user_id == id:
        return "You can't add yourself as a friend!", 422
    try:
        result = current_user.befriend(id)
    except exc.IntegrityError:
        return f"User ID \"{id}\" is already one of your friends."
    else:
        if result:
            return f"Successfully added user ID \"{id}\" as a friend."
        else:
            return "You can't add yourself as a friend!", 422


@api.route('/players/current/friends/<id>', methods=('DELETE',))
@authentication_required
def delete_friends_current(current_user: Player, id: str):
    if not id.isalnum():
        return jsonify({'message': '/id is not a valid user id', 'authenticated': True}), 400
    if current_user.unfriend(id):
        return f"Successfully removed user ID \"{id}\" from your friends."
    else:
        return f"User ID \"{id}\" isn't one of your friends."
