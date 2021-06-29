ALTER TABLE `schedule`
DROP FOREIGN KEY `owner_id_fk`;
ALTER TABLE `schedule`
ADD CONSTRAINT `schedule_owner_id_fk`
  FOREIGN KEY (`owner_id`)
  REFERENCES `player` (`user_id`);

CREATE TABLE `schedule_group` (
  `group_id` INT NOT NULL AUTO_INCREMENT,
  `name` NVARCHAR(128) NOT NULL DEFAULT '',
  `owner_id` VARCHAR(8) NOT NULL,
  `order` INT NOT NULL DEFAULT -1,
  PRIMARY KEY (`group_id`),
  INDEX `owner_id_fk_idx` (`owner_id` ASC),
  UNIQUE INDEX `group_id_UNIQUE` (`group_id` ASC),
  CONSTRAINT `schedule_group_owner_id_fk`
    FOREIGN KEY (`owner_id`)
    REFERENCES `player` (`user_id`));
DEFAULT CHARACTER SET = utf8;

ALTER TABLE `schedule`
ADD COLUMN `group_id` INT NULL AFTER `deadline`,
ADD COLUMN `order` INT NOT NULL AFTER `group_id`,
ADD INDEX `schedule_group_id_fk_idx` (`group_id` ASC);

ALTER TABLE `schedule`
ADD CONSTRAINT `schedule_group_id_fk`
  FOREIGN KEY (`group_id`)
  REFERENCES `schedule_group` (`group_id`)
  ON DELETE SET NULL;
