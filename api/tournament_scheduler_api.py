"""
Provides the API endpoints for consuming and producing REST requests and
responses within the Tournament Scheduler context
"""
from api.api_wrappers import authentication_required
from flask import Blueprint, jsonify, request
from models.core_models import Player
from models.tournament_scheduler_models import Schedule, ScheduleGroup, TimeSlot
from services.utils import map_to_dto
from typing import Any, Dict, List, Optional, Tuple, Union

api = Blueprint('tournament_scheduler_api', __name__)

# region Schedule


@api.route('/schedules', methods=('GET',))
@authentication_required
def get_all_schedules(current_user: Player):
    return jsonify(map_to_dto(current_user.get_schedules()))


@api.route('/schedules/<id>', methods=('GET',))
def get_schedule(id: str):
    try:
        schedule_id = int(id)
    except ValueError:
        return jsonify({'message': '/id is not a valid number', 'authenticated': True}), 400

    registration_key: Optional[str] = request.args.get('registrationKey')

    if registration_key is None:
        schedule = Schedule.get(schedule_id)
    else:
        schedule = Schedule.get_with_key(schedule_id, registration_key)

    if schedule is None:
        return '', 404

    return jsonify(schedule.to_dto())


@api.route('/schedules', methods=('POST',))
@authentication_required
def post_schedule(current_user: Player):
    data: Dict[str, Any] = request.get_json()
    error_message, name, is_active, deadline, time_slots = __validate_create_schedule(data)
    if error_message is not None:
        return jsonify({'message': error_message, 'authenticated': True}), 400

    return str(current_user.create_schedule(name, is_active, deadline, time_slots)), 201


@api.route('/schedules/<id>', methods=('PUT',))
@authentication_required
def put_schedule(current_user: Player, id: str):
    try:
        schedule_id = int(id)
    except ValueError:
        return jsonify({'message': '/id is not a valid number', 'authenticated': True}), 400

    data: Dict[str, Any] = request.get_json()
    error_message, name, is_active, deadline, time_slots = __validate_create_schedule(data)
    if error_message is not None:
        return jsonify({'message': error_message, 'authenticated': True}), 400

    update_success = current_user.update_schedule(schedule_id, name, is_active, deadline, time_slots)
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


@api.route('/schedules/order', methods=('PUT',))
@authentication_required
def put_schedule_order(current_user: Player):
    data: Dict[str, Union[bool, int]] = request.get_json()

    update_success = current_user.update_schedule_order(data)
    return "", 201 if update_success else 404

# endregion

# region ScheduleGroup


@api.route('/schedules/<id>/group_id/<group_id>', methods=('PUT',))
@authentication_required
def put_schedule_group_id(current_user: Player, id: int, group_id: Optional[int]):
    try:
        schedule_id = int(id)
    except ValueError:
        return jsonify({'message': '/id is not a valid number', 'authenticated': True}), 400
    try:
        group_id = None if group_id == "null" else int(group_id)
    except ValueError:
        return jsonify({'message': '/group_id is not a valid number', 'authenticated': True}), 400

    update_success = current_user.update_schedule_group_id(schedule_id, group_id)
    return "", 201 if update_success else 404


@api.route('/schedule_groups', methods=('GET',))
@authentication_required
def get_all_schedule_groups(current_user: Player):
    return jsonify(map_to_dto(current_user.get_schedule_groups()))


@api.route('/schedule_groups/<id>', methods=('GET',))
def get_schedule_group(id: str):
    try:
        group_id = int(id)
    except ValueError:
        return jsonify({'message': '/id is not a valid number', 'authenticated': True}), 400

    schedule_group = ScheduleGroup.get(group_id)

    if schedule_group is None:
        return '', 404

    return jsonify(schedule_group.to_dto())


@api.route('/schedule_groups/<id>/schedules', methods=('GET',))
def get_schedules_from_group(id: str):
    try:
        group_id = int(id)
    except ValueError:
        return jsonify({'message': '/id is not a valid number', 'authenticated': True}), 400
    return jsonify(map_to_dto(ScheduleGroup.get_schedules(group_id)))


