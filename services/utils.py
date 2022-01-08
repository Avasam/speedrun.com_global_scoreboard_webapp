from types import TracebackType
from typing import Any, Literal, Optional, Union

from concurrent.futures import ThreadPoolExecutor
from contextlib import nullcontext
from datetime import timedelta
from json.decoder import JSONDecodeError
from math import ceil, floor, sqrt
from multiprocessing import BoundedSemaphore  # , synchronize
from os import unlink
from os.path import isdir
from random import randint
from sqlite3 import DatabaseError, OperationalError
from tempfile import gettempdir
from threading import BoundedSemaphore as ThreadingBoundedSemaphore, Semaphore, Timer, Thread
from time import sleep
from urllib.parse import parse_qs, urlparse
import traceback

from requests.exceptions import ConnectionError as RequestsConnectionError, HTTPError
from requests_cache.session import CachedSession
from simplejson.errors import JSONDecodeError as SimpleJSONDecodeError

import configs

RATE_LIMIT = 200
HTTP_ERROR_RETRY_DELAY_MIN = ceil(RATE_LIMIT / 60)  # 1 / (period / limit)
HTTP_ERROR_RETRY_DELAY_MAX = 15
MINIMUM_RESULTS_PER_PAGE = 20
MAXIMUM_RESULTS_PER_PAGE = 200
# We have limited concurent processes on PythonAnywhere
# https://www.pythonanywhere.com/forums/topic/12233/#id_post_46527
# "your processes number limit is 128" in server.log
# From testing on a single worker PA server: "Can't start 122th thread."
MAX_THREADS_PER_WORKER = 121
UNHANDLED_THREAD_EXCEPTION_MESSAGE = \
    "\nPlease report to: https://github.com/Avasam/Global_Speedrunning_Scoreboard/issues\n" + \
    "\nNot uploading data as some errors were caught during execution:\n"
executor = ThreadPoolExecutor(max_workers=MAX_THREADS_PER_WORKER)


class UserUpdaterError(Exception):
    """ Usage: raise UserUpdaterError({"error":"On Status Label", "details":"Details of error"}) """

    args: tuple[dict[Literal["error", "details"], str], ...]


class SpeedrunComError(UserUpdaterError):
    """ Usage: raise NotFoundError({"error":"`HTTP_STATUS_CODE` (speedrun.com)", "details":"Details of error"}) """


class UnderALotOfPressure(SpeedrunComError):
    """ Usage: raise NotFoundError({"error":"`HTTP_STATUS_CODE` (speedrun.com)", "details":"Details of error"}) """


class UnhandledThreadException(Exception):
    pass


class RatedSemaphore(ThreadingBoundedSemaphore):  # synchronize.BoundedSemaphore
    """Limit to 1 request per `period / limit` seconds (over long run)."""

    def __init__(self, limit=1, period=1):
        # super().__init__(limit)
        self.__semaphore = BoundedSemaphore(limit - 1)
        self.get_value = self.__semaphore.get_value
        timer = Timer(period, self._add_token_loop, kwargs=dict(time_delta=float(period) / limit))
        timer.daemon = True
        timer.start()

    def _add_token_loop(self, time_delta):
        """Add token every time_delta seconds."""
        while True:
            self._safe_release()
            sleep(time_delta)

    def _safe_release(self):
        try:
            self.__semaphore.release()
        except ValueError:  # Ignore if already max possible value
            pass

    def release(
        self: Semaphore,
        n: int = 1
    ) -> Optional[bool]:
        pass  # Do nothing (only time-based release() is allowed)

    def __exit__(
        self: Semaphore,
        exc_type: Optional[type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType]
    ) -> Optional[bool]:
        pass  # Do nothing (only time-based release() is allowed)

    def acquire(self, blocking: bool = True, timeout: Optional[float] = None):
        return self.__semaphore.acquire(blocking, timeout)

    __enter__ = acquire  # type: ignore


def clear_cache_for_user_async(user_id: str):
    def clear_cache_thread():
        try:
            print(f"Deleting cache specific to user '{user_id}'...")
            session.cache.delete_urls([url for url in session.cache.urls if user_id in url])
            print("Removing expired responses...")
            session.cache.remove_expired_responses()
            print("Done")
        except Exception:
            print(f"Something went wrong while deleting cache for '{user_id}'")
            raise
    Thread(target=clear_cache_thread).start()


