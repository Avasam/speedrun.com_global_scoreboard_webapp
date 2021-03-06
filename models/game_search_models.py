from __future__ import annotations
from models.core_models import db, Player
from sqlalchemy import orm
from typing import Optional, Union


class GameValues(db.Model):
    __tablename__ = "game_values"

    game_id: str = db.Column(db.String(8), primary_key=True)
    category_id: str = db.Column(db.String(8), primary_key=True)
    run_id: str = db.Column(db.String(8), nullable=False)
    platform_id: Optional[str] = db.Column(db.String(8))
    wr_time: int = db.Column(db.Integer, nullable=False)
    wr_points: int = db.Column(db.Integer, nullable=False)
    mean_time: int = db.Column(db.Integer, nullable=False)

    @staticmethod
    def create_or_update(
            game_id: str,
            category_id: str,
            platform_id: Optional[str],
            wr_time: int,
            wr_points: int,
            mean_time: int,
            run_id: str):
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
            platform_id: Optional[str],
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

    def to_dto(self) -> dict[str, Union[str, int, None]]:
        return {
            'gameId': self.game_id,
            'categoryId': self.category_id,
            'platformId': self.platform_id,
            'wrTime': self.wr_time,
            'wrPoints': self.wr_points,
            'meanTime': self.mean_time,
            'runId': self.run_id,
        }
