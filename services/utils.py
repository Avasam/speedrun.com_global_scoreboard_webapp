from random import randint
from requests import Session
from typing import Dict, Any
from time import sleep
from typing import Optional
import json
import simplejson
import requests

HTTP_RETRYABLE_ERRORS = [401, 420, 502]
HTTP_ERROR_RETRY_DELAY_MIN = 5
HTTP_ERROR_RETRY_DELAY_MAX = 15


class UserUpdaterError(Exception):
    """ Usage: raise UserUpdaterError({"error":"On Status Label", "details":"Details of error"}) """
    pass


class SpeedrunComError(UserUpdaterError):
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
    print(p_url)  # debug_str
    while True:
        try:
            raw_data = session.get(p_url, headers=p_headers)
        except requests.exceptions.ConnectionError as exception:  # Connexion error
            raise UserUpdaterError({"error": "Can't establish connexion to speedrun.com", "details": exception})

        try:
            json_data = raw_data.json()
        # Didn't receive a JSON file ...
        except (json.decoder.JSONDecodeError, simplejson.scanner.JSONDecodeError) as exception:
            try:
                raw_data.raise_for_status()
            except requests.exceptions.HTTPError as exception:  # ... because it's an HTTP error
                if raw_data.status_code in HTTP_RETRYABLE_ERRORS:
                    # debug_str
                    print(f"WARNING: {exception.args[0]}. Retrying in {HTTP_ERROR_RETRY_DELAY_MIN} seconds.")
                    sleep(HTTP_ERROR_RETRY_DELAY_MIN)
                    # No break or raise as we want to retry
                else:
                    raise UserUpdaterError({"error": f"HTTPError {raw_data.status_code}",
                                            "details": exception.args[0]})
            else:  # ... we don't know why (elevate the exception)
                print(f"ERROR/WARNING: raw_data=({type(raw_data)})\'{raw_data}\'\n")  # debug_str
                raise UserUpdaterError(
                    {"error": "JSONDecodeError", "details": f"{exception.args[0]} in:\n{raw_data}"})

        else:
            if "status" in json_data:  # Speedrun.com custom error
                if json_data["status"] in HTTP_RETRYABLE_ERRORS:
                    retry_delay = randint(HTTP_ERROR_RETRY_DELAY_MIN, HTTP_ERROR_RETRY_DELAY_MAX)
                    print("WARNING: {status}. {message}. Retrying in {delay} seconds.".format(
                        status=json_data["status"],
                        message=json_data["message"],
                        delay=retry_delay))  # debug_str
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
