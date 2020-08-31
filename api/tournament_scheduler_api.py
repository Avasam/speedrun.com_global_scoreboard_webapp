"""
Provides the API endpoints for consuming and producing REST requests and
responses within the Tournament Scheduler context
"""
from api.api_wrappers import authentication_required
from flask import Blueprint, jsonify, request
from models.core_models import Player
from models.tournament_scheduler_models import Schedule, TimeSlot
from services.utils import map_to_dto
from typing import Any, Dict, List, Optional, Tuple

api = Blueprint('tournament_scheduler_api', __name__)


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
