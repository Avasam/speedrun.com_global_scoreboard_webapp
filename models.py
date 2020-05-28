#!/usr/bin/python
# -*- coding: utf-8 -*-

from __future__ import annotations
from datetime import datetime, timedelta
from flask_login import login_user, UserMixin
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import orm, text
from typing import Any, Dict, List, Optional, Tuple, Union
from utils import get_file, SpeedrunComError
import configs
import traceback
import uuid


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
    country_code: Optional[str] = db.Column(db.String(5))
    score: int = db.Column(db.Integer, nullable=False)
    score_details: str = db.Column(db.String())
    last_update: Optional[datetime] = db.Column(db.DateTime())
    rank: Optional[int] = None

    schedules = db.relationship("Schedule", back_populates="owner")

    @staticmethod
    def authenticate(api_key: str) -> Tuple[Optional[Player], Optional[str]]:
        try:  # Get user from speedrun.com using the API key
            data = get_file(
                "https://www.speedrun.com/api/v1/profile",
                {"X-API-Key": api_key}
            )["data"]
        except SpeedrunComError:
            return None, 'Invalid API key.'
        except Exception:
            print("\nError: Unknown\n{}".format(traceback.format_exc()))
            return None, traceback.format_exc()

        user_id: Optional[str] = data["id"]
        if not user_id:  # Confirms wether the API key is valid
            return None, 'Invalid API key.'

        user_name: str = data["names"]["international"]
        print(f"Logging in '{user_id}' ({user_name})")

        player: Player = Player.get(user_id)
        if not player:
            player = Player.create(user_id, user_name)

        login_user(player)  # Login for non SPA

        return player, None

    @staticmethod
    def get(id: str) -> Player:
        return Player.query.get(id)

    @staticmethod
    def get_all():
        sql = text("SELECT user_id, name, country_code, score, last_update, CONVERT(rank, SIGNED INT) rank FROM ( "
                   "    SELECT *, "
                   "        IF(score = @_last_score, @cur_rank := @cur_rank, @cur_rank := @_sequence) AS rank, "
                   "        @_sequence := @_sequence + 1, "
                   "        @_last_score := score "
                   "    FROM player, (SELECT @cur_rank := 1, @_sequence := 1, @_last_score := NULL) r "
                   "    WHERE score > 0 "
                   "    ORDER BY score DESC "
                   ") ranked;")
        return [Player(
            user_id=player[0],
            name=player[1],
            country_code=player[2],
            score=player[3],
            last_update=player[4],
            rank=player[5]) for player in db.engine.execute(sql).fetchall()]

    @staticmethod
    def create(user_id: str, name: str, **kwargs) -> Player:
        """
        kwargs:
        - score: int
        - last_update: Union[datetime, str]
        """
        score = kwargs.get('score', 0)
        last_update = kwargs.get('last_update', None)

        player = Player(
            user_id=user_id,
            name=name,
            score=score,
            last_update=last_update)
        db.session.add(player)
        db.session.commit()

        return player

    def get_friends(self) -> List[Player]:
        sql = text("SELECT f.friend_id, p.name, p.country_code, p.score FROM friend f "
                   "JOIN player p ON p.user_id = f.friend_id "
                   "WHERE f.user_id = '{user_id}';"
                   .format(user_id=self.user_id))
        return [Player(
            user_id=friend[0],
            name=friend[1],
            country_code=friend[2],
            score=friend[3]) for friend in db.engine.execute(sql).fetchall()]

    def befriend(self, friend_id: str) -> bool:
        if self.user_id == friend_id:
            return False
        sql = text("INSERT INTO friend (user_id, friend_id) "
                   "VALUES ('{user_id}', '{friend_id}');"
                   .format(
                       user_id=self.user_id,
                       friend_id=friend_id))
        return db.engine.execute(sql).rowcount > 0

    def unfriend(self, friend_id: str) -> bool:
        sql = text("DELETE FROM friend "
                   "WHERE user_id = '{user_id}' AND friend_id = '{friend_id}';"
                   .format(
                       user_id=self.user_id,
                       friend_id=friend_id))
        return db.engine.execute(sql).rowcount > 0

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

    def to_dto(self) -> dict[str, Union[str, int, datetime]]:
        return {
            'userId': self.user_id,
            'name': self.name,
            'countryCode': self.country_code,
            'score': self.score,
            'lastUpdate': self.last_update,
            'rank': self.rank,
        }


memoized_requests: Dict[str, CachedRequest] = {}


class CachedRequest():
    global memoized_requests
    result: dict
    timestamp: datetime

    def __init__(self, result: dict, timestamp: datetime):
        self.result = result
        self.timestamp = timestamp

    @staticmethod
    def get_response_or_new(url: str) -> dict:
        today = datetime.utcnow()
        yesterday = today - timedelta(days=configs.last_updated_days[0])

        try:
            cached_request = memoized_requests[url]
        except KeyError:
            cached_request = None
        if (cached_request and cached_request.timestamp >= yesterday):
            return cached_request.result
        else:
            result = get_file(url)
            memoized_requests[url] = CachedRequest(result, today)
            return result


class GameValues(db.Model, UserMixin):
    __tablename__ = "game_values"

    game_id: str = db.Column(db.String(8), primary_key=True)
    category_id: str = db.Column(db.String(8), primary_key=True)
    run_id: str = db.Column(db.String(8), nullable=False)
    platform_id: str = db.Column(db.String(8), nullable=False)
    wr_time: int = db.Column(db.Integer, nullable=False)
    wr_points: int = db.Column(db.Integer, nullable=False)
    mean_time: int = db.Column(db.Integer, nullable=False)

    @staticmethod
    def create_or_update(
            game_id: str,
            category_id: str,
            platform_id: str,
            wr_time: int,
            wr_points: int,
            mean_time: int,
            run_id: str):
        print("GameValues",
              game_id,
              category_id,
              platform_id,
              wr_time,
              wr_points,
              mean_time,
              run_id)
        existing_game_values = GameValues.get(game_id, category_id)
        if existing_game_values is None:
            return GameValues.create(game_id, category_id, platform_id, wr_time, wr_points, mean_time, run_id)
        existing_game_values.platform_id = platform_id
        existing_game_values.wr_time = wr_time
        existing_game_values.wr_points = wr_points
        existing_game_values.mean_time = mean_time
        existing_game_values.run_id = run_id
        db.session.commit()
        return existing_game_values

    @staticmethod
    def create(
            game_id: str,
            category_id: str,
            platform_id: str,
            wr_time: int,
            wr_points: int,
            mean_time: int,
            run_id: str) -> GameValues:
        game_values = GameValues(
            game_id=game_id,
            category_id=category_id,
            platform_id=platform_id,
            wr_time=wr_time,
            wr_points=wr_points,
            mean_time=mean_time,
            run_id=run_id)
        db.session.add(game_values)
        db.session.commit()

        return game_values

    @staticmethod
    def get(game_id: str, category_id: str) -> Optional[Player]:
        try:
            return GameValues \
                .query \
                .filter(GameValues.game_id == game_id) \
                .filter(GameValues.category_id == category_id) \
                .one()
        except orm.exc.NoResultFound:
            return None


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
