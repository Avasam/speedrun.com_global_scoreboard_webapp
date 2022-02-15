from typing import Literal, Union, cast

from datetime import timedelta
from requests import Session
from requests.adapters import HTTPAdapter
from requests_cache import CachedSession

import configs


RATE_LIMIT = 100


def clean_old_cache():
    session = use_session()
    __cache_count = session.cache.response_count()
    print(f"   Cache location: {getattr(session.cache, 'db_path', 'unknown')}")
    print(f"   {__cache_count} cached responses.")
    if (__cache_count == 0 or configs.skip_cache_cleanup):
        print("   Skipping expired cache removal.")
    else:
        print("   Removing expired responses...")
        session.cache.remove_expired_responses()
        print("   Done")


def clear_cache_for_user(user_id: str):
    try:
        print(f"Deleting cache specific to user '{user_id}'...")
        use_session(user_id).cache.clear()
        print("Done")
    except BaseException:
        print(f"Something went wrong while deleting cache for '{user_id}'")
        raise
    try:
        print("Removing expired responses...")
        use_session().cache.remove_expired_responses()
        print("Done")
    except BaseException:
        print(f"Something went wrong while removing expired responses after '{user_id}'")
        raise


def __make_cache_session(user_id: str = "http_cache"):
    session = CachedSession(
        cache_name=user_id,
        expire_after=timedelta(days=1),
        allowable_codes=(200, 500),
        ignored_parameters=["status", "video-only", "embed"],
        backend=configs.cached_session_backend,
        fast_save=True,
        use_temp=True)
    session.mount("https://", __adapter)
    return session


def use_session(user_id: Union[str, Literal[False]] = "http_cache"):
    """
    @param user_id: User specific cache. Omit or "http_cache" for global. False for uncached.
    """
    if not user_id:
        return cast(CachedSession, __uncached_session)
    existing_session = __cached_sessions.get(user_id, None)
    if existing_session is None:
        existing_session = __make_cache_session(user_id)
        __cached_sessions[user_id] = existing_session
    return existing_session


__adapter = HTTPAdapter(pool_maxsize=RATE_LIMIT - 1)
__cached_sessions: dict[str, CachedSession] = {}
__uncached_session = Session()
__uncached_session.mount("https://", __adapter)
clean_old_cache()
