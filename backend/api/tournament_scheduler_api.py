"""
Provides the API endpoints for consuming and producing REST requests and
responses within the Tournament Scheduler context
"""
from __future__ import annotations

from api.api_wrappers import authentication_required
from flask import Blueprint, jsonify, request
from models.core_models import JSONObjectType, Player, ScheduleOrderDict
from models.tournament_scheduler_models import Schedule, ScheduleGroup, TimeSlot
from services.utils import has_duplicates, map_to_dto

api = Blueprint("tournament_scheduler_api", __name__)

# region Schedule


@api.route("/schedules", methods=("GET",))
@authentication_required
def get_all_schedules(current_user: Player):
    return jsonify(map_to_dto(current_user.get_schedules()))


@api.route("/schedules/<schedule_id>", methods=("GET",))
def get_schedule(schedule_id: str | int):
    try:
        schedule_id = int(schedule_id)
    except ValueError:
        return jsonify({"message": "/schedule_id is not a valid number", "authenticated": True}), 400

    registration_key: str | None = request.args.get("registrationKey")

    schedule = Schedule.get(schedule_id) \
        if registration_key is None \
        else Schedule.get_with_key(schedule_id, registration_key)

    if schedule is None:
        return "", 404

    return jsonify(schedule.to_dto())


@api.route("/schedules", methods=("POST",))
@authentication_required
def post_schedule(current_user: Player):
    data: JSONObjectType | None = request.get_json()
    error_message, name, is_active, deadline, time_slots, order = __validate_create_schedule(data)
    if error_message is not None:
        return jsonify({"message": error_message, "authenticated": True}), 400

    return jsonify({"id": current_user.create_schedule(name, is_active, deadline, time_slots, order)}), 201


@api.route("/schedules/<schedule_id>", methods=("PUT",))
@authentication_required
def put_schedule(current_user: Player, schedule_id: str | int):
    try:
        schedule_id = int(schedule_id)
    except ValueError:
        return jsonify({"message": "/schedule_id is not a valid number", "authenticated": True}), 400

    data: JSONObjectType | None = request.get_json()
    error_message, name, is_active, deadline, time_slots, _ = __validate_create_schedule(data)
    if error_message is not None:
        return jsonify({"message": error_message, "authenticated": True}), 400

    update_success = current_user.update_schedule(schedule_id, name, is_active, deadline, time_slots)
    return "", 201 if update_success else 404


@api.route("/schedules/<schedule_id>", methods=("DELETE",))
@authentication_required
def delete_schedule(current_user: Player, schedule_id: str | int):
    try:
        schedule_id = int(schedule_id)
    except ValueError:
        return jsonify({"message": "/schedule_id is not a valid number", "authenticated": True}), 400

    delete_success = current_user.delete_schedule(schedule_id)
    return "", 204 if delete_success else 404


@api.route("/schedules/order", methods=("PUT",))
@authentication_required
def put_schedule_order(current_user: Player):
    data: list[ScheduleOrderDict] | None = request.get_json()
    if not data:
        return "missing data", 400

    update_success = current_user.update_schedule_order(data)
    return "", 201 if update_success else 404

# endregion

# region ScheduleGroup


@api.route("/schedules/<schedule_id>/group_id/<group_id>", methods=("PUT",))
@authentication_required
def put_schedule_group_id(current_user: Player, schedule_id: str | int, group_id: str | int | None):
    try:
        schedule_id = int(schedule_id)
    except ValueError:
        return jsonify({"message": "/schedule_id is not a valid number", "authenticated": True}), 400
    try:
        group_id = None \
            if not group_id or group_id == "null" \
            else int(group_id)
    except ValueError:
        return jsonify({"message": "/group_id is not a valid number", "authenticated": True}), 400

    update_success = current_user.update_schedule_group_id(schedule_id, group_id)
    return "", 201 if update_success else 404


@api.route("/schedule_groups", methods=("GET",))
@authentication_required
def get_all_schedule_groups(current_user: Player):
    return jsonify(map_to_dto(current_user.get_schedule_groups()))


@api.route("/schedule_groups/<group_id>", methods=("GET",))
def get_schedule_group(group_id: str | int):
    try:
        group_id = int(group_id)
    except ValueError:
        return jsonify({"message": "/group_id is not a valid number", "authenticated": True}), 400

    schedule_group = ScheduleGroup.get(group_id)

    if schedule_group is None:
        return "", 404

    return jsonify(schedule_group.to_dto())


@api.route("/schedule_groups/<group_id>/schedules", methods=("GET",))
def get_schedules_from_group(group_id: str | int):
    try:
        group_id = int(group_id)
    except ValueError:
        return jsonify({"message": "/group_id is not a valid number", "authenticated": True}), 400
    return jsonify(map_to_dto(ScheduleGroup.get_schedules(group_id)))


@api.route("/schedule_groups", methods=("POST",))
@authentication_required
def post_schedule_group(current_user: Player):
    data: JSONObjectType | None = request.get_json()
    error_message, name, order = __validate_create_schedule_group(data)
    if error_message is not None:
        return jsonify({"message": error_message, "authenticated": True}), 400

    return jsonify({"id": current_user.create_schedule_group(name, order)}), 201


