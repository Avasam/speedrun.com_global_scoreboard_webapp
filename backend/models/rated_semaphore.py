from types import TracebackType
from threading import BoundedSemaphore, Timer
from time import sleep
from typing import Optional


class RatedSemaphore(BoundedSemaphore):
    """Limit to 1 request per `period / limit` seconds (over long run)."""
    _value: int

    def __init__(self, limit=1, period=1):
        BoundedSemaphore.__init__(self, limit)
        limit -= 1
        timer = Timer(period, self.__add_token_loop, kwargs=dict(time_delta=float(period) / limit))
        timer.daemon = True
        timer.start()

    def __add_token_loop(self, time_delta):
        """Add token every time_delta seconds."""
        while True:
            sleep(time_delta)
            self._safe_release()

    def _safe_release(self):
        try:
            self.release()
        except ValueError:  # Ignore if already max possible value
            pass

    def __exit__(
        self,
        exc_type: Optional[type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType]
    ) -> Optional[bool]:
        pass  # Do nothing (only time-based release() is allowed)
