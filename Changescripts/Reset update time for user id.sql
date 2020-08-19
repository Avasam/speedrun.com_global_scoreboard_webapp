UPDATE player
SET last_update = subdate(current_date, 7)
WHERE last_update > subdate(current_date, 7)
AND user_id = '';