@api.route("/schedule_groups/<group_id>", methods=("PUT",))
@authentication_required
def put_schedule_group(current_user: Player, group_id: str | int):
    try:
        group_id = int(group_id)
    except ValueError:
        return jsonify({"message": "/group_id is not a valid number", "authenticated": True}), 400
    data: JSONObjectType | None = request.get_json()
    error_message, name, order = __validate_create_schedule_group(data)
    if error_message is not None:
        return jsonify({"message": error_message, "authenticated": True}), 400

    update_success = current_user.update_schedule_group(group_id, name, order)
    return "", 201 if update_success else 404


@api.route("/schedule_groups/<group_id>", methods=("DELETE",))
@authentication_required
def delete_schedule_group(current_user: Player, group_id: str | int):
    try:
        group_id = int(group_id)
    except ValueError:
        return jsonify({"message": "/group_id is not a valid number", "authenticated": True}), 400

    delete_success = current_user.delete_schedule_group(group_id)
    return "", 204 if delete_success else 404

# endregion

# region Registration


@api.route("/time-slots/<time_slot_id>/registrations", methods=("POST",))
def post_registration(time_slot_id: str | int):
    try:
        registration_id = int(time_slot_id)
    except ValueError:
        return jsonify({"message": "/time_slot_id is not a valid number", "authenticated": True}), 400

    data: JSONObjectType | None = request.get_json()
    error_message, registration_key, participants = __validate_create_registration(data)
    if error_message is not None:
        return jsonify({"message": error_message, "authenticated": True}), 400

    time_slot = TimeSlot.get_with_key(registration_id, registration_key)
    if time_slot is None:
        return "", 404

    if len(time_slot.registrations) >= time_slot.maximum_entries:
        return jsonify({"message": "Registrations are full for this timeslot", "authenticated": True}), 507

    return jsonify({"id": time_slot.register_participant(participants)}), 201


@api.route("/registrations/<registration_id>", methods=("PUT",))
@authentication_required
def put_registration(current_user: Player, registration_id: str | int):
    try:
        registration_id = int(registration_id)
    except ValueError:
        return jsonify({"message": "/registration_id is not a valid number", "authenticated": True}), 400

    data: JSONObjectType | None = request.get_json()
    error_message, _, participants = __validate_create_registration(data, False)
    if error_message is not None:
        return jsonify({"message": error_message, "authenticated": True}), 400

    update_success = current_user.update_registration(registration_id, participants)
    return "", 201 if update_success else 404


@api.route("/registrations/<registration_id>", methods=("DELETE",))
@authentication_required
def delete_registration(current_user: Player, registration_id: str | int):
    try:
        registration_id = int(registration_id)
    except ValueError:
        return jsonify({"message": "/registration_id is not a valid number", "authenticated": True}), 400

    delete_success = current_user.delete_registration(registration_id)
    return "", 204 if delete_success else 404

# endregion

# region Validation


def __validate_create_registration(data: JSONObjectType | None, with_registration_key=True):
    registration_key = ""
    participants = []
    if not data:
        return "missing data", registration_key, participants
    try:
        registration_key = str(data["registrationKey"])
    except KeyError:
        if with_registration_key:
            return "registrationKey has to be defined", registration_key, participants
    if not isinstance(data["participants"], list):
        return "participants has to be a list", registration_key, participants
    try:
        participants[:] = [x for x in data["participants"] if x]
    except KeyError:
        return "registrationKey has to be defined", registration_key, participants
    if has_duplicates(participants):
        return "duplicate participants", registration_key, participants
    return None, registration_key, participants


def __validate_create_schedule_group(data: JSONObjectType | None):
    error_message = ""
    name = ""
    order = None
    if not data:
        error_message += "missing data"
    else:
        try:
            name = str(data["name"])
        except KeyError:
            error_message += "name has to be defined"
        try:
            order = int(str(data["order"]))
        except KeyError:
            error_message += "order has to be defined"
        except ValueError:
            error_message += "order has to be a number"
    return error_message if error_message else None, name, order


def __validate_create_schedule(data: JSONObjectType | None):  # noqa: PLR0912,PLR0915
    error_message = ""
    name = ""
    is_active = False
    deadline = None
    time_slots = []
    time_slot = []
    order = None
    if not data:
        error_message += "missing data"
    else:
        try:
            name = str(data["name"])
        except KeyError:
            error_message += "name has to be defined"
        try:
            is_active = data["active"] is True
        except KeyError:
            error_message += "active has to be defined"
        try:
            deadline_data = data["deadline"]
            deadline = None if deadline_data is None else str(deadline_data)
        except KeyError:
            error_message += "deadline has to be defined"
        try:
            order = int(str(data["order"]))
        except KeyError:
            error_message += "order has to be defined"
        except ValueError:
            error_message += "order has to be a number"

        try:
            time_slots = data["timeSlots"]
        except KeyError:
            error_message += "timeSlots has to be defined"

    if not isinstance(time_slots, list):
        time_slots = []
        error_message += "timeSlots has to be a list"
    else:
        for time_slot in time_slots:
            try:
                time_slot["dateTime"]
            except KeyError:
                error_message += "timeSlots.dateTime has to be defined"
            try:
                time_slot["maximumEntries"]
            except KeyError:
                error_message += "timeSlots.maximumEntries has to be defined"
            try:
                time_slot["participantsPerEntry"]
            except KeyError:
                error_message += "timeSlots.participantsPerEntry has to be defined"

    return error_message if error_message else None, name, is_active, deadline, time_slots, order

# endregion
