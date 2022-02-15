from __future__ import annotations
from typing import Optional, Union

from math import ceil
from models.src_dto import SrcGameDto, SrcLevelDto, SrcProfileDto, SrcRunDto

from services.utils import map_to_dto, get_file

ROBLOX_SERIES_ID = "m72vj342"
NO_SERIES_ID = "yr4gon12"


class Run:
    id_ = ""
    primary_t = 0.0
    game: SrcGameDto
    base_game_key: str
    category: str
    category_name: str = ""
    variables = {}
    level: Optional[SrcLevelDto]
    level_fraction = 1.0
    _points = 0.0
    diminished_points = 0.0
    # This below section is for game search
    _mean_time = 0.0
    _is_wr_time = False

    def __init__(
        self,
        run_dto: SrcRunDto,
        variables: Optional[dict[str, str]] = None,
        level: SrcLevelDto = None,
        level_count: int = 0
    ):
        self.id_ = run_dto["id"]
        self.primary_t = run_dto["times"]["primary_t"]
        self.game = run_dto["game"]["data"]
        self.category = run_dto["category"]
        self.variables = variables if variables is not None else {}
        self.level = level
        self.level_fraction = 1 / (level_count + 1)

        if "ROBLOX" in self.game["names"]["international"].upper():
            self.base_game_key = ROBLOX_SERIES_ID
        else:
            self.base_game_key = next(
                (link["uri"].rstrip("/")
                 for link
                 in self.game["links"]
                 if link["rel"] == "base-game"),
                "").split("/")[-1]
            series_id = next(
                (link["uri"].rstrip("/")
                 for link
                 in self.game["links"]
                 if link["rel"] == "series"),
                "").split("/")[-1]
            # If it is a derived-game/romhack, but base-game is not specified, use the series id instead
            # uri: "https://www.speedrun.com/api/v1/games/"
            if self.base_game_key == "games" and series_id and series_id != NO_SERIES_ID:
                self.base_game_key = series_id
            else:
                self.base_game_key = self.game["id"]

    def __str__(self) -> str:
        level_str = f"Level/{str(self.level_fraction)[:4]}: {self.level['id']}, " if self.level else ""
        return f"Run: <Game: {self.game['id']}, " + \
               f"Category: {self.category}, {level_str}{self.variables}, {ceil(self._points * 100) / 100}>"

    def __eq__(self, other: object) -> bool:
        """
        :type other: Run
        """
        if not isinstance(other, Run):
            raise TypeError("other is not a Run")
        return (self.category, self.level and self.level["id"]) == (other.category, other.level and other.level["id"])

    def __ne__(self, other: object) -> bool:
        """
        :type other: Run
        """
        return not self == other

    def __hash__(self):
        return hash((self.category, self.level and self.level["id"]))

    def to_dto(self) -> dict[str, Union[str, float]]:
        return {
            "gameName": self.game["names"]["international"],
            "categoryName": self.category_name,
            "levelName": self.level["name"] if self.level else "",
            "points": self._points,
            "diminishedPoints": self.diminished_points,
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
        infos: SrcProfileDto = get_file(url, {}, "http_cache")["data"]

        self._id = infos["id"]
        location = infos["location"]
        if location is not None:
            country = location["country"]
            region = location.get("region")
            self._country_code = region["code"] if region else country["code"]
        else:
            self._country_code = None
        self._name = infos["names"]["international"]
        if infos["role"] == "banned":
            self._banned = True
            self._points = 0