def clean_old_cache():
    __cache_count = session.cache.response_count()
    print(f"   {__cache_count} cached responses.")
    if (__cache_count == 0 or configs.skip_cache_cleanup):
        print("   Skipping expired cache removal.")
    else:
        print("   Removing expired responses...")
        session.cache.remove_expired_responses()
        print("   Done")


session = CachedSession(
    expire_after=timedelta(days=1),
    allowable_codes=(200, 500),
    ignored_parameters=["status", "video-only", "embed"],
    backend=configs.cached_session_backend,
    fast_save=True,
    use_temp=True)
clean_old_cache()
rate_limit = RatedSemaphore(RATE_LIMIT, 60)  # 200 requests per minute


def get_file(
    url: str,
    params: Optional[dict[str, str]] = None,
    cached=False,
    headers: dict[str, Any] = None
) -> dict:
    """
    Returns the content of "url" parsed as JSON dict.

    Parameters
    ----------
    :param url:  # The url to query
    :param headers:
    """
    def get_request_cache_bust_if_disk_quota_exceeded():
        with nullcontext() if cached else session.cache_disabled():
            try:
                response = session.get(url, params=params, headers=headers)
            # "disk I/O erro" when going over PythonAnywhere"s Disk Quota
            except (DatabaseError, OperationalError, OSError):
                # TODO: Try to check for available space first (<=5%),
                # https://help.pythonanywhere.com/pages/DiskQuota
                for dir in [gettempdir(), "~/.cache"]:
                    if isdir(dir):
                        unlink(dir)
                session.cache.clear()
                response = session.get(url, params=params, headers=headers)

        if response.from_cache:
            print(f"[CACHE] {response.url}")
            rate_limit._safe_release()
        else:
            print(f"[ GET ] {response.url}")
        return response

    while True:
        try:
            with rate_limit:
                response = get_request_cache_bust_if_disk_quota_exceeded()
        except (ConnectionResetError, ConnectionError, RequestsConnectionError) as exception:  # Connexion error
            raise UserUpdaterError({
                "error": "Can't establish connexion to speedrun.com. "
                + f"Please try again ({exception.__class__.__name__})",
                "details": exception,
            }) from exception

        try:
            json_data = response.json()
        # Didn't receive a JSON file ...
        # Hack: casting as any due to missing type definition
        except (JSONDecodeError, SimpleJSONDecodeError) as exception:
            try:
                response.raise_for_status()
            except HTTPError as exception:  # ... because it's an HTTP error
                if response.status_code in configs.http_retryable_errors:
                    print(f"WARNING: {exception.args[0]}. Retrying in {HTTP_ERROR_RETRY_DELAY_MIN} seconds.")
                    sleep(HTTP_ERROR_RETRY_DELAY_MIN)
                    # No break or raise as we want to retry
                elif response.status_code == 503:
                    raise UnderALotOfPressure({
                        "error": f"{response.status_code} (speedrun.com)",
                        "details": exception.args[0]
                    }) from exception
                else:
                    raise UserUpdaterError({
                        "error": f"HTTPError {response.status_code}",
                        "details": exception.args[0]
                    }) from exception
            else:  # ... we don't know why (elevate the exception)
                print(f"ERROR/WARNING: response=({type(response)})'{response}'\n")
                raise UserUpdaterError({
                    "error": "JSONDecodeError",
                    "details": f"{exception.args[0]} in:\n{response}"
                }) from exception

        else:
            if "status" in json_data:  # Speedrun.com custom error
                status = json_data["status"]
                message = json_data["message"]
                if status in configs.http_retryable_errors:
                    retry_delay = randint(HTTP_ERROR_RETRY_DELAY_MIN, HTTP_ERROR_RETRY_DELAY_MAX)  # nosec
                    if status == 420:
                        if "too busy" in message:
                            raise UnderALotOfPressure({"error": f"{response.status_code} (speedrun.com)",
                                                       "details": message})
                        print(f"Rate limit value: {rate_limit.get_value()}/{RATE_LIMIT}")
                    print(f"WARNING: {status}. {message} Retrying in {retry_delay} seconds.")
                    sleep(retry_delay)
                    # No break or raise as we want to retry
                else:
                    raise SpeedrunComError({"error": f"{status} (speedrun.com)", "details": message})

            else:
                return json_data


def params_from_url(url: str):
    if not url:
        return {}
    params = {k: v[0] for k, v in parse_qs(urlparse(url).query).items()}
    if not params.get("max"):
        params["max"] = str(MINIMUM_RESULTS_PER_PAGE)
    return params


