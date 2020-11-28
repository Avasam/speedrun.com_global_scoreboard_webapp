from random import randint
from requests import Session
from threading import Thread, active_count
from time import sleep
from typing import Any, cast, Dict, List, Optional, Union
import json
import requests
import simplejson

HTTP_RETRYABLE_ERRORS = [401, 420, 502]
HTTP_ERROR_RETRY_DELAY_MIN = 5
HTTP_ERROR_RETRY_DELAY_MAX = 15


class UserUpdaterError(Exception):
    """ Usage: raise UserUpdaterError({"error":"On Status Label", "details":"Details of error"}) """
    pass


class SpeedrunComError(UserUpdaterError):
    """ Usage: raise NotFoundError({"error":"404 Not Found", "details":"Details of error"}) """
    pass


class UnderALotOfPressure(SpeedrunComError):
    """ Usage: raise NotFoundError({"error":"404 Not Found", "details":"Details of error"}) """
    pass


session: Session = Session()


def get_file(p_url: str, p_headers: Dict[str, Any] = None) -> dict:
    """
    Returns the content of "url" parsed as JSON dict.

    Parameters
    ----------
    :param p_url:  # The url to query
    :param p_headers:
    """
    print(p_url)
    while True:
        try:
            raw_data = session.get(p_url, headers=p_headers)
        except (ConnectionResetError, requests.exceptions.ConnectionError) as exception:  # Connexion error
            raise UserUpdaterError({
                "error": "Can't establish connexion to speedrun.com. "
                f"Please try again ({exception.__class__.__name__})",
                "details": exception,
            })

        try:
            json_data = raw_data.json()
        # Didn't receive a JSON file ...
        # Hack: casting as any due to missing type definition
        except (json.decoder.JSONDecodeError, cast(Any, simplejson).scanner.JSONDecodeError) as exception:
            try:
                raw_data.raise_for_status()
            except requests.exceptions.HTTPError as exception:  # ... because it's an HTTP error
                if raw_data.status_code in HTTP_RETRYABLE_ERRORS:
                    print(f"WARNING: {exception.args[0]}. Retrying in {HTTP_ERROR_RETRY_DELAY_MIN} seconds.")
                    sleep(HTTP_ERROR_RETRY_DELAY_MIN)
                    # No break or raise as we want to retry
                elif raw_data.status_code == 503:
                    raise UnderALotOfPressure({"error": f"HTTPError {raw_data.status_code}",
                                               "details": exception.args[0]})
                else:
                    raise UserUpdaterError({"error": f"HTTPError {raw_data.status_code}",
                                            "details": exception.args[0]})
            else:  # ... we don't know why (elevate the exception)
                print(f"ERROR/WARNING: raw_data=({type(raw_data)})\'{raw_data}\'\n")
                raise UserUpdaterError(
                    {"error": "JSONDecodeError", "details": f"{exception.args[0]} in:\n{raw_data}"})

        else:
            if "status" in json_data:  # Speedrun.com custom error
                if json_data["status"] in HTTP_RETRYABLE_ERRORS:
                    retry_delay = randint(HTTP_ERROR_RETRY_DELAY_MIN, HTTP_ERROR_RETRY_DELAY_MAX)
                    print("WARNING: {status}. {message}. Retrying in {delay} seconds.".format(
                        status=json_data["status"],
                        message=json_data["message"],
                        delay=retry_delay))
                    sleep(retry_delay)
                    # No break or raise as we want to retry
                else:
                    raise SpeedrunComError(
                        {"error": f"{json_data['status']} (speedrun.com)", "details": json_data["message"]})

            else:  # No error
                return json_data


def parse_str_to_bool(string_to_parse: Optional[str]) -> bool:
    return string_to_parse is not None and string_to_parse.lower() == 'true'


def parse_str_to_nullable_bool(string_to_parse: Optional[str]) -> Optional[bool]:
    return None if string_to_parse is None else string_to_parse.lower() == 'true'


def start_and_wait_for_threads(threads: List[Thread]):
    for t in threads:
        while True:
            try:
                if active_count() <= 8:
                    t.start()
                    break
            except RuntimeError:
                print(
                    f"RuntimeError: Can't start {active_count()+1}th thread. "
                    f"Trying to wait just a bit as I don't have a better way to deal w/ it atm.")
                sleep(0.5)
    for t in threads:
        t.join()


def map_to_dto(dto_mappable_object_list) -> List[Dict[str, Union[str, bool, int]]]:
    return [dto_mappable_object.to_dto() for dto_mappable_object in dto_mappable_object_list]
