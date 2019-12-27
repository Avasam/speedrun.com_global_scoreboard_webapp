"""
api.py
- provides the API endpoints for consuming and producing REST requests and responses
"""
from models import Player, map_to_dto
from datetime import datetime, timedelta
from flask import Blueprint, current_app, jsonify, request
from functools import wraps
from typing import Any, Dict, List, Optional, Union, Tuple
import jwt

# TODO: use and typecheck / typeguard JSONType
__JSONTypeBase = Union[str, int, float, bool, None, Dict[str, Any], List[Any]]
JSONType = Union[str, int, float, bool, None, Dict[str, __JSONTypeBase], List[__JSONTypeBase]]


def authenthication_required(f):
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
            print(auth_headers)
            return jsonify(invalid_msg), 401

        try:
            token = auth_headers[1]
            data = jwt.decode(token, current_app.config['SECRET_KEY'])
            player: Player = Player.query.filter_by(user_id=data['sub']).first()
            if not player:
                raise RuntimeError('User not found')
            return f(player, *args, **kwargs)
        except jwt.ExpiredSignatureError as e:
            print(e)
            return jsonify(expired_msg), 401
        except jwt.InvalidTokenError as e:
            print(e)
            return jsonify(invalid_msg), 401

    return _verify


api = Blueprint('api', __name__)


@api.route('/login', methods=('POST',))
def login():
    data: Dict[str, ] = request.get_json()
    player = Player.authenticate(data['srcApiKey'])

    if not player:
        return jsonify({'message': 'Invalid credentials', 'authenticated': False}), 401

    token = jwt.encode({
        'sub': player.user_id,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(minutes=30)},
        current_app.config['SECRET_KEY'])
    return jsonify({
        'token': token.decode('UTF-8'),
        'user': {
            'userId': player.user_id,
            'name': player.name,
        }})


@api.route('/users/current', methods=('GET',))
@authenthication_required
def get_user_current(current_user: Player):
    return jsonify({
        'user': {
            'userId': current_user.user_id,
            'name': current_user.name,
        }})


@api.route('/schedules', methods=('GET',))
@authenthication_required
def get_all_schedules(current_user: Player):
    return jsonify(map_to_dto(current_user.get_schedules()))


@api.route('/schedules', methods=('POST',))
@authenthication_required
def post_schedule(current_user: Player):
    data: Dict[str, ] = request.get_json()

    error_message, name, is_active, time_slots = __validate_create_schedule(data)
    if error_message is not None:
        return jsonify({'message': error_message, 'authenticated': True}), 400

    return str(current_user.create_schedule(name, is_active, time_slots)), 201


@api.route('/schedules/<id>', methods=('PUT',))
@authenthication_required
def put_schedule(current_user: Player, id: str):
    data: Dict[str, ] = request.get_json()
    try:
        schedule_id = int(id)
    except ValueError:
        return jsonify({'message': '/id is not a valid number', 'authenticated': True}), 400
    error_message, name, is_active, time_slots = __validate_create_schedule(data)
    if error_message is not None:
        return jsonify({'message': error_message, 'authenticated': True}), 400

    return str(current_user.update_schedule(schedule_id, name, is_active, time_slots)), 201


@api.route('/schedules/<id>', methods=('DELETE',))
@authenthication_required
def delete_schedule(current_user: Player, id: str):
    try:
        schedule_id = int(id)
    except ValueError:
        return jsonify({'message': '/id is not a valid number', 'authenticated': True}), 400
    delete_success = current_user.delete_schedule(schedule_id)
    return None, 204 if delete_success else 404


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
            time_slot['availableSpots']
        except KeyError:
            return 'timeSlots.availableSpots has to be defined', name, is_active, time_slot
    return None, name, is_active, time_slots
