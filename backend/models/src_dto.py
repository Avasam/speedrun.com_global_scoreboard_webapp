from __future__ import annotations

from typing import Any, Literal, TypedDict

SrcDataResultDto = dict[Literal["data"], Any]
SrcPaginatedDataResultDto = dict[Literal["data"], list]


class SrcPaginationResultDto(TypedDict):
    data: list
    pagination: __PaginationData


class __PaginationData(TypedDict):
    offset: int
    max: int  # noqa: A003
    size: int
    links: list[__RelUriData]


class SrcProfileDto(TypedDict):
    id: str  # noqa: A003
    names: __NamesData
    pronouns: str
    weblink: str
    role: str
    signup: str
    location: __LocationData | None
    twitch: __UriData | None
    hitbox: __UriData | None
    youtube: __UriData | None
    twitter: __UriData | None
    speedrunslive: __UriData | None
    assets: _AssetsData
    links: list[__RelUriData]


class SrcRunDto(TypedDict):
    id: str  # noqa: A003
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
    level: str | None
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
    id: str  # noqa: A003
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
    variables: dict[Literal["data"], list[dict[str, str | None]]]


class SrcLeaderboardDto(TypedDict):
    weblink: str
    game: str
    category: str
    level: str | None
    platform: str | None
    region: str | None
    emulators: str | None
    timing: str
    value: dict
    runs: list[__LeaderboardRunData]
    # players only exists when embeded
    players: dict[Literal["data"], list[SrcRunDto]]


class SrcLevelDto(TypedDict):
    id: str  # noqa: A003
    name: str
    weblink: str
    rules: str
    links: list[__RelUriData]


class SrcErrorResultDto(TypedDict):
    status: int
    message: str
    links: list[__RelUriData]


class __LeaderboardRunData(TypedDict):
    place: int
    run: SrcRunDto


class __SystemData(TypedDict):
    platform: str | None
    emulated: bool
    region: str


class __TimesData(TypedDict):
    primary: str
    primary_t: float
    realtime: str
    realtime_t: float
    realtime_noloads: str | None
    realtime_noloads_t: float
    ingame: str | None
    ingame_t: float


class __StatusData(TypedDict):
    status: str
    examiner: str | None


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
    id: str  # noqa: A003
