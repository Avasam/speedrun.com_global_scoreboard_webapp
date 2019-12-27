CREATE TABLE `speedrun_global_leaderboard`.`time_slot` (
  `time_slot_id` INT NOT NULL AUTO_INCREMENT,
  `schedule_id` INT NOT NULL,
  `date_time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `maximum_entries` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`time_slot_id`),
  INDEX `schedule_id_fk_idx` (`schedule_id` ASC),
  UNIQUE INDEX `time_slot_id_UNIQUE` (`time_slot_id` ASC),
  CONSTRAINT `schedule_id_fk`
    FOREIGN KEY (`schedule_id`)
    REFERENCES `speedrun_global_leaderboard`.`schedule` (`schedule_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
DEFAULT CHARACTER SET = utf8;
