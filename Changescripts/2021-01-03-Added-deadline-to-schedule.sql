ALTER TABLE `schedule` 
ADD COLUMN `deadline` DATETIME NOT NULL AFTER `is_active`;
