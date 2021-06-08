ALTER TABLE `schedule`
ADD COLUMN `deadline` DATETIME NULL AFTER `is_active`;
