from __future__ import annotations
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import orm, text
from typing import Any, Dict, List, Optional, Tuple, Union
from services.utils import get_file, SpeedrunComError, UserUpdaterError
import sys
import traceback
import uuid

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


class Player(db.Model):
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
            return None, 'Invalid SRC API key'
        except UserUpdaterError as exception:
            return None, f"Error: {exception.args[0]['error']}\n{exception.args[0]['details']}"
        except Exception:
            print("\nError: Unknown\n{}".format(traceback.format_exc()))
            return None, traceback.format_exc()

        user_id: Optional[str] = data["id"]
        if not user_id:  # Confirms wether the API key is valid
            return None, 'Invalid SRC API key'

        user_name: str = data["names"]["international"]
        print(f"Logging in '{user_id}' ({user_name})")

        player: Player = Player.get(user_id)
        if not player:
            player = Player.create(user_id, user_name)

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

    def update(self, **kwargs: Dict[str, Union[str, float, datetime]]) -> Player:
        player = Player \
            .query \
            .filter(Player.user_id == self.user_id) \
            .update(kwargs)
        db.session.commit()
        return player

    def delete(self) -> bool:
        db.session.delete(self)
        db.session.commit()
        return True

    def get_friends(self) -> List[Player]:
        sql = text("SELECT f.friend_id, p.name, p.country_code, p.score, p.last_update FROM friend f "
                   "JOIN player p ON p.user_id = f.friend_id "
                   "WHERE f.user_id = '{user_id}';"
                   .format(user_id=self.user_id))
        return [Player(
            user_id=friend[0],
            name=friend[1],
            country_code=friend[2],
            score=friend[3],
            last_update=friend[4]) for friend in db.engine.execute(sql).fetchall()]

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

    def update_schedule(self, schedule_id: int, name: str, is_active: bool, time_slots: List[Dict[str, Any]]) -> bool:
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

    def to_dto(self) -> dict[str, Union[str, int, datetime, None]]:
        return {
            'userId': self.user_id,
            'name': self.name,
            'countryCode': self.country_code,
            'score': self.score,
            'lastUpdate': self.last_update,
            'rank': self.rank,
        }


if 'models.tournament_scheduler_models' not in sys.modules:
    from models.tournament_scheduler_models import Participant, Registration, Schedule, TimeSlot
