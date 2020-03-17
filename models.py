#!/usr/bin/python
# -*- coding: utf-8 -*-

from __future__ import annotations
from datetime import datetime, timedelta
from flask_login import login_user, UserMixin
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.mysql import insert
from json import dumps, loads
from sqlalchemy import orm, text
from typing import Any, Dict, List, Optional, Union
from utils import get_file, SpeedrunComError
import uuid
import traceback


def map_to_dto(dto_mappable_object_list) -> List[Dict[str, Union[str, bool, int]]]:
    return [dto_mappable_object.to_dto() for dto_mappable_object in dto_mappable_object_list]


db = SQLAlchemy()

friend = db.Table(
    'friend',
    db.Column(
        'user_id',
        db.String(8),
        db.ForeignKey('player.user_id')),
    db.Column(
        'friend_id',
        db.String(8),
        db.ForeignKey('player.user_id'))
)


class Player(db.Model, UserMixin):
    __tablename__ = "player"

    user_id: str = db.Column(db.String(8), primary_key=True)
    name: str = db.Column(db.String(32), nullable=False)
    score: int = db.Column(db.Integer, nullable=False)
    last_update = db.Column(db.DateTime())

    schedules = db.relationship("Schedule", back_populates="owner")

    @staticmethod
    def authenticate(api_key: str):
        try:  # Get user from speedrun.com using the API key
            user_id: Union[str, None] = get_file(
                "https://www.speedrun.com/api/v1/profile",
                {"X-API-Key": api_key}
            )["data"]["id"]
            print("logging in user_id =", user_id)
        except SpeedrunComError:
            print("\nError: Unknown\n{}".format(traceback.format_exc()))
            return None
            # TODO: return json.dumps({'state': 'warning', 'message': 'Invalid API key.'})
        except Exception:
            print("\nError: Unknown\n{}".format(traceback.format_exc()))
            return None
            # TODO: return json.dumps({"state": "danger", "message": traceback.format_exc()})

        if not user_id:  # Confirms wether the API key is valid
            return None
            # TODO: return json.dumps({'state': 'warning', 'message': 'Invalid API key.'})

        # TODO: optionally update that user
        player: Player = Player.get(user_id)

        if not player:
            return None
            # TODO: Add user to DB and load them in

        login_user(player)  # Login for non SPA

        return player

    @staticmethod
    def get(id: str) -> Player:
        return Player.query.get(id)

    @staticmethod
    def get_all():
        sql = text("SELECT *, rank FROM ( "
                   "    SELECT *, "
                   "        IF(score = @_last_score, @cur_rank := @cur_rank, @cur_rank := @_sequence) AS rank, "
                   "        @_sequence := @_sequence + 1, "
                   "        @_last_score := score "
                   "    FROM player, (SELECT @cur_rank := 1, @_sequence := 1, @_last_score := NULL) r "
                   "    ORDER BY score DESC "
                   ") ranked;")
        return db.engine.execute(sql).fetchall()

    def get_friends(self):
        sql = text("SELECT DISTINCT friend_id FROM friend "
                   "WHERE friend.user_id = '{user_id}';".format(
                       user_id=self.user_id))
        return [friend_id[0] for friend_id in db.engine.execute(sql).fetchall()]

    def befriend(self, friend_id: str) -> bool:
        if self.user_id == friend_id:
            return False
        sql = text("INSERT INTO friend (user_id, friend_id) "
                   "VALUES ('{user_id}', '{friend_id}');".format(
                       user_id=self.user_id,
                       friend_id=friend_id))
        return db.engine.execute(sql)

    def unfriend(self, friend_id: str) -> bool:
        sql = text("DELETE FROM friend "
                   "WHERE user_id = '{user_id}' AND friend_id = '{friend_id}';".format(
                       user_id=self.user_id,
                       friend_id=friend_id))
        return db.engine.execute(sql)

    def get_schedules(self) -> List[Schedule]:
        return Schedule.query.filter(Schedule.owner_id == self.user_id).all()

    def create_schedule(self, name: str, is_active: bool, time_slots: List[Dict[str, Any]]) -> int:
        new_schedule = Schedule(
            name=name,
            owner_id=self.user_id,
            registration_key=str(uuid.uuid4()),
            is_active=is_active)
        db.session.add(new_schedule)
        db.session.flush()

        new_time_slots = [TimeSlot(
            schedule_id=new_schedule.schedule_id,
            date_time=datetime.strptime(time_slot['dateTime'], "%Y-%m-%dT%H:%M:%S.%fZ"),
            maximum_entries=time_slot['maximumEntries'],
            participants_per_entry=time_slot['participantsPerEntry'])
            for time_slot in time_slots]
        db.session.bulk_save_objects(new_time_slots)

        db.session.commit()
        return new_schedule.schedule_id

    def update_schedule(self, schedule_id: int, name: str, is_active: bool, time_slots: List[Dict[str, Any]]) -> int:
        try:
            schedule_to_update = Schedule \
                .query \
                .filter(Schedule.schedule_id == schedule_id) \
                .filter(Schedule.owner_id == self.user_id) \
                .one()
        except orm.exc.NoResultFound:
            return False

        schedule_to_update.name = name
        schedule_to_update.is_active = is_active

        # Manually take care of merging the time slots
        # since I can't figure out how to do it automatically within SQLAlchemy
        new_time_slots = []
        for time_slot_to_edit in time_slots:
            new_time_slot = None
            # If it already exists in session, use that one ...
            for existing_time_slot in schedule_to_update.time_slots:
                if time_slot_to_edit['id'] == existing_time_slot.time_slot_id:
                    new_time_slot = existing_time_slot
                    break
            # ... otherwise, create a brand new TimeSlot
            else:
                new_time_slot = TimeSlot()
            # Do the necessary modifications
            new_time_slot.schedule_id = schedule_id
            new_time_slot.date_time = datetime.strptime(time_slot_to_edit['dateTime'], "%Y-%m-%dT%H:%M:%S.%fZ")
            new_time_slot.maximum_entries = time_slot_to_edit['maximumEntries']
            new_time_slot.participants_per_entry = time_slot_to_edit['participantsPerEntry']

            new_time_slots.append(new_time_slot)

        # cascade="all,delete,delete-orphan" will remove time slots we haven't added back
        schedule_to_update.time_slots = new_time_slots

        db.session.commit()
        return True

    def delete_schedule(self, schedule_id: int) -> bool:
        try:
            schedule_to_delete = Schedule \
                .query \
                .filter(Schedule.schedule_id == schedule_id) \
                .filter(Schedule.owner_id == self.user_id) \
                .one()
        except orm.exc.NoResultFound:
            return False
        db.session.delete(schedule_to_delete)
        db.session.commit()
        return True

    def update_registration(self, registration_id: int, participant_names: List[str]):
        try:
            registration_to_update = Registration \
                .query \
                .filter(Registration.registration_id == registration_id) \
                .one()

            Schedule \
                .query \
                .filter(Schedule.schedule_id == registration_to_update.timeslot.schedule.schedule_id) \
                .filter(Schedule.owner_id == self.user_id) \
                .one()
        except orm.exc.NoResultFound:
            return False

        # Manually take care of merging the participants
        # since I can't figure out how to do it automatically within SQLAlchemy
        new_participants = []
        for participant_name in participant_names:
            new_participant = None
            # If it already exists in session, use that one ...
            for existing_participant in registration_to_update.participants:
                if participant_name == existing_participant.name:
                    new_participant = existing_participant
                    break
            # ... otherwise, create a brand new Participant
            else:
                new_participant = Participant()
            # Do the necessary modifications
            new_participant.registration_id = registration_id
            new_participant.name = participant_name

            new_participants.append(new_participant)

        # cascade="all,delete,delete-orphan" will remove participants we haven't added back
        registration_to_update.participants = new_participants

        db.session.commit()
        return True

    def delete_registration(self, registration_id: int) -> bool:
        try:
            registration_to_delete: Registration = Registration \
                .query \
                .filter(Registration.registration_id == registration_id) \
                .one()

            Schedule \
                .query \
                .filter(Schedule.schedule_id == registration_to_delete.timeslot.schedule.schedule_id) \
                .filter(Schedule.owner_id == self.user_id) \
                .one()
        except orm.exc.NoResultFound:
            return False

        db.session.delete(registration_to_delete)
        db.session.commit()

        return True

    # Override from UserMixin for Flask-Login
    def get_id(self):
        return self.user_id


