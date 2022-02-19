from typing import Optional
from types import TracebackType
from threading import Lock
from collections.abc import Callable
from collections import deque
import sys

__author__: str
__version__: str
__license__: str
__description__: str
PY35 = sys.version_info >= (3, 5)


class RateLimiter:
    calls: deque[float]

    period: int
    max_calls: int
    callback: Optional[Callable, None]
    _lock: Lock
    _alock: Lock

    # Lock to protect creation of self._alock
    s_init_lock: Lock

    def __init__(self, max_calls: int, period: int = ..., callback: Optional[Callable, None] = ...) -> None:
        ...

    def __call__(self, f: Callable) -> Callable:
        ...

    def __enter__(self) -> ...:
        ...

    def __exit__(
        self,
        exc_type: Optional[type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType]
    ) -> None:
        ...

    if PY35:
        aenter_code: str
        __aexit__ = __exit__

    @property
    def _timespan(self) -> float:
        ...
