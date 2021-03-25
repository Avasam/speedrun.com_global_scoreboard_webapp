from __future__ import annotations
from models.core_models import Player
from datetime import datetime
from models.core_models import db
from services.utils import map_to_dto
from sqlalchemy import orm
from typing import Dict, List, Optional, Union


class Schedule(db.Model):
    __tablename__ = "schedule"

    schedule_id: int = db.Column(db.Integer, primary_key=True)
    name: str = db.Column(db.String(128), nullable=False, default='')
    owner_id: int = db.Column(db.String(8), db.ForeignKey('player.user_id'), nullable=False)
    registration_key: str = db.Column(db.String(36), nullable=False)
    is_active: bool = db.Column(db.Boolean, nullable=False, default=True)
    deadline: Optional[datetime] = db.Column(db.DateTime, nullable=True)

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

    def to_dto(self) -> dict[str, Union[str, int, bool, Optional[datetime], List[Dict[str, Union[str, int, bool]]]]]:
        return {
            'id': self.schedule_id,
            'name': self.name,
            'active': self.is_active,
            'registrationKey': self.registration_key,
            'deadline': self.deadline,
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
