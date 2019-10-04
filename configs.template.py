import os
secret_key: bytes = os.urandom(16)

debug: bool = True
flask_environment: str = "development"
allow_cors: bool = True
bypass_update_restrictions: bool = True
# Timezone: https://momentjs.com/timezone/#format-dates-in-any-timezone
server_timezone: str = "America/New_York"
auto_reload_templates: bool = True

# Database settings
sql_track_modifications: bool = False
sql_connector: str = "mysqlconnector"
sql_username: str = "admin"
sql_password: str = "admin"
sql_hostname: str = "localhost:3356"
sql_database_name: str = "speedrun_global_leaderboard"
