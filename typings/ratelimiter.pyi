from collections import deque
from collections.abc import Callable
from threading import Lock
from types import TracebackType
from typing import Literal

__author__: str
__version__: str
__license__: str
__description__: str
PY35: Literal[False]


class RateLimiter:
    calls: deque[float]

    period: int
    max_calls: int
    callback: Callable | None
    _lock: Lock
    _alock: Lock

    # Lock to protect creation of self._alock
    s_init_lock: Lock

    def __init__(self, max_calls: int, period: int = ..., callback: Callable | None = ...) -> None:
        ...

    def __call__(self, f: Callable) -> Callable:
        ...

    def __enter__(self) -> ...:
        ...

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        ...

    @property
    def _timespan(self) -> float:
        ...
