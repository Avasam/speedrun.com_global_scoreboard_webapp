-- The biggest region code I found so far was "us/co/coloradosprings" at 21
ALTER TABLE `player`
CHANGE COLUMN `country_code` `country_code` VARCHAR(24) NULL DEFAULT NULL;
