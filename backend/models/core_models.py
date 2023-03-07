from __future__ import annotations

import sys
import traceback
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, TypedDict, Union, cast

from flask_sqlalchemy import Model, SQLAlchemy
from models.exceptions import SpeedrunComError, UserUpdaterError
from models.src_dto import SrcProfileDto
from services.utils import get_file
from sqlalchemy import Column, DateTime, Integer, String, or_, orm, text

# TODO: use and typecheck / typeguard JSONType
__JSONTypeBase = Union[str, int, float, bool, None, dict[str, Any], list[Any]]
JSONObjectType = dict[str, __JSONTypeBase]
JSONType = Union[str, int, float, bool, None, JSONObjectType, list[__JSONTypeBase]]

DATETIME_FORMAT = "%Y-%m-%dT%H:%M:%S.%fZ"

db = SQLAlchemy()

BaseModel: type[Model] = db.Model  # pyright: ignore[reportGeneralTypeIssues]
# TODO: Validate and maybe fix stubs
# pyright: reportOptionalMemberAccess=false

friend = db.Table(
    "friend",
    Column(
        "user_id",
        String(8),
        db.ForeignKey("player.user_id"),
    ),
    Column(
        "friend_id",
        String(8),
        db.ForeignKey("player.user_id"),
    ),
)


class __TimeSlotsDict(TypedDict):
    id: int  # noqa: A003
    dateTime: str  # noqa: N815
    maximumEntries: int  # noqa: N815
    participantsPerEntry: int  # noqa: N815


class ScheduleOrderDict(TypedDict):
    id: int  # noqa: A003
    isGroup: bool  # noqa: N815
    order: int


