from collections import Counter
from datetime import datetime
from math import floor
from models.core_models import db, Player
from models.global_scoreboard_models import User
from time import strftime
from typing import Dict, List, Union
from services.utils import UserUpdaterError, SpeedrunComError
import configs
import httplib2
import requests

SEPARATOR = "-" * 64


def get_updated_user(p_user_id: str) -> Dict[str, Union[str, None, float, int]]:
    """Called from flask_app and AutoUpdateUsers.run()"""
    global threads_exceptions
    threads_exceptions = []
    text_output: str = p_user_id
    result_state: str = "info"

    try:
        user = User(p_user_id)
        print(f"{SEPARATOR}\n{user._name}")  # debug_str

        try:
            user.set_code_and_name()
        except SpeedrunComError:
            # ID doesn't exists on speedrun.com but it does in the database, remove it
            player = Player.get(user._name)
            if player:
                text_output = (f"User ID \"{user._id}\" not found on speedrun.com. "
                               "\nRemoved it from the database.")
                result_state = "warning"
                db.session.delete(player)
                db.session.commit()
            else:
                text_output = (f"User \"{user._id}\" not found. "
                               "\nMake sure the name or ID is typed properly. "
                               "It's possible the user you're looking for changed their name. "
                               "In case of doubt, use their ID.")
                result_state = "warning"
        else:
            # Setup a few checks
            player = Player.get(user._id)

            # If user doesn't exists or enough time passed since last update
            if not player or \
                not player.last_update or \
                (datetime.now() - player.last_update).days >= configs.last_updated_days[0] or \
                    configs.bypass_update_restrictions:

                user.set_points(threads_exceptions)
                if not threads_exceptions:

                    print(f"\nLooking for {user._id}")  # debug_str
                    timestamp = strftime("%Y-%m-%d %H:%M")

                    # If user already exists, update the database entry
                    if player:
                        text_output = f"{user} found. Updated their entry."
                        result_state = "success"
                        Player \
                            .query \
                            .filter(Player.user_id == user._id) \
                            .update({"user_id": user._id,
                                     "name": user._name,
                                     "country_code": user._country_code,
                                     "score": floor(user._points),
                                     "score_details": user._point_distribution_str,
                                     "last_update": timestamp})
                        db.session.commit()

                    # If user not found and has points, add it to the database
                    elif user._points >= 1:
                        text_output = "{} not found. Added a new row.".format(user)
                        result_state = "success"
                        Player.create(user._id,
                                      user._name,
                                      country_code=user._country_code,
                                      score=user._points,
                                      score_details=user._point_distribution_str,
                                      last_update=timestamp)
                    else:
                        text_output = f"Not inserting new data as {user} " \
                                      f"{'is banned' if user._banned else 'has a score lower than 1.'}."
                        result_state = "warning"
                    text_output += user._point_distribution_str

                else:
                    error_str_list: List[str] = []
                    for e in threads_exceptions:
                        error_str_list.append("Error: {}\n{}".format(e["error"], e["details"]))
                    error_str_counter = Counter(error_str_list)
                    errors_str = "{0}" \
                                 "\nhttps://github.com/Avasam/Global_Speedrunning_Scoreboard/issues" \
                                 "\nNot uploading data as some errors were caught during execution:" \
                                 "\n{0}\n".format(SEPARATOR)
                    for error, count in error_str_counter.items():
                        errors_str += f"[x{count}] {error}\n"
                    text_output += ("\n" if text_output else "") + errors_str
                    result_state = "danger"
            else:
                cant_update_time = configs.last_updated_days[0]
                text_output = f"This user has already been updated in the past {cant_update_time} day" \
                    "s" if cant_update_time != 1 else ""
                result_state = "warning"

        return {'state': result_state,
                'rank': None,
                'name': user._name,
                'countryCode': user._country_code,
                'score': floor(user._points),
                'lastUpdate': strftime("%Y-%m-%d %H:%M"),
                'userId': user._id,
                'message': text_output}

    except httplib2.ServerNotFoundError as exception:
        raise UserUpdaterError({"error": "Server not found",
                                "details": f"{exception}\nPlease make sure you have an active internet connection"})
    except (requests.exceptions.ChunkedEncodingError, ConnectionAbortedError) as exception:
        raise UserUpdaterError({"error": "Connexion interrupted", "details": exception})
