#!/usr/bin/python
# -*- coding: utf-8 -*-

##########################################################################
# Ava's Global Speedrunning Scoreboard
# Copyright (C) 2018 Samuel Therrien
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
# Contact:
# samuel.06@hotmail.com
##########################################################################
from __future__ import annotations
from datetime import datetime
from flask_login import login_user
from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import orm, text
from typing import Any, Dict, List, Union
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
                "https://www.speedrun.com/api/v1/profile", {"X-API-Key": api_key})["data"]["id"]
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
                .filter(Schedule.schedule_id == schedule_id and Schedule.owner_id == self.user_id) \
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
                .filter(Schedule.schedule_id == schedule_id and Schedule.owner_id == self.user_id) \
                .one()
        except orm.exc.NoResultFound:
            return False
        db.session.delete(schedule_to_delete)
        db.session.commit()
        return True

    # Override from UserMixin for Flask-Login
    def get_id(self):
        return self.user_id


class Schedule(db.Model):
    __tablename__ = "schedule"

    schedule_id: int = db.Column(db.Integer, primary_key=True)
    name: str = db.Column(db.String(128), nullable=False, default='')
    owner_id: int = db.Column(db.String(8), db.ForeignKey('player.user_id'), nullable=False)
    registration_key: str = db.Column(db.String(36), nullable=False)
    is_active: bool = db.Column(db.Boolean, nullable=False, default=True)

    owner = db.relationship("Player", back_populates="schedules")
    time_slots: List[TimeSlot] = db.relationship(
        "TimeSlot",
        cascade="all,delete,delete-orphan",
        back_populates="schedule")

    def to_dto(self) -> dict[str, Union[str, int, bool, List[Dict[str, Union[str, bool, int]]]]]:
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

    schedule = db.relationship("Schedule", back_populates="time_slots")

    def to_dto(self) -> dict[str, Union[str, int, bool, datetime]]:
        return {
            'id': self.time_slot_id,
            'dateTime': self.date_time,
            'maximumEntries': self.maximum_entries,
            'participantsPerEntry': self.participants_per_entry
        }