class Player(BaseModel):
    __tablename__ = "player"

    user_id = Column(String(8), primary_key=True)
    name = Column(String(32), nullable=False)
    # The biggest region code I found so far was "us/co/coloradosprings" at 21
    country_code = Column(String(24))
    score = Column(Integer, nullable=False)
    score_details = Column(String())
    last_update = Column(DateTime())
    rank: int | None = None

    schedules = db.relationship("Schedule", back_populates="owner")

    if TYPE_CHECKING:
        def __init__(  # noqa: PLR0913
            self,
            user_id: str | Column[String],
            name: str | Column[String],
            country_code: str | Column[String] | None,
            score: int | float | Column[Integer],
            last_update: str | Column[DateTime] | None,
            score_details: str | Column[String] | None = ...,
            rank: int | None = ...,
        ):
            ...

    @staticmethod
    def authenticate(api_key: str) -> tuple[Player | None, str | None]:
        try:  # Get user from speedrun.com using the API key
            src_profile: SrcProfileDto = get_file(
                "https://www.speedrun.com/api/v1/profile",
                headers={"X-API-Key": api_key},
            )["data"]
        except UserUpdaterError as exception:
            if isinstance(exception, SpeedrunComError) and exception.args[0]["error"].startswith("403"):
                return None, "Invalid SR.C API key"
            return None, f"Error: {exception.args[0]['error']}\n{exception.args[0]['details']}"
        except Exception:  # Do catch unknown errors
            print(f"\nError: Unknown\n{traceback.format_exc()}")
            return None, traceback.format_exc()

        user_id = src_profile["id"]
        if not user_id:  # Confirms wether the API key is valid
            return None, "Invalid SR.C API key"

        user_name: str = src_profile["names"]["international"]
        print(f"Logging in '{user_id}' ({user_name})")

        player: Player = Player.get(user_id)
        if not player:
            player = Player.create(user_id, user_name)

        return player, None

    @staticmethod
    def get(user_id: str):
        return cast(Player, Player.query.get(user_id))

    @staticmethod
    def get_all():
        sql = text(
            "SELECT user_id, name, country_code, score, last_update, CONVERT(rank, SIGNED INT) rank "  # noqa: S608
            + "FROM ( "
            + "    SELECT *, "
            + "        IF(score = @_last_score, @cur_rank := @cur_rank, @cur_rank := @_sequence) AS rank, "
            + "        @_sequence := @_sequence + 1, "
            + "        @_last_score := score "
            + "    FROM player, (SELECT @cur_rank := 1, @_sequence := 1, @_last_score := NULL) r "
            + "    WHERE score > 0 "
            + "    ORDER BY score DESC "
            + ") ranked;",
        )
        return [
            Player(
                user_id=player[0],
                name=player[1],
                country_code=player[2],
                score=player[3],
                last_update=player[4],
                rank=player[5],
            ) for player in db.engine.execute(sql).fetchall()
        ]

    @staticmethod
    def get_by_country_code(country_codes: list[str]):
        def to_filtered_dto(player: Player):
            return {
                "userId": player.user_id,
                "name": player.name,
                "countryCode": player.country_code,
                "lastUpdate": player.last_update,
            }

        country_code_queries = [
            y for x in [
                (
                    Player.country_code == country_code,
                    Player.country_code.like(f"{country_code}/%"),
                ) for country_code in country_codes
            ]
            for y in x
        ]

        return [
            to_filtered_dto(cast(Player, player))
            for player in Player.query.filter(or_(*country_code_queries)).all()
        ]

    @staticmethod
    def create(
            user_id: str,
            name: str,
            country_code: str | None = None,
            score: int | float = 0,
            score_details: str | None = None,
            last_update: str | None = None,
    ) -> Player:
        player = Player(
            user_id=user_id,
            name=name,
            country_code=country_code,
            score=score,
            score_details=score_details,
            last_update=last_update,
        )
        db.session.add(player)
        db.session.commit()

        return player

    def update(self, **kwargs: str | float | datetime | None):
        """
        kwargs:
        - name: str
        - country_code: str
        - score: int
        - last_update: Union[datetime, str]
        """
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

    def get_friends(self) -> list[Player]:
        sql = text(
            "SELECT f.friend_id, p.name, p.country_code, p.score, p.last_update FROM friend f "  # noqa: S608
            + "JOIN player p ON p.user_id = f.friend_id "
            + "WHERE f.user_id = :user_id;",
        )
        return [
            Player(
                user_id=friend[0],
                name=friend[1],
                country_code=friend[2],
                score=friend[3],
                last_update=friend[4],
            )
            for friend in db.engine.execute(sql, user_id=self.user_id).fetchall()
        ]

    def befriend(self, friend_id: str) -> bool:
        if self.user_id == friend_id:
            return False
        sql = text(
            "INSERT INTO friend (user_id, friend_id) "  # noqa: S608
            + "VALUES (:user_id, :friend_id);",
        )
        return db.engine.execute(sql, user_id=self.user_id, friend_id=friend_id).rowcount > 0

    def unfriend(self, friend_id: str) -> bool:
        sql = text(
            "DELETE FROM friend "  # noqa: S608
            + "WHERE user_id = :user_id AND friend_id = :friend_id",
        )
        return db.engine.execute(sql, user_id=self.user_id, friend_id=friend_id).rowcount > 0

    def get_schedules(self):
        return cast(
            list[Schedule],
            Schedule.query.filter(Schedule.owner_id == self.user_id).all(),
        )

    def create_schedule(
        self,
        name: str,
        is_active: bool,
        deadline: str | None,
        time_slots: list[__TimeSlotsDict],
        order: int | None,
    ):
        new_schedule = Schedule(
            name=name,
            owner_id=self.user_id,
            registration_key=str(uuid.uuid4()),
            is_active=is_active,
            deadline=None if deadline is None else datetime.strptime(deadline, DATETIME_FORMAT),
            order=order,
        )
        db.session.add(new_schedule)
        db.session.flush()

        new_time_slots = [
            TimeSlot(
                schedule_id=new_schedule.schedule_id,
                date_time=datetime.strptime(time_slot["dateTime"], DATETIME_FORMAT),
                maximum_entries=time_slot["maximumEntries"],
                participants_per_entry=time_slot["participantsPerEntry"],
            )
            for time_slot in time_slots
        ]
        db.session.bulk_save_objects(new_time_slots)

        db.session.commit()
        return new_schedule.schedule_id

    def update_schedule(
        self,
        schedule_id: int,
        name: str,
        is_active: bool,
        deadline: str | None,
        time_slots: list[__TimeSlotsDict],
    ) -> bool:
        try:
            schedule_to_update = cast(
                Schedule,
                Schedule
                .query
                .filter(Schedule.schedule_id == schedule_id)
                .filter(Schedule.owner_id == self.user_id)
                .one(),
            )
        except orm.exc.NoResultFound:
            return False

        schedule_to_update.name = name
        schedule_to_update.is_active = is_active
        schedule_to_update.deadline = None if deadline is None else datetime.strptime(deadline, DATETIME_FORMAT)

        # Manually take care of merging the time slots
        # since I can't figure out how to do it automatically within SQLAlchemy
        new_time_slots = []
        for time_slot_to_edit in time_slots:
            new_time_slot = None
            # If it already exists in session, use that one ...
            for existing_time_slot in schedule_to_update.time_slots:
                if time_slot_to_edit["id"] == existing_time_slot.time_slot_id:
                    new_time_slot = existing_time_slot
                    new_time_slot.date_time = datetime.strptime(time_slot_to_edit["dateTime"], DATETIME_FORMAT)
                    new_time_slot.maximum_entries = time_slot_to_edit["maximumEntries"]
                    new_time_slot.participants_per_entry = time_slot_to_edit["participantsPerEntry"]
                    new_time_slot.schedule_id = schedule_id
                    break
            # ... otherwise, create a brand new TimeSlot
            else:
                new_time_slot = TimeSlot(
                    date_time=datetime.strptime(time_slot_to_edit["dateTime"], DATETIME_FORMAT),
                    maximum_entries=time_slot_to_edit["maximumEntries"],
                    participants_per_entry=time_slot_to_edit["participantsPerEntry"],
                    schedule_id=schedule_id,
                )

            new_time_slots.append(new_time_slot)

        # cascade="all,delete,delete-orphan" will remove time slots we haven't added back
        schedule_to_update.time_slots = new_time_slots

        db.session.commit()
        return True

    def update_schedule_group_id(
        self,
        schedule_id: int,
        group_id: int | None,
    ) -> bool:
        try:
            if group_id is not None:
                ScheduleGroup \
                    .query \
                    .filter(ScheduleGroup.group_id == group_id) \
                    .filter(ScheduleGroup.owner_id == self.user_id) \
                    .one()
            schedule_to_update = cast(
                Schedule,
                Schedule
                .query
                .filter(Schedule.schedule_id == schedule_id)
                .filter(Schedule.owner_id == self.user_id)
                .one(),
            )
        except orm.exc.NoResultFound:
            return False

        schedule_to_update.group_id = group_id
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

    def update_schedule_order(self, schedule_orders: list[ScheduleOrderDict]) -> bool:
        for schedule_order in schedule_orders:
            try:
                id_filter = ScheduleGroup.group_id if schedule_order["isGroup"] else Schedule.schedule_id
                table = ScheduleGroup if schedule_order["isGroup"] else Schedule
                to_update = cast(
                    Union[ScheduleGroup, Schedule],
                    table
                    .query
                    .filter(table.owner_id == self.user_id)
                    .filter(id_filter == schedule_order["id"])
                    .one(),
                )
                to_update.order = schedule_order["order"]
            except orm.exc.NoResultFound:
                continue

        db.session.commit()
        return True

    def get_schedule_groups(self):
        return cast(
            list[ScheduleGroup],
            ScheduleGroup.query.filter(ScheduleGroup.owner_id == self.user_id).all(),
        )

    def create_schedule_group(self, name: str, order: int | None):
        new_schedule_group = ScheduleGroup(name=name, order=order, owner_id=self.user_id)
        db.session.add(new_schedule_group)

        db.session.commit()
        return new_schedule_group.group_id

    def update_schedule_group(
        self,
        group_id: int,
        name: str,
        order: int | None,
    ) -> bool:
        try:
            schedule_group_to_update = cast(
                ScheduleGroup,
                ScheduleGroup
                .query
                .filter(ScheduleGroup.group_id == group_id)
                .filter(ScheduleGroup.owner_id == self.user_id)
                .one(),
            )
        except orm.exc.NoResultFound:
            return False

        schedule_group_to_update.name = name
        schedule_group_to_update.order = order
        db.session.commit()
        return True

    def delete_schedule_group(self, group_id: int) -> bool:
        try:
            schedule_group_to_delete = ScheduleGroup \
                .query \
                .filter(ScheduleGroup.group_id == group_id) \
                .filter(ScheduleGroup.owner_id == self.user_id) \
                .one()
        except orm.exc.NoResultFound:
            return False
        db.session.delete(schedule_group_to_delete)
        db.session.commit()
        return True

    def update_registration(self, registration_id: int, participant_names: list[str]):
        try:
            registration_to_update = cast(
                Registration,
                Registration
                .query
                .filter(Registration.registration_id == registration_id)
                .one(),
            )

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
            registration_to_delete = cast(
                Registration,
                Registration
                .query
                .filter(Registration.registration_id == registration_id)
                .one(),
            )

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

    def to_dto(self):
        return {
            "userId": self.user_id,
            "name": self.name,
            "countryCode": self.country_code,
            "score": self.score,
            "lastUpdate": self.last_update,
            "rank": self.rank,
        }


if "models.tournament_scheduler_models" not in sys.modules:
    from models.tournament_scheduler_models import Participant, Registration, Schedule, ScheduleGroup, TimeSlot
