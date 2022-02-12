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
    # Commented is data structure when not embedding
    # game: str
    level: dict[
        Literal["data"],
        # Note: is actually `SrcLevelDto | list` (empty list when no level data)
        # To simplify typings we assume truthyness
        SrcLevelDto | None
    ]
    # level: Optional[str]
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
    names: dict
    abbreviation: str
    weblink: str
    discord: str
    released: int
    ruleset: dict
    romhack: bool
    gametypes: list
    platforms: list
    regions: list
    genres: list
    engines: list
    developpers: list
    publishers: list
    moderators: dict
    created: str
    assets: dict
    links: list
    variables: dict


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
    primary_t: int
    realtime: str
    realtime_t: int
    realtime_noloads: Optional[str]
    realtime_noloads_t: int
    ingame: Optional[str]
    ingame_t: int


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
