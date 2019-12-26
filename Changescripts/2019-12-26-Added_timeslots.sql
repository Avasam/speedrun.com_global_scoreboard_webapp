CREATE TABLE `speedrun_global_leaderboard`.`timeslot` (
  `timeslot_id` INT NOT NULL AUTO_INCREMENT,
  `schedule_id` INT NOT NULL,
  PRIMARY KEY (`timeslot_id`),
  INDEX `schedule_id_fk_idx` (`schedule_id` ASC),
  UNIQUE INDEX `timeslot_id_UNIQUE` (`timeslot_id` ASC),
  CONSTRAINT `schedule_id_fk`
    FOREIGN KEY (`schedule_id`)
    REFERENCES `speedrun_global_leaderboard`.`schedule` (`schedule_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
DEFAULT CHARACTER SET = utf8;