class CachedRequest(db.Model):
    __tablename__ = "cached_request"

    url: str = db.Column(db.String(767), primary_key=True)
    timestamp: datetime = db.Column(db.DateTime, nullable=False)
    result: str = db.Column(db.Text(), nullable=False)

    @staticmethod
    def get(url: str) -> Optional[Schedule]:
        return CachedRequest.query.get(url)

    @staticmethod
    def get_response_or_new(url: str) -> dict:
        today = datetime.utcnow().date()
        yesterday = today - timedelta(days=1)

        try:
            cached_request = CachedRequest \
                .query \
                .filter(CachedRequest.url == url) \
                .filter(CachedRequest.timestamp >= yesterday) \
                .one()
            db.session.close()

            result = loads(cached_request.result)
            return result
        except orm.exc.NoResultFound:
            result = get_file(url)

            insert_stmt = insert(CachedRequest).values(
                url=url,
                timestamp=today,
                result=dumps(result)
            )
            on_duplicate_key_stmt = insert_stmt.on_duplicate_key_update(
                timestamp=insert_stmt.inserted.timestamp,
                result=insert_stmt.inserted.result,
            )
            db.engine.execute(on_duplicate_key_stmt)
            db.session.close()

            return result


class Schedule(db.Model):
    __tablename__ = "schedule"

    schedule_id: int = db.Column(db.Integer, primary_key=True)
    name: str = db.Column(db.String(128), nullable=False, default='')
    owner_id: int = db.Column(db.String(8), db.ForeignKey('player.user_id'), nullable=False)
    registration_key: str = db.Column(db.String(36), nullable=False)
    is_active: bool = db.Column(db.Boolean, nullable=False, default=True)

    owner: Player = db.relationship("Player", back_populates="schedules")
    time_slots: List[TimeSlot] = db.relationship(
        "TimeSlot",
        cascade="all,delete,delete-orphan",
        back_populates="schedule")

    @staticmethod
    def get(id: str) -> Optional[Schedule]:
        return Schedule.query.get(id)

    @staticmethod
    def get_with_key(schedule_id: str, registration_key: str) -> Optional[Schedule]:
        try:
            return Schedule \
                .query \
                .filter(Schedule.schedule_id == schedule_id) \
                .filter(Schedule.registration_key == registration_key) \
                .one()
        except orm.exc.NoResultFound:
            return None

    def to_dto(self) -> dict[str, Union[str, int, bool, List[Dict[str, Union[str, int, bool]]]]]:
        return {
            'id': self.schedule_id,
            'name': self.name,
            'active': self.is_active,
            'registrationKey': self.registration_key,
            'timeSlots': map_to_dto(self.time_slots),
        }


