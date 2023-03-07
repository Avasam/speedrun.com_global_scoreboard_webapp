from __future__ import annotations

from typing import Literal


class UserUpdaterError(Exception):
    """
    Usage: raise UserUpdaterError({
        "error":"On Status Label",
        "details":"Details of error",
    })
    """

    args: tuple[dict[Literal["error", "details"], str], ...]


class SpeedrunComError(UserUpdaterError):
    """
    Usage: raise SpeedrunComError({
        "error":"On Status Label",
        "details":"Details of error",
    })
    """


class UnderALotOfPressureError(SpeedrunComError):
    """
    Usage: raise UnderALotOfPressureError({
        "error":"On Status Label",
        "details":"Details of error",
    })
    """


class UnhandledThreadException(Exception):  # noqa: N818
    pass
