CREATE TABLE `cached_request` (
  `url` VARCHAR(767) NOT NULL,
  `timestamp` DATETIME NOT NULL,
  `result` LONGTEXT NOT NULL,
  PRIMARY KEY (`url`));
