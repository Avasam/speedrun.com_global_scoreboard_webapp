"""
api.py
- provides the API endpoints for consuming and producing REST requests and responses
"""
from datetime import datetime, timedelta
from flask import Blueprint, current_app, jsonify, request
from functools import wraps
from models import map_to_dto, GameValues, Player, Schedule, TimeSlot
from sqlalchemy import exc
from typing import Any, Dict, List, Optional, Union, Tuple
from user_updater import get_updated_user
from utils import UserUpdaterError
import configs
import jwt
import traceback

# TODO: use and typecheck / typeguard JSONType
__JSONTypeBase = Union[str, int, float, bool, None, Dict[str, Any], List[Any]]
JSONType = Union[str, int, float, bool, None, Dict[str, __JSONTypeBase], List[__JSONTypeBase]]

"""
General context
"""


def authentication_required(f):
    @wraps(f)
    def _verify(*args, **kwargs):
        auth_headers: List[str] = request.headers.get('Authorization', '').split()

        invalid_msg = {
            'message': 'Invalid token. Authentification and / or authentication required',
            'authenticated': False
        }
        expired_msg = {
            'message': 'Expired token. Reauthentication required.',
            'authenticated': False
        }

        if len(auth_headers) != 2:
            return jsonify(invalid_msg), 401

        try:
            token = auth_headers[1]
            data = jwt.decode(token, current_app.config['SECRET_KEY'])
            player: Player = Player.query.filter_by(user_id=data['sub']).first()
            if not player:
                raise RuntimeError('User not found')
            return f(player, *args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify(expired_msg), 401
        except jwt.InvalidTokenError:
            return jsonify(invalid_msg), 401

    return _verify


api = Blueprint('api', __name__)


@api.route('/login', methods=('POST',))
def login():
    data: Dict[str, ] = request.get_json()
    player, error_message = Player.authenticate(data['srcApiKey'])

    if not player:
        return jsonify({'message': error_message, 'authenticated': False}), 401

    token = jwt.encode({
        'sub': player.user_id,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(days=1)},
        current_app.config['SECRET_KEY'])
    return jsonify({
        'token': token.decode('UTF-8'),
        'user': {
            'userId': player.user_id,
            'name': player.name,
        }})


@api.route('/configs', methods=('GET',))
def get_configs():
    return jsonify({
        "bypassUpdateRestrictions": configs.bypass_update_restrictions,
        "lastUpdatedDays": configs.last_updated_days,
    })


@api.route('/users/current', methods=('GET',))
@authentication_required
def get_user_current(current_user: Player):
    return jsonify({
        'user': {
            'userId': current_user.user_id,
            'name': current_user.name,
        }})


"""
Tournament Scheduler context
"""


@api.route('/schedules', methods=('GET',))
@authentication_required
def get_all_schedules(current_user: Player):
    return jsonify(map_to_dto(current_user.get_schedules()))


@api.route('/schedules/<id>', methods=('GET',))
def get_schedule(id: str):
    registration_key: Optional[str] = request.args.get('registrationKey')

    if registration_key is None:
        schedule = Schedule.get(id)
    else:
        schedule = Schedule.get_with_key(id, registration_key)

    if schedule is None:
        return '', 404

    return jsonify(schedule.to_dto())


@api.route('/schedules', methods=('POST',))
@authentication_required
def post_schedule(current_user: Player):
    data: Dict[str, ] = request.get_json()

    error_message, name, is_active, time_slots = __validate_create_schedule(data)
    if error_message is not None:
        return jsonify({'message': error_message, 'authenticated': True}), 400

    return str(current_user.create_schedule(name, is_active, time_slots)), 201


@api.route('/schedules/<id>', methods=('PUT',))
@authentication_required
def put_schedule(current_user: Player, id: str):
    data: Dict[str, ] = request.get_json()
    try:
        schedule_id = int(id)
    except ValueError:
        return jsonify({'message': '/id is not a valid number', 'authenticated': True}), 400
    error_message, name, is_active, time_slots = __validate_create_schedule(data)
    if error_message is not None:
        return jsonify({'message': error_message, 'authenticated': True}), 400

    update_success = current_user.update_schedule(schedule_id, name, is_active, time_slots)
    return "", 201 if update_success else 404


@api.route('/schedules/<id>', methods=('DELETE',))
@authentication_required
def delete_schedule(current_user: Player, id: str):
    try:
        schedule_id = int(id)
    except ValueError:
        return jsonify({'message': '/id is not a valid number', 'authenticated': True}), 400

    delete_success = current_user.delete_schedule(schedule_id)
    return "", 204 if delete_success else 404


@api.route('/time-slots/<id>/registrations', methods=('POST',))
def post_registration(id: str):
    data: Dict[str, ] = request.get_json()

    error_message, registration_key, participants = __validate_create_registration(data)
    if error_message is not None:
        return jsonify({'message': error_message, 'authenticated': True}), 400

    time_slot = TimeSlot.get_with_key(id, registration_key)
    if time_slot is None:
        return '', 404

    if (len(time_slot.registrations) >= time_slot.maximum_entries):
        return jsonify({'message': 'Registrations are full for this timeslot', 'authenticated': True}), 507

    return str(time_slot.register_participant(participants)), 201


@api.route('/registrations/<id>', methods=('PUT',))
@authentication_required
def put_registration(current_user: Player, id: str):
    data: Dict[str, ] = request.get_json()

    try:
        registration_id = int(id)
    except ValueError:
        return jsonify({'message': '/id is not a valid number', 'authenticated': True}), 400

    error_message, _, participants = __validate_create_registration(data, False)
    if error_message is not None:
        return jsonify({'message': error_message, 'authenticated': True}), 400

    update_success = current_user.update_registration(registration_id, participants)
    return "", 201 if update_success else 404


@api.route('/registrations/<id>', methods=('DELETE',))
@authentication_required
def delete_registration(current_user: Player, id: str):
    try:
        registration_id = int(id)
    except ValueError:
        return jsonify({'message': '/id is not a valid number', 'authenticated': True}), 400

    delete_success = current_user.delete_registration(registration_id)
    return "", 204 if delete_success else 404


def __validate_create_registration(
        data: Dict[str, Any],
        with_registration_key=True) \
        -> Tuple[Optional[str], str, List[str]]:
    registration_key = ""
    participants = []
    try:
        registration_key = data['registrationKey']
    except KeyError:
        if with_registration_key:
            return 'registrationKey has to be defined', registration_key, participants
    try:
        participants[:] = [x for x in data['participants'] if x]
    except KeyError:
        return 'registrationKey has to be defined', registration_key, participants
    return None, registration_key, participants


def __validate_create_schedule(data: Dict[str, Any]) -> Tuple[Optional[str], str, bool, List[Dict]]:
    name = ""
    is_active = False
    time_slot = []
    try:
        name = data['name']
    except KeyError:
        return 'name has to be defined', name, is_active, time_slot
    try:
        is_active = data['active'] is True
    except KeyError:
        return 'active has to be defined', name, is_active, time_slot
    try:
        time_slots = data['timeSlots']
    except KeyError:
        return 'timeSlots has to be defined', name, is_active, time_slot
    for time_slot in time_slots:
        try:
            time_slot['dateTime']
        except KeyError:
            return 'timeSlots.dateTime has to be defined', name, is_active, time_slot
        try:
            time_slot['maximumEntries']
        except KeyError:
            return 'timeSlots.maximumEntries has to be defined', name, is_active, time_slot
        try:
            time_slot['participantsPerEntry']
        except KeyError:
            return 'timeSlots.participantsPerEntry has to be defined', name, is_active, time_slot

    return None, name, is_active, time_slots


"""
Global Scoreboard context
"""


@api.route('/players', methods=('GET',))
def get_all_players():
    return jsonify(map_to_dto(Player.get_all()))


@api.route('/players/<id>/score-details', methods=('GET',))
def get_player_score_details(id: str):
    player = Player.get(id)
    print(player)
    print(player.score_details)
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
        error_message = "Error: {}\n{}".format(exception.args[0]["error"], exception.args[0]["details"])
        print(f"\n{error_message}")
        return error_message, 424
    except Exception:
        error_message = "Error: Unknown\n{}".format(traceback.format_exc())
        print(f"\n{error_message}")
        return error_message, 500


def __do_update_player_bypass_restrictions(name_or_id: str):
    result = get_updated_user(name_or_id)
    return jsonify(result), 400 if result["state"] == "warning" else 200


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
    finally:
        # Upon update completing, allow the user to update again
        __currently_updating_from.pop(current_user.user_id, None)

    return jsonify(result), 400 if result["state"] == "warning" else 200


@api.route('/players/current/friends', methods=('GET',))
@authentication_required
def get_friends_current(current_user: Player):
    return jsonify(map_to_dto(current_user.get_friends()))


@api.route('/players/current/friends/<id>', methods=('PUT',))
@authentication_required
def put_friends_current(current_user: Player, id: str):
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
    if current_user.unfriend(id):
        return f"Successfully removed user ID \"{id}\" from your friends."
    else:
        return f"User ID \"{id}\" isn't one of your friends."


"""
Game Search context
"""
@api.route('/game-values', methods=('GET',))
def get_all_game_values():
    return jsonify(map_to_dto(GameValues.query.all()))
