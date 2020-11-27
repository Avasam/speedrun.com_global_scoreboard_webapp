from __future__ import annotations
from datetime import datetime, timedelta
from math import ceil, floor
from services.utils import get_file, UserUpdaterError
from typing import Dict, Optional, Union
from urllib import parse
import configs

memoized_requests: Dict[str, SrcRequest] = {}


class SrcRequest():
    global memoized_requests
    result: dict
    timestamp: datetime

    def __init__(self, result: dict, timestamp: datetime):
        self.result = result
        self.timestamp = timestamp

    @staticmethod
    def get_cached_response_or_new(url: str) -> dict:
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
            memoized_requests[url] = SrcRequest(result, today)
            return result

    @staticmethod
    def get_paginated_response(url: str) -> dict:
        summed_results = {"data": []}
        next_url = url
        while next_url:
            max_param = parse.parse_qs(parse.urlparse(next_url).query).get('max')
            results_per_page = int(max_param[0]) if max_param else 20

            # Get the next page of results ...
            while True:
                try:
                    result = get_file(next_url)
                    break
                # If it failed, try again with a smaller page
                except UserUpdaterError as exception:
                    if exception.args[0]['error'] != "HTTPError 500" or results_per_page < 20:
                        raise exception
                    halved_results_per_page = floor(results_per_page / 2)
                    print("SRC returned 500 for a paginated request. "
                          f"Halving the max results per page from {results_per_page} to {halved_results_per_page}")
                    next_url = next_url.replace(f"max={results_per_page}", f"max={halved_results_per_page}")
                    results_per_page = halved_results_per_page

            # ... and combine it with previous ones
            next_url = next((link["uri"] for link in result["pagination"]["links"] if link["rel"] == "next"), None)
            summed_results["data"] += result["data"]

        return summed_results


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


class User:
    _points: float = 0
    _name: str = ""
    _id: str = ""
    _country_code: Optional[str] = None
    _banned: bool = False
    _point_distribution_str: str = ""

    def __init__(self, id_or_name: str) -> None:
        self._id = id_or_name
        self._name = id_or_name

    def __str__(self) -> str:
        return f"User: <{self._name}, {ceil(self._points * 100) / 100}, {self._id}{'(Banned)' if self._banned else ''}>"
