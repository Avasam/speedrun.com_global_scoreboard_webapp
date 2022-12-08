from __future__ import annotations

import sys
from datetime import timedelta
from typing import Literal, cast

import configs
from requests import Session
from requests.adapters import HTTPAdapter
from requests_cache.session import CachedSession

RATE_LIMIT = 99


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
        # Redis specific parameters
        connection=__REDIS,
        # SQLite specific parameters
        fast_save=True,
        wal=True,
        use_temp=True,
    )
    session.mount("https://", __adapter)
    return session


def use_session(user_id: str | Literal[False] = "http_cache"):
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


__REDIS = None
if sys.platform != "win32" and configs.cached_session_backend == "redis":
    import redislite  # pyright: ignore # pylint: disable=import-error
    __REDIS = redislite.Redis(
        dbfilename="/tmp/redis-requests-cache.db",  # nosec B108
        # Ignore failures to persist rather than crashing on Prod. Data is non-critical.
        serverconfig={"stop-writes-on-bgsave-error": "yes" if configs.debug else "no"},
    )


__adapter = HTTPAdapter(pool_maxsize=RATE_LIMIT - 1)
__cached_sessions: dict[str, CachedSession] = {}
__uncached_session = Session()
__uncached_session.mount("https://", __adapter)
clean_old_cache()
