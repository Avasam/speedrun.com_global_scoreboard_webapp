CREATE TABLE `cached_request` (
  `url` VARCHAR(255) NOT NULL, -- Max for mysql 5.6
  `timestamp` DATETIME NOT NULL,
  `result` LONGTEXT NOT NULL,
  PRIMARY KEY (`url`));