SpeedruncomResponsePagination = dict[
    str,
    dict[
        Literal["links"],
        list[
            dict[
                Literal["uri", "rel"],
                str
            ]
        ]
    ]
]
SpeedruncomResponseData = dict[Literal["data"], list[Any]]


def get_paginated_response(url: str, params: dict[str, str]) -> dict:
    next_params = params
    if not next_params.get("max"):
        next_params["max"] = str(MINIMUM_RESULTS_PER_PAGE)
    result: SpeedruncomResponsePagination
    summed_results: SpeedruncomResponseData = {"data": []}
    results_per_page = initial_results_per_page = int(next_params["max"])

    def update_next_params(new_results_per_page: Optional[int] = None, take_next: bool = True):
        nonlocal next_params
        nonlocal results_per_page
        if take_next:
            next_params = params_from_url(next(
                (link["uri"] for link in result["pagination"]["links"] if link["rel"] == "next"),
                ""))
        if new_results_per_page and next_params:
            results_per_page = new_results_per_page
            next_params["max"] = str(new_results_per_page)

    while next_params:
        # Get the next page of results ...
        while True:
            try:
                result = get_file(url, next_params, True)
                # If it succeeds, slowly raise back up the page size
                if results_per_page < initial_results_per_page:
                    increased_results_per_page = min(initial_results_per_page, ceil(results_per_page * 1.5))
                    print("Reduced request successfull. Increasing the max results per page "
                          + f"from {results_per_page} back to {increased_results_per_page}")
                    update_next_params(increased_results_per_page)
                else:
                    update_next_params()
                break
            # If it failed, try again with a smaller page.
            # The usual suspects:
            # - Otterstone_Gamer, qjn1wzw8 --> /6 (2700-2733) still fails
            # - Cmdr, 48g5vo7j
            # - SRGTsilent, v8l3eq48
            # - HowDenKing, 68wk0748 --> 0-200 fails
            # - Sizzyl, 18qvw9ox
            # - Raid104, 18vw1rvj
            # - ShesChardcore, y8dzlz9j
            except UserUpdaterError as exception:
                if exception.args[0]["error"] != "HTTPError 500" or results_per_page <= MINIMUM_RESULTS_PER_PAGE:
                    raise
                reduced_results_per_page = max(floor(results_per_page / sqrt(7)), MINIMUM_RESULTS_PER_PAGE)
                print("SR.C returned 500 for a paginated request. Reducing the max results per page "
                      + f"from {results_per_page} to {reduced_results_per_page}")
                update_next_params(reduced_results_per_page, False)

        # ... and combine it with previous ones
        summed_results["data"] += result["data"]

    return summed_results


def parse_str_to_bool(string_to_parse: Optional[str]) -> bool:
    return string_to_parse is not None and string_to_parse.lower() == "true"


def parse_str_to_nullable_bool(string_to_parse: Optional[str]) -> Optional[bool]:
    return None if string_to_parse is None else string_to_parse.lower() == "true"


def map_to_dto(dto_mappable_object_list) -> list[dict[str, Union[str, bool, int]]]:
    return [dto_mappable_object.to_dto() for dto_mappable_object in dto_mappable_object_list]


def start_and_wait_for_threads(fn, items: list):
    futures = []
    for item in items:
        while True:
            try:
                futures.append(executor.submit(fn, item))
                break
            except RuntimeError as exception:
                print(exception)
                if "can't start new thread" not in str(exception):
                    raise
                print(
                    f"RuntimeError: Can't start {len(executor._threads) + 1}th thread. "
                    + f"Waiting {HTTP_ERROR_RETRY_DELAY_MAX}s before trying again. "
                    + "Consider reducing MAX_THREADS_PER_WORKER")
                sleep(HTTP_ERROR_RETRY_DELAY_MAX)
    try:
        for future in futures:
            future.result()
    except UnderALotOfPressure:
        raise
    except UserUpdaterError as exception:
        raise UnhandledThreadException(
            exception.args[0]["error"]
            + UNHANDLED_THREAD_EXCEPTION_MESSAGE
            + str(exception.args[0]["details"])
        ) from exception
    except Exception as exception:
        raise UnhandledThreadException(
            "Unhandled exception in thread"
            + UNHANDLED_THREAD_EXCEPTION_MESSAGE
            + traceback.format_exc()
        ) from exception
