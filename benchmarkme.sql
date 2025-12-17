-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               10.4.32-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for benchmarkme
CREATE DATABASE IF NOT EXISTS `benchmarkme` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `benchmarkme`;

-- Dumping structure for table benchmarkme.aim_results
CREATE TABLE IF NOT EXISTS `aim_results` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `total_targets` int(11) NOT NULL,
  `targets_hit` int(11) NOT NULL,
  `targets_missed` int(11) DEFAULT 0,
  `average_time_ms` int(11) NOT NULL,
  `best_time_ms` int(11) DEFAULT NULL,
  `worst_time_ms` int(11) DEFAULT NULL,
  `accuracy_percent` decimal(5,2) DEFAULT NULL,
  `total_time_ms` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_aim` (`user_id`),
  KEY `idx_aim_avg_time` (`average_time_ms`),
  CONSTRAINT `aim_results_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table benchmarkme.aim_results: ~0 rows (approximately)

-- Dumping structure for table benchmarkme.memory_results
CREATE TABLE IF NOT EXISTS `memory_results` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `level_reached` int(11) NOT NULL,
  `total_correct` int(11) NOT NULL,
  `total_mistakes` int(11) DEFAULT 0,
  `grid_size` int(11) NOT NULL,
  `tiles_to_remember` int(11) NOT NULL,
  `accuracy_percent` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_memory` (`user_id`),
  KEY `idx_memory_level` (`level_reached`),
  CONSTRAINT `memory_results_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table benchmarkme.memory_results: ~0 rows (approximately)

-- Dumping structure for table benchmarkme.number_memory_results
CREATE TABLE IF NOT EXISTS `number_memory_results` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `level_reached` int(11) NOT NULL,
  `digits_remembered` int(11) NOT NULL,
  `correct_answers` int(11) NOT NULL,
  `wrong_number` varchar(50) DEFAULT NULL,
  `correct_number` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_number` (`user_id`),
  KEY `idx_number_level` (`level_reached`),
  CONSTRAINT `number_memory_results_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table benchmarkme.number_memory_results: ~0 rows (approximately)

-- Dumping structure for table benchmarkme.reaction_results
CREATE TABLE IF NOT EXISTS `reaction_results` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `reaction_time_ms` int(11) NOT NULL,
  `attempt_number` int(11) DEFAULT 1,
  `is_best` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_reaction` (`user_id`),
  KEY `idx_reaction_time` (`reaction_time_ms`),
  CONSTRAINT `reaction_results_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table benchmarkme.reaction_results: ~0 rows (approximately)

-- Dumping structure for table benchmarkme.typing_results
CREATE TABLE IF NOT EXISTS `typing_results` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `wpm` int(11) NOT NULL,
  `cpm` int(11) NOT NULL,
  `accuracy_percent` decimal(5,2) NOT NULL,
  `correct_chars` int(11) NOT NULL,
  `incorrect_chars` int(11) NOT NULL,
  `total_chars` int(11) NOT NULL,
  `test_duration_seconds` int(11) DEFAULT 60,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_typing` (`user_id`),
  KEY `idx_typing_wpm` (`wpm`),
  CONSTRAINT `typing_results_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table benchmarkme.typing_results: ~0 rows (approximately)

-- Dumping structure for table benchmarkme.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table benchmarkme.users: ~1 rows (approximately)
INSERT IGNORE INTO `users` (`id`, `email`, `password_hash`, `created_at`, `updated_at`) VALUES
	('', 'viestursi2006@inbox.lv', '$2b$10$nrHMQjbvPNFw.a23mwxJh.WmMnxXlVnNkKBvxunDRGuqLjHZC26ge', '2025-12-16 20:01:53', '2025-12-16 20:01:53');

-- Dumping structure for trigger benchmarkme.trg_aim_results_uuid
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER trg_aim_results_uuid
BEFORE INSERT ON aim_results
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger benchmarkme.trg_memory_results_uuid
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER trg_memory_results_uuid
BEFORE INSERT ON memory_results
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger benchmarkme.trg_number_memory_results_uuid
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER trg_number_memory_results_uuid
BEFORE INSERT ON number_memory_results
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger benchmarkme.trg_reaction_results_uuid
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER trg_reaction_results_uuid
BEFORE INSERT ON reaction_results
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger benchmarkme.trg_typing_results_uuid
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER trg_typing_results_uuid
BEFORE INSERT ON typing_results
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
