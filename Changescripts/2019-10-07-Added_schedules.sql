CREATE TABLE `schedule` (
  `schedule_id` INT NOT NULL AUTO_INCREMENT,
  `name` NVARCHAR(128) NOT NULL DEFAULT '',
  `owner_id` VARCHAR(8) NOT NULL,
  `registration_key` VARCHAR(36) NOT NULL,
  `is_active` BIT NOT NULL DEFAULT 1,
  PRIMARY KEY (`schedule_id`),
  INDEX `owner_id_fk_idx` (`owner_id` ASC),
  UNIQUE INDEX `schedule_id_UNIQUE` (`schedule_id` ASC),
  CONSTRAINT `owner_id_fk`
    FOREIGN KEY (`owner_id`)
    REFERENCES `player` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
DEFAULT CHARACTER SET = utf8;
