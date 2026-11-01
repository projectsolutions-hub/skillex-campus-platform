-- ========================================================
-- SkillEx Campus Freelancing & Peer Collaboration Database
-- Target: MySQL / MariaDB (XAMPP Compatible)
-- ========================================================

CREATE DATABASE IF NOT EXISTS `skillex` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `skillex`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `fraud_alerts`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `disputes`;
DROP TABLE IF EXISTS `moderation_queue`;
DROP TABLE IF EXISTS `skill_demand_supply`;
DROP TABLE IF EXISTS `verification_queue`;
DROP TABLE IF EXISTS `workspaces`;
DROP TABLE IF EXISTS `proposals`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- Table: users
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  `department` VARCHAR(100) DEFAULT 'CSE',
  `year` VARCHAR(50) DEFAULT '2nd year',
  `college` VARCHAR(100) DEFAULT 'DYPATU',
  `verified` TINYINT(1) NOT NULL DEFAULT 1,
  `bio` TEXT NULL,
  `available` TINYINT(1) NOT NULL DEFAULT 1,
  `suspended` TINYINT(1) NOT NULL DEFAULT 0,
  `flagged` TINYINT(1) NOT NULL DEFAULT 0,
  `skills` JSON NULL,
  `portfolio` JSON NULL,
  `stats` JSON NULL,
  `reviews` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: projects
CREATE TABLE IF NOT EXISTS `projects` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `client_id` VARCHAR(50) NOT NULL,
  `client_name` VARCHAR(120) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `budget` INT NOT NULL DEFAULT 3000,
  `deadline` VARCHAR(100) NOT NULL DEFAULT 'TBD',
  `deadline_date` VARCHAR(50) NULL,
  `complexity` VARCHAR(50) NOT NULL DEFAULT 'Medium',
  `status` VARCHAR(50) NOT NULL DEFAULT 'Open',
  `assigned_freelancer_id` VARCHAR(50) NULL,
  `assigned_freelancer_name` VARCHAR(120) NULL,
  `match_percent` INT NOT NULL DEFAULT 90,
  `proposals_count` INT NOT NULL DEFAULT 0,
  `skills` JSON NULL,
  `deliverables` JSON NULL,
  `milestones` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: proposals
CREATE TABLE IF NOT EXISTS `proposals` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(50) NOT NULL,
  `freelancer_id` VARCHAR(50) NOT NULL,
  `freelancer_name` VARCHAR(120) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `match_percent` INT NOT NULL DEFAULT 85,
  `rating` DECIMAL(3,1) NOT NULL DEFAULT 4.8,
  `on_time_rate` INT NOT NULL DEFAULT 95,
  `skills` JSON NULL,
  `bid_amount` INT NOT NULL,
  `delivery_days` INT NOT NULL DEFAULT 7,
  `cover_letter` TEXT NOT NULL,
  `why_points` JSON NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: workspaces
CREATE TABLE IF NOT EXISTS `workspaces` (
  `project_id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `client_id` VARCHAR(50) NULL,
  `client_name` VARCHAR(120) NULL,
  `freelancer_id` VARCHAR(50) NULL,
  `freelancer_name` VARCHAR(120) NULL,
  `progress_percent` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'In Progress',
  `milestones` JSON NULL,
  `files` JSON NULL,
  `chat` JSON NULL,
  `timeline` JSON NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: verification_queue
CREATE TABLE IF NOT EXISTS `verification_queue` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `id_card` VARCHAR(255) DEFAULT 'Uploaded',
  `dept` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
  `submitted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: skill_demand_supply
CREATE TABLE IF NOT EXISTS `skill_demand_supply` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `skill` VARCHAR(100) NOT NULL,
  `demand` INT NOT NULL DEFAULT 0,
  `supply` INT NOT NULL DEFAULT 0,
  `category` VARCHAR(100) DEFAULT 'General'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: moderation_queue
CREATE TABLE IF NOT EXISTS `moderation_queue` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `reason` TEXT NOT NULL,
  `user` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: disputes
CREATE TABLE IF NOT EXISTS `disputes` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `case_id` VARCHAR(50) NULL,
  `title` VARCHAR(255) NOT NULL,
  `project` VARCHAR(255) NOT NULL,
  `details` TEXT NULL,
  `filed_by` VARCHAR(120) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Open',
  `severity` VARCHAR(50) NOT NULL DEFAULT 'Medium'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `time` VARCHAR(50) NOT NULL,
  `admin` VARCHAR(100) NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `target` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: fraud_alerts
CREATE TABLE IF NOT EXISTS `fraud_alerts` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `alert` VARCHAR(255) NOT NULL,
  `user` VARCHAR(100) NOT NULL,
  `level` VARCHAR(50) NOT NULL DEFAULT 'Medium'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `text` TEXT NOT NULL,
  `time` VARCHAR(50) NOT NULL DEFAULT 'Just now',
  `unread` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
