from requests_cache.backends import BackendSpecifier

# import os
# IMPORTANT : DO NOT DO THIS IN PROD /!\
# We're only doing it here because it's annoying to invalidate JWT tokens on refresh during development
secret_key: bytes = bytes([1])  # os.urandom(24)

# Flask settings
debug: bool = True
flask_environment: str = "development"
auto_reload_templates: bool = True
# https://requests-cache.readthedocs.io/en/stable/user_guide/backends.html
# Supported: sqlite (default), memory, filesystem, redis
# Unsupported: mongodb, gridfs, dynamodb
cached_session_backend: BackendSpecifier = "sqlite"

# Custom settings
bypass_update_restrictions: bool = True
last_updated_days: list[int] = [7, 30, 91]
skip_cache_cleanup: bool = False
http_retryable_errors: list[int] = [401, 420, 502, 504]

# Database settings
sql_track_modifications: bool = False
sql_connector: str = "mysqlconnector"
sql_username: str = "admin"
sql_password: str = "admin"
sql_hostname: str = "localhost:3306"
sql_database_name: str = "speedrun_global_scoreboard"
