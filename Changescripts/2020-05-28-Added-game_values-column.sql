CREATE TABLE `game_values` (
  `game_id` VARCHAR(8) NOT NULL,
  `category_id` VARCHAR(8) NOT NULL,
  `platform_id` VARCHAR(8),
  `wr_time` INT NOT NULL,
  `wr_points` INT NOT NULL,
  `mean_time` INT NOT NULL,
  `run_id` VARCHAR(8) NOT NULL,
  PRIMARY KEY (`game_id`, `category_id`));
