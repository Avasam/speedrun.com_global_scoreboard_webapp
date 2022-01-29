ALTER TABLE `friend`
DROP FOREIGN KEY `friend_ibfk_1`,
DROP FOREIGN KEY `friend_ibfk_2`;
ALTER TABLE `friend`
ADD CONSTRAINT `friend_ibfk_1`
  FOREIGN KEY (`user_id`)
  REFERENCES `player` (`user_id`)
  ON DELETE CASCADE,
ADD CONSTRAINT `friend_ibfk_2`
  FOREIGN KEY (`friend_id`)
  REFERENCES `player` (`user_id`)
  ON DELETE CASCADE;
