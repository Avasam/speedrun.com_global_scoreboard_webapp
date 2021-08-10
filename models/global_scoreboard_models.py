from __future__ import annotations
from math import ceil
from services.utils import map_to_dto
from typing import Dict, List, Optional, Union


class Run:
    id_: str = ""
    primary_t: float = 0.0
    game: str = ""
    game_name: str = ""
    category: str = ""
    category_name: str = ""
    variables = {}
    level: str = ""
    level_name: str = ""
    level_fraction: float = 1
    _points: float = 0
    # This below section is for game search
    _mean_time: float = 0
    _is_wr_time: bool = False

    # TODO: Reanable sonarlint max args rule
    def __init__(
            self,
            id_: str,
            primary_t: float,
            game: str,
            game_name: str,
            category: str,
            variables=None,
            level: str = "",
            level_name: str = "",
            level_count: int = 0):
        self.id_ = id_
        self.primary_t = primary_t
        self.game = game
        self.game_name = game_name
        self.category = category
        self.variables = variables if variables is not None else {}
        self.level = level
        self.level_name = level_name
        self.level_fraction = 1 / (level_count + 1) if level else 1

    def __str__(self) -> str:
        level_str = f"Level/{self.level_fraction}: {self.level}, " if self.level else ""
        return f"Run: <Game: {self.game}, " \
               f"Category: {self.category}, {level_str}{self.variables} {ceil(self._points * 100) / 100}>"

    def __eq__(self, other) -> bool:
        """
        :type other: Run
        """
        return (self.category, self.level) == (other.category, other.level)

    def __ne__(self, other) -> bool:
        """
        :type other: Run
        """
        return not (self == other)

    def __hash__(self):
        return hash((self.category, self.level))

    def to_dto(self) -> dict[str, Union[str, float]]:
        return {
            'gameName': self.game_name,
            'categoryName': self.category_name,
            'levelName': self.level_name,
            'points': self._points,
            'levelFraction': self.level_fraction
        }


PointsDistributionDto = List[List[Dict[str, Union[str, int, bool]]]]


class User:
    _points: float = 0
    _name: str = ""
    _id: str = ""
    _country_code: Optional[str] = None
    _banned: bool = False
    _points_distribution: List[List[Run]] = [[], []]

    def __init__(self, id_or_name: str) -> None:
        self._id = id_or_name
        self._name = id_or_name

    def __str__(self) -> str:
        return f"User: <{self._name}, {ceil(self._points * 100) / 100}, {self._id}{'(Banned)' if self._banned else ''}>"

    def get_points_distribution_dto(self) -> PointsDistributionDto:
        return [
            map_to_dto(self._points_distribution[0]),
            map_to_dto(self._points_distribution[1])
        ]
