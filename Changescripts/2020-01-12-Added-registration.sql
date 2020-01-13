CREATE TABLE `registration` (
  `registration_id` INT NULL AUTO_INCREMENT,
  `time_slot_id` INT NULL,
  PRIMARY KEY (`registration_id`),
  INDEX `time_slot_id_fk_idx` (`time_slot_id` ASC),
  CONSTRAINT `time_slot_id_fk`
    FOREIGN KEY (`time_slot_id`)
    REFERENCES `time_slot` (`time_slot_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

CREATE TABLE `participant` (
  `registration_id` INT NOT NULL,
  `name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`registration_id`, `name`),
  CONSTRAINT `registration_id_fk`
    FOREIGN KEY (`registration_id`)
    REFERENCES `registration` (`registration_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);
