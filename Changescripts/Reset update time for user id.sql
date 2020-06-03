UPDATE player
SET last_update = DATEADD(dd, -6, CURRENT_TIMESTAMP)
WHERE user_id = '';
