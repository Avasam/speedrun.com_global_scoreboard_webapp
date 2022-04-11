from __future__ import annotations

from typing import TYPE_CHECKING, Optional, cast, overload

from models.core_models import BaseModel, db
from sqlalchemy import Column, Integer, String, orm


class GameValues(BaseModel):
    __tablename__ = "game_values"

    game_id = db.Column(db.String(8), primary_key=True)
    category_id = db.Column(db.String(8), primary_key=True)
    run_id = db.Column(db.String(8), nullable=False)
    platform_id = db.Column(db.String(8))
    alternate_platforms = db.Column(db.String())
    wr_time = db.Column(db.Integer, nullable=False)
    wr_points = db.Column(db.Integer, nullable=False)
    mean_time = db.Column(db.Integer, nullable=False)

    if TYPE_CHECKING:
        @overload
        def __init__(  # type: ignore # pylint: disable=too-many-arguments
            self,
            game_id: str | Column[String],
            category_id: str | Column[String],
            run_id: str | Column[String],
            platform_id: Optional[str | Column[String]],
            alternate_platforms: Optional[str | Column[String]],
            wr_time: int | Column[Integer],
            wr_points: int | Column[Integer],
            mean_time: int | Column[Integer],
        ): ...

    @staticmethod
    def create_or_update(
            game_id: str,
            category_id: str,
            platform_id: Optional[str],
            alternate_platforms: Optional[str],
            wr_time: int,
            wr_points: int,
            mean_time: int,
            run_id: str):
        existing_game_values = GameValues.get(game_id, category_id)
        if existing_game_values is None:
            return GameValues.create(
                game_id,
                category_id,
                platform_id,
                alternate_platforms,
                wr_time,
                wr_points,
                mean_time, run_id)
        existing_game_values.platform_id = platform_id
        existing_game_values.alternate_platforms = alternate_platforms
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
            platform_id: Optional[str],
            alternate_platforms: Optional[str],
            wr_time: int,
            wr_points: int,
            mean_time: int,
            run_id: str) -> GameValues:
        game_values = GameValues(
            game_id=game_id,
            category_id=category_id,
            platform_id=platform_id,
            alternate_platforms=alternate_platforms,
            wr_time=wr_time,
            wr_points=wr_points,
            mean_time=mean_time,
            run_id=run_id)
        db.session.add(game_values)
        db.session.commit()

        return game_values

    @staticmethod
    def get(game_id: str, category_id: str):
        try:
            return cast(
                GameValues,
                GameValues
                .query
                .filter(GameValues.game_id == game_id)
                .filter(GameValues.category_id == category_id)
                .one()
            )
        except orm.exc.NoResultFound:
            return None

    def to_dto(self):
        return {
            "gameId": self.game_id,
            "categoryId": self.category_id,
            "platformId": self.platform_id,
            "alternatePlatformsIds": self.alternate_platforms.split(",") if self.alternate_platforms else [],
            "wrTime": self.wr_time,
            "wrPoints": self.wr_points,
            "meanTime": self.mean_time,
            "runId": self.run_id,
        }
