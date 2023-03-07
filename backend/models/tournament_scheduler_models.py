from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional, cast

from models.core_models import BaseModel, Player, db
from services.utils import map_to_dto
from sqlalchemy import Boolean, Column, DateTime, Integer, String, orm

# TODO: Validate and maybe fix stubs
# pyright: reportOptionalMemberAccess=false

CASCADE = "all,delete,delete-orphan"


class Schedule(BaseModel):
    __tablename__ = "schedule"

    schedule_id = Column(Integer, primary_key=True)
    name: str | Column[String] = Column(String(128), nullable=False, default="")
    owner_id = Column(String(8), db.ForeignKey("player.user_id"), nullable=False)
    registration_key = Column(String(36), nullable=False)
    is_active: bool | Column[Boolean] = Column(db.Boolean, nullable=False, default=True)
    deadline: datetime | Column[DateTime] | None = Column(DateTime, nullable=True)

    owner: Player = db.relationship("Player", back_populates="schedules")
    time_slots: list[TimeSlot] = db.relationship(
        "TimeSlot",
        cascade=CASCADE,
        back_populates="schedule",
    )

    group_id: int | Column[Integer] | None = Column(Integer, nullable=True)
    order: int | Column[Integer] | None = Column(Integer, nullable=False, default=-1)

    if TYPE_CHECKING:
        def __init__(  # noqa: PLR0913
            self,
            registration_key: str | Column[String],
            schedule_id: int | Column[Integer] = ...,
            owner_id: str | Column[String] = ...,
            owner: Player = ...,
            time_slots: list[TimeSlot] = ...,
            group_id: int | Column[Integer] | None = ...,
            name: str | Column[String] | None = ...,
            is_active: bool | Column[Boolean] | None = ...,
            deadline: datetime | Column[DateTime] | None = ...,
            order: int | Column[Integer] | None = ...,
        ):
            ...

    @ staticmethod
    def get(schedule_id: int):
        return cast(Optional[Schedule], Schedule.query.get(schedule_id))

    @ staticmethod
    def get_with_key(schedule_id: int, registration_key: str):
        try:
            return cast(
                Optional[Schedule],
                Schedule
                .query
                .filter(Schedule.schedule_id == schedule_id)
                .filter(Schedule.registration_key == registration_key)
                .one(),
            )
        except orm.exc.NoResultFound:
            return None

    def to_dto(self):
        return {
            "id": self.schedule_id,
            "name": self.name,
            "active": self.is_active,
            "registrationKey": self.registration_key,
            "deadline": self.deadline,
            "timeSlots": map_to_dto(self.time_slots),
            "groupId": self.group_id,
            "order": self.order,
        }


class ScheduleGroup(BaseModel):
    __tablename__ = "schedule_group"

    group_id = Column(Integer, primary_key=True)
    name: str | Column[String] = Column(String(128), nullable=False, default="")
    owner_id = Column(String(8), db.ForeignKey("player.user_id"), nullable=False)
    order: int | Column[Integer] | None = Column(Integer, nullable=False, default=-1)

    if TYPE_CHECKING:
        def __init__(
            self,
            group_id: int | Column[Integer] = ...,
            name: str | Column[String] = ...,
            order: int | Column[Integer] | None = ...,
            owner_id: str | Column[String] = ...,
        ):
            ...

    @ staticmethod
    def get(group_id: int):
        return cast(Optional[ScheduleGroup], ScheduleGroup.query.get(group_id))

    @ staticmethod
    def get_schedules(group_id: int):
        try:
            return cast(list[Schedule], Schedule.query.filter(Schedule.group_id == group_id).all())
        except orm.exc.NoResultFound:
            return None

    def to_dto(self):
        return {
            "id": self.group_id,
            "name": self.name,
            "order": self.order,
        }


class TimeSlot(BaseModel):
    __tablename__ = "time_slot"

    time_slot_id = Column(Integer, primary_key=True)
    schedule_id: int | Column[Integer] = Column(Integer, db.ForeignKey("schedule.schedule_id"), nullable=False)
    date_time: datetime | Column[DateTime] = Column(DateTime, nullable=False)
    maximum_entries: int | Column[Integer] = Column(Integer, nullable=False)
    participants_per_entry: int | Column[Integer] = Column(Integer, nullable=False)

    schedule: Schedule = db.relationship("Schedule", back_populates="time_slots")
    registrations: list[Registration] = db.relationship(
        "Registration",
        cascade=CASCADE,
        back_populates="timeslot",
    )

    if TYPE_CHECKING:
        def __init__(  # noqa: PLR0913
            self,
            date_time: datetime | Column[DateTime],
            maximum_entries: int | Column[Integer],
            participants_per_entry: int | Column[Integer],
            schedule_id: int | Column[Integer],
            schedule: Schedule = ...,
            time_slot_id: int | Column[Integer] = ...,
            registrations: list[Registration] = ...,
        ):
            ...

    @ staticmethod
    def get_with_key(time_slot_id: int, registration_key: str) -> TimeSlot | None:
        try:
            parent_schedule = cast(
                Schedule,
                Schedule
                .query
                .filter(Schedule.registration_key == registration_key)
                .one(),
            )
            return cast(
                TimeSlot,
                TimeSlot
                .query
                .filter(TimeSlot.time_slot_id == time_slot_id)
                .filter(TimeSlot.schedule_id == parent_schedule.schedule_id)
                .one(),
            )
        except orm.exc.NoResultFound:
            return None

    def register_participant(self, participant_names: list[str]):
        new_registration = Registration(time_slot_id=self.time_slot_id)
        db.session.add(new_registration)
        db.session.flush()

        new_participants = [
            Participant(
                registration_id=new_registration.registration_id,
                name=participant_name,
            )
            for participant_name in participant_names
        ]

        db.session.bulk_save_objects(new_participants)

        db.session.commit()
        return new_registration.registration_id

    def to_dto(self):
        return {
            "id": self.time_slot_id,
            "dateTime": self.date_time,
            "maximumEntries": self.maximum_entries,
            "participantsPerEntry": self.participants_per_entry,
            "registrations": map_to_dto(self.registrations),
        }


class Registration(BaseModel):
    __tablename__ = "registration"

    registration_id = Column(Integer, primary_key=True)
    time_slot_id = Column(Integer, db.ForeignKey("time_slot.time_slot_id"), nullable=False)

    timeslot: TimeSlot = db.relationship("TimeSlot", back_populates="registrations")
    participants: list[Participant] = db.relationship(
        "Participant",
        cascade=CASCADE,
        back_populates="registration",
    )

    if TYPE_CHECKING:
        def __init__(
            self,
            time_slot_id: int | Column[Integer],
            registration_id: int | Column[Integer] = ...,
            timeslot: TimeSlot = ...,
            participants: list[Participant] = ...,
        ):
            ...

    def to_dto(self):
        return {
            "id": self.registration_id,
            "participants": [participant.name for participant in self.participants],
        }


class Participant(BaseModel):
    __tablename__ = "participant"

    registration_id: int | Column[Integer] = Column(
        Integer, db.ForeignKey("registration.registration_id"), primary_key=True,
    )
    name: str | Column[String] = Column(String(128), primary_key=True)

    registration: Registration = db.relationship("Registration", back_populates="participants")

    if TYPE_CHECKING:
        def __init__(
            self,
            registration_id: int | Column[Integer] = ...,
            name: str | Column[String] = ...,
            registration: Registration = ...,
        ):
            ...