@api.route('/schedule_groups', methods=('POST',))
@authentication_required
def post_schedule_group(current_user: Player):
    data: Dict[str, Any] = request.get_json()
    error_message, name, order = __validate_create_schedule_group(data)
    if error_message is not None:
        return jsonify({'message': error_message, 'authenticated': True}), 400

    return str(current_user.create_schedule_group(name, order)), 201


@api.route('/schedule_groups/<id>', methods=('PUT',))
@authentication_required
def put_schedule_group(current_user: Player, id: str):
    try:
        group_id = int(id)
    except ValueError:
        return jsonify({'message': '/id is not a valid number', 'authenticated': True}), 400
    data: Dict[str, Any] = request.get_json()
    error_message, name, order = __validate_create_schedule_group(data)
    if error_message is not None:
        return jsonify({'message': error_message, 'authenticated': True}), 400

    update_success = current_user.update_schedule_group(group_id, name, order)
    return "", 201 if update_success else 404


@api.route('/schedule_groups/<id>', methods=('DELETE',))
@authentication_required
def delete_schedule_group(current_user: Player, id: str):
    try:
        group_id = int(id)
    except ValueError:
        return jsonify({'message': '/id is not a valid number', 'authenticated': True}), 400

    delete_success = current_user.delete_schedule_group(group_id)
    return "", 204 if delete_success else 404

# endregion

# region Registration


@api.route('/time-slots/<id>/registrations', methods=('POST',))
def post_registration(id: str):
    try:
        registration_id = int(id)
    except ValueError:
        return jsonify({'message': '/id is not a valid number', 'authenticated': True}), 400

    data: Dict[str, Any] = request.get_json()
    error_message, registration_key, participants = __validate_create_registration(data)
    if error_message is not None:
        return jsonify({'message': error_message, 'authenticated': True}), 400

    print(registration_id, registration_key)
    time_slot = TimeSlot.get_with_key(registration_id, registration_key)
    if time_slot is None:
        return '', 404

    if (len(time_slot.registrations) >= time_slot.maximum_entries):
        return jsonify({'message': 'Registrations are full for this timeslot', 'authenticated': True}), 507

    return str(time_slot.register_participant(participants)), 201


@api.route('/registrations/<id>', methods=('PUT',))
@authentication_required
def put_registration(current_user: Player, id: str):
    try:
        registration_id = int(id)
    except ValueError:
        return jsonify({'message': '/id is not a valid number', 'authenticated': True}), 400

    data: Dict[str, Any] = request.get_json()
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

# endregion

# region Validation


def __validate_create_registration(
    data: Dict[str, Any],
    with_registration_key=True
) -> Tuple[Optional[str], str, List[str]]:
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


def __validate_create_schedule_group(data: Dict[str, Any]) -> Tuple[Optional[str], str, int]:
    error_message = ''
    order = ''
    try:
        name = data['name']
    except KeyError:
        error_message += 'name has to be defined'
    try:
        order = data['order']
    except KeyError:
        error_message += 'order has to be defined'
    return None if error_message == '' else error_message, name, order


def __validate_create_schedule(data: Dict[str, Any]) -> Tuple[Optional[str], str, bool, str, List[Dict]]:
    error_message = ''
    name = ''
    is_active = False
    deadline = ''
    time_slots = []
    time_slot = []
    try:
        name = data['name']
    except KeyError:
        error_message += 'name has to be defined'
    try:
        is_active = data['active'] is True
    except KeyError:
        error_message += 'active has to be defined'
    try:
        deadline = data['deadline']
    except KeyError:
        error_message += 'deadline has to be defined'
    try:
        time_slots = data['timeSlots']
    except KeyError:

        error_message += 'timeSlots has to be defined'
    for time_slot in time_slots:
        try:
            time_slot['dateTime']
        except KeyError:
            error_message += 'timeSlots.dateTime has to be defined'
        try:
            time_slot['maximumEntries']
        except KeyError:
            error_message += 'timeSlots.maximumEntries has to be defined'
        try:
            time_slot['participantsPerEntry']
        except KeyError:
            error_message += 'timeSlots.participantsPerEntry has to be defined'

    return None if error_message == '' else error_message, name, is_active, deadline, time_slots

# endregion
