from __future__ import annotations
from typing import Optional, Union

from math import ceil

from services.utils import map_to_dto, get_file


class Run:
    id_ = ""
    primary_t = 0.0
    game = ""
    game_name = ""
    category = ""
    category_name = ""
    variables = {}
    level = ""
    level_name = ""
    level_fraction = 1.0
    _points = 0.0
    # This below section is for game search
    _mean_time = 0.0
    _is_wr_time = False

    # TODO: Reanable sonarlint max args rule
    def __init__(
            self,
            id_: str,
            primary_t: float,
            game: str,
            game_name: str,
            category: str,
            variables: Optional[dict[str, str]] = None,
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
        return f"Run: <Game: {self.game}, " + \
               f"Category: {self.category}, {level_str}{self.variables} {ceil(self._points * 100) / 100}>"

    def __eq__(self, other: object) -> bool:
        """
        :type other: Run
        """
        if not isinstance(other, Run):
            raise TypeError("other is not a Run")
        return (self.category, self.level) == (other.category, other.level)

    def __ne__(self, other: object) -> bool:
        """
        :type other: Run
        """
        return not self == other

    def __hash__(self):
        return hash((self.category, self.level))

    def to_dto(self) -> dict[str, Union[str, float]]:
        return {
            "gameName": self.game_name,
            "categoryName": self.category_name,
            "levelName": self.level_name,
            "points": self._points,
            "levelFraction": self.level_fraction
        }


PointsDistributionDto = list[list[dict[str, Union[str, int, bool]]]]


class User:
    _points: float = 0
    _name: str = ""
    _id: str = ""
    _country_code: Optional[str] = None
    _banned: bool = False
    _points_distribution: list[list[Run]] = [[], []]

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

    def fetch_and_set_user_code_and_name(self) -> None:
        url = "https://www.speedrun.com/api/v1/users/{user}".format(user=self._id)
        infos = get_file(url, {}, True)

        self._id = infos["data"]["id"]
        location = infos["data"]["location"]
        if location is not None:
            country = location["country"]
            region = location.get("region")
            self._country_code = region["code"] if region else country["code"]
        else:
            self._country_code = None
        self._name = infos["data"]["names"].get("international")
        if infos["data"]["role"] == "banned":
            self._banned = True
            self._points = 0
