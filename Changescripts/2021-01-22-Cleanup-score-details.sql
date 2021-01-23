UPDATE player
SET score_details = SUBSTR(score_details,2)
WHERE score_details LIKE '\n%';

UPDATE player
SET score_details = NULL
WHERE score_details LIKE 'G%';
