from __future__ import annotations
from typing import Literal, Optional, TypedDict


class SrcProfileDto(TypedDict):
    id: str
    names: __NamesData
    pronouns: str
    weblink: str
    role: str
    signup: str
    location: __LocationData
    twitch: Optional[__UriData]
    hitbox: Optional[__UriData]
    youtube: Optional[__UriData]
    twitter: Optional[__UriData]
    speedrunslive: Optional[__UriData]
    assets: _AssetsData
    links: list[__RelUriData]


class SrcRunDto(TypedDict):
    id: str
    weblink: str
    game: dict[Literal["data"], SrcGameDto]
    # game: str # when not embedding
    # When embedding
    # level: dict[
    #     Literal["data"],
    #     # Note: is actually `SrcLevelDto | list` (empty list when no level data)
    #     # To simplify typings we assume truthyness
    #     SrcLevelDto | None
    # ]
    level: Optional[str]
    category: str
    videos: dict[Literal["links"], list[__UriData]]
    comment: str
    status: __StatusData
    players: list[__PlayersData]
    date: str
    submitted: None
    times: __TimesData
    system: __SystemData
    splits: __RelUriData
    values: dict[str, str]


class SrcGameDto(TypedDict):
    id: str
    names: __NamesData
    abbreviation: str
    weblink: str
    discord: str
    released: int
    ruleset: dict[str, bool | str | list[str]]
    romhack: bool
    gametypes: list[str]
    platforms: list[str]
    regions: list[str]
    genres: list[str]
    engines: list[str]
    developpers: list[str]
    publishers: list[str]
    moderators: dict[str, str]
    created: str
    assets: dict[str, __UriData]
    links: list[__RelUriData]
    variables: dict[Literal["data"], list[dict[str, Optional[str]]]]


class SrcLeaderboardDto(TypedDict):
    weblink: str
    game: str
    category: str
    level: Optional[str]
    platform: Optional[str]
    region: Optional[str]
    emulators: Optional[str]
    timing: str
    value: dict
    runs: list[__LeaderboardRunData]
    # players only exists when embeded
    players: dict[Literal["data"], list[SrcRunDto]]


class SrcLevelDto(TypedDict):
    id: str
    name: str
    weblink: str
    rules: str
    links: list[__RelUriData]


class __LeaderboardRunData(TypedDict):
    place: int
    run: SrcRunDto


class __SystemData(TypedDict):
    platform: Optional[str]
    emulated: bool
    region: str


class __TimesData(TypedDict):
    primary: str
    primary_t: float
    realtime: str
    realtime_t: float
    realtime_noloads: Optional[str]
    realtime_noloads_t: float
    ingame: Optional[str]
    ingame_t: float


class __StatusData(TypedDict):
    status: str
    examiner: Optional[str]


class __LocationData(TypedDict):
    country: __CountryData
    region: __CountryData


class __CountryData(TypedDict):
    code: str
    names: __NamesData


__NamesData = dict[Literal["international"], str]


class _AssetsData(TypedDict):
    icon: __UriData
    image: __UriData


class __UriData(TypedDict):
    uri: str


class __RelUriData(__UriData):
    rel: str


class __PlayersData(__RelUriData):
    id: str
