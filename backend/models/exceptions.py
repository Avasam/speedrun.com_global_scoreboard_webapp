from typing import Literal


class UserUpdaterError(Exception):
    """ Usage: raise UserUpdaterError({"error":"On Status Label", "details":"Details of error"}) """

    args: tuple[dict[Literal["error", "details"], str], ...]


class SpeedrunComError(UserUpdaterError):
    """ Usage: raise NotFoundError({"error":"`HTTP_STATUS_CODE` (speedrun.com)", "details":"Details of error"}) """


class UnderALotOfPressure(SpeedrunComError):
    """ Usage: raise NotFoundError({"error":"`HTTP_STATUS_CODE` (speedrun.com)", "details":"Details of error"}) """


class UnhandledThreadException(Exception):
    pass
