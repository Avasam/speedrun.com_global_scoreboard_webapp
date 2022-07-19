from __future__ import annotations

import traceback
from collections import Counter
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from json.decoder import JSONDecodeError
from math import ceil, floor
from random import randint
from sqlite3 import OperationalError
from time import sleep
from typing import TYPE_CHECKING, Any, Literal, Optional, Union, cast
from urllib.parse import parse_qs, urlparse

import configs
from models.exceptions import SpeedrunComError, UnderALotOfPressure, UnhandledThreadException, UserUpdaterError
from models.src_dto import SrcDataResultDto, SrcErrorResultDto, SrcPaginatedDataResultDto, SrcPaginationResultDto
from ratelimiter import RateLimiter
from requests import Response
from requests.exceptions import ConnectionError as RequestsConnectionError, HTTPError
from services.cached_requests import RATE_LIMIT, use_session

if TYPE_CHECKING:
    from requests.sessions import _Params

HTTP_ERROR_RETRY_DELAY_MIN = ceil(RATE_LIMIT / 60)  # 1 / (period / limit)
HTTP_ERROR_RETRY_DELAY_MAX = 15
MINIMUM_RESULTS_PER_PAGE = 20
MAXIMUM_RESULTS_PER_PAGE = 200
# We have limited concurent processes on PythonAnywhere
# https://www.pythonanywhere.com/forums/topic/12233/#id_post_46527
# "your processes number limit is 128" in server.log
# From testing on a single worker PA server: "Can't start 119th thread."
MAX_THREADS_PER_WORKER = 118
UNHANDLED_THREAD_EXCEPTION_MESSAGE = \
    "\nPlease report to: https://github.com/Avasam/Global_Speedrunning_Scoreboard/issues\n" + \
    "\nNot uploading data as some errors were caught during execution:\n"
executor = ThreadPoolExecutor(max_workers=MAX_THREADS_PER_WORKER)
rate_limiter = RateLimiter(max_calls=RATE_LIMIT, period=60)


def __handle_json_error(response: Response, json_exception: ValueError):
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
            "details": f"{json_exception.args[0]} in:\n{response}"
        }) from json_exception


def __handle_json_data(json_data: SrcErrorResultDto, response_status_code: int) -> Optional[SrcDataResultDto]:
    if "status" not in json_data:
        return json_data

    # Speedrun.com custom error
    status = json_data["status"]
    message = json_data["message"]
    if status in configs.http_retryable_errors:
        retry_delay = randint(HTTP_ERROR_RETRY_DELAY_MIN, HTTP_ERROR_RETRY_DELAY_MAX)  # nosec B311
        if status == 420:
            if "too busy" in message:
                raise UnderALotOfPressure({"error": f"{response_status_code} (speedrun.com)",
                                           "details": message})
            print(f"Rate limit value: {len(rate_limiter.calls)}/{RATE_LIMIT}")
        print(f"WARNING: {status}. {message} Retrying in {retry_delay} seconds.")
        sleep(retry_delay)
        # No break or raise as we want to retry
    else:
        raise SpeedrunComError({"error": f"{status} (speedrun.com)", "details": message})
    return None


def __get_request_cache_bust_if_disk_quota_exceeded(
    url: str,
    params: Optional[_Params],
    cached: Union[str, Literal[False]],
    headers: Optional[dict[str, Any]]
):
    try:
        response = use_session(cached).get(url, params=params, headers=headers)
    # TODO: Try to check for available space first (<=5%),
    # https://help.pythonanywhere.com/pages/DiskQuota
    # "disk I/O erro" when going over PythonAnywhere"s Disk Quota
    except (OSError, OperationalError) as error:
        error_message = str(error)
        error_type = type(error).__name__
        if isinstance(error, OSError) or error_message == "disk I/O error":
            use_session(cached).cache.clear()
            print(f"Cleared cache in response to {error_type}: {error_message}. Trying again...")
            response = use_session(cached).get(url, params=params, headers=headers)
        else:
            print(f"Ignoring cache for this request because of {error_type}: {error_message}")
            response = use_session(False).get(url, params=params, headers=headers)

    rate_limit = f"Rate limit: {len(rate_limiter.calls)}/{RATE_LIMIT}"
    if getattr(response, "from_cache", False):
        print(f"[CACHE] {rate_limit} {response.url}")
        try:
            rate_limiter.calls.pop()
        except IndexError:
            pass
    else:
        print(f"[ GET ] {rate_limit} {response.url}")
    return response


def get_file(
    url: str,
    params: Optional[_Params] = None,
    cached: Union[str, Literal[False]] = False,
    headers: Optional[dict[str, Any]] = None
) -> SrcDataResultDto:
    """
    Returns the content of "url" parsed as JSON dict.

    Parameters
    ----------
    :param url:  # The url to query
    :param headers:
    """

    while True:
        try:
            with rate_limiter:
                response = __get_request_cache_bust_if_disk_quota_exceeded(url, params, cached, headers)
        except (ConnectionError, RequestsConnectionError) as exception:  # Connexion error
            raise UserUpdaterError({
                "error": "Can't establish connexion to speedrun.com. "
                + f"Please try again ({exception.__class__.__name__})",
                "details": exception,
            }) from exception

        try:
            json_data = response.json()
        # Didn't receive a JSON file ...
        except (JSONDecodeError) as exception:
            __handle_json_error(response, exception)
        else:
            data = __handle_json_data(json_data, response.status_code)
            if data:
                return data


def params_from_url(url: str):
    if not url:
        return {}
    params: dict[str, Union[str, int]] = {k: v[0] for k, v in parse_qs(urlparse(url).query).items()}
    if not params.get("max"):
        params["max"] = MINIMUM_RESULTS_PER_PAGE
    return params


def get_paginated_response(url: str, params: dict[str, Union[str, int]], related_user_id: str):
    next_params = params
    if not next_params.get("max"):
        next_params["max"] = MINIMUM_RESULTS_PER_PAGE
    result: SrcPaginationResultDto
    summed_results: SrcPaginatedDataResultDto = {"data": []}
    results_per_page = initial_results_per_page = int(next_params["max"])

    def update_next_params(new_results_per_page: Optional[int] = None, take_next: bool = True):
        nonlocal next_params
        nonlocal results_per_page
        pagination_max = int(next_params["max"])
        if take_next:
            next_params = {} \
                if result["pagination"]["size"] < pagination_max \
                else {**next_params, "offset": result["pagination"]["offset"] + pagination_max}
        if new_results_per_page and next_params:
            results_per_page = new_results_per_page
            next_params["max"] = new_results_per_page

    while next_params:
        # Get the next page of results ...
        while True:
            try:
                result = cast(SrcPaginationResultDto, get_file(url, next_params, related_user_id))

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
            # - Otterstone_Gamer, qjn1wzw8
            # - Cmdr, 48g5vo7j
            # - SRGTsilent, v8l3eq48 --> 800-1000 fails
            # - ShesChardcore, y8dzlz9j
            except UserUpdaterError as exception:
                if exception.args[0]["error"] != "HTTPError 500" or results_per_page <= MINIMUM_RESULTS_PER_PAGE:
                    raise
                reduced_results_per_page = max(floor(results_per_page / 2.5), MINIMUM_RESULTS_PER_PAGE)
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


def start_and_wait_for_threads(fn: Callable, items: list):
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


def get_duplicates(array: list):
    counter = Counter(array)
    return [key for key in counter if counter[key] > 1]


def has_duplicates(array: list):
    counter = Counter(array)
    for key in counter:
        if counter[key] > 1:
            return True
    return False