class TimeSlot(db.Model):
    __tablename__ = "time_slot"

    time_slot_id: int = db.Column(db.Integer, primary_key=True)
    schedule_id: int = db.Column(db.String(8), db.ForeignKey('schedule.schedule_id'), nullable=False)
    date_time: datetime = db.Column(db.DateTime, nullable=False)
    maximum_entries: int = db.Column(db.Integer, nullable=False)
    participants_per_entry: int = db.Column(db.Integer, nullable=False)

    schedule: Schedule = db.relationship("Schedule", back_populates="time_slots")
    registrations: List[Registration] = db.relationship(
        "Registration",
        cascade="all,delete,delete-orphan",
        back_populates="timeslot")

    @staticmethod
    def get_with_key(time_slot_id: str, registration_key: str) -> Optional[TimeSlot]:
        try:
            parent_schedule: Schedule = Schedule \
                .query \
                .filter(Schedule.registration_key == registration_key) \
                .one()
            return TimeSlot \
                .query \
                .filter(TimeSlot.time_slot_id == time_slot_id) \
                .filter(TimeSlot.schedule_id == parent_schedule.schedule_id) \
                .one()
        except orm.exc.NoResultFound:
            return None

    def register_participant(self, participant_names: List[str]) -> int:
        new_registration = Registration(time_slot_id=self.time_slot_id)
        db.session.add(new_registration)
        db.session.flush()

        new_participants = [Participant(
            registration_id=new_registration.registration_id,
            name=participant_name)
            for participant_name in participant_names]

        db.session.bulk_save_objects(new_participants)

        db.session.commit()
        return new_registration.registration_id

    def to_dto(self) -> dict[str, Union[str, int, bool, datetime, List[Dict[str, Union[str, int, bool]]]]]:
        return {
            'id': self.time_slot_id,
            'dateTime': self.date_time,
            'maximumEntries': self.maximum_entries,
            'participantsPerEntry': self.participants_per_entry,
            'registrations': map_to_dto(self.registrations)
        }


class Registration(db.Model):
    __tablename__ = "registration"

    registration_id: int = db.Column(db.Integer, primary_key=True)
    time_slot_id: int = db.Column(db.Integer, db.ForeignKey('time_slot.time_slot_id'), nullable=False)

    timeslot: TimeSlot = db.relationship("TimeSlot", back_populates="registrations")
    participants: List[Participant] = db.relationship(
        "Participant",
        cascade="all,delete,delete-orphan",
        back_populates="registration")

    def to_dto(self) -> dict[str, Union[int, List[str]]]:
        return {
            'id': self.registration_id,
            'participants': [participant.name for participant in self.participants]
        }


class Participant(db.Model):
    __tablename__ = "participant"

    registration_id: int = db.Column(db.Integer, db.ForeignKey('registration.registration_id'), primary_key=True)
    name: str = db.Column(db.String(128), primary_key=True)

    registration: Registration = db.relationship("Registration", back_populates="participants")
