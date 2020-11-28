from typing import List
# import os
# IMPORTANT : DO NOT DO THIS IN PROD /!\
# We're only doing it here because it's annoying to invalidate JWT tokens on refresh during development
secret_key: bytes = bytes([1])  # os.urandom(16)

# Flask settings
debug: bool = True
flask_environment: str = "development"
allow_cors: bool = True
auto_reload_templates: bool = True

# Custom settings
bypass_update_restrictions: bool = True
last_updated_days: List[int] = [7, 30, 91]
# Timezone: https://momentjs.com/timezone/#format-dates-in-any-timezone
server_timezone: str = "America/New_York"

# Database settings
sql_track_modifications: bool = False
sql_connector: str = "mysqlconnector"
sql_username: str = "admin"
sql_password: str = "admin"
sql_hostname: str = "localhost:3356"
sql_database_name: str = "speedrun_global_scoreboard"
