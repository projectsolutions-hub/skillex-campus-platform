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

-- ========================================================
-- SkillEx Initial Campus Seed Data
-- ========================================================
USE `skillex`;

INSERT INTO `users` (id, name, email, password_hash, role, department, year, college, verified, bio, available, suspended, flagged, skills, portfolio, stats, reviews) VALUES ('u1', 'Student User', 'student@dypatu.edu.in', '$2y$10$bOIuJnmPf7LVWcfVQhKv0exknSsk4RgeznTgE74ClE9r6iaK4rwXW', 'student', 'CSE', '2nd year', 'DYPATU', 1, 'Full-stack developer interested in React, Node, and campus tech tooling. Currently leading web initiatives.', 1, 0, 0, '["React","Python","UI/UX","JavaScript","Node.js"]', '[{"title":"Robotics Club portal","rating":5,"status":"Completed"},{"title":"Canteen menu app UI","rating":5,"status":"Completed"},{"title":"Alumni meet landing page","rating":4.9,"status":"Completed"}]', '{"reputation":4.8,"completedProjects":23,"repeatClients":6,"onTimeRate":94,"earnedTerm":11400,"qualityScore":96,"commScore":92,"timeScore":94,"reqScore":90}', '[]');
INSERT INTO `users` (id, name, email, password_hash, role, department, year, college, verified, bio, available, suspended, flagged, skills, portfolio, stats, reviews) VALUES ('u2', 'Aditi Kamble', 'aditi@dypatu.edu.in', '$2y$10$bOIuJnmPf7LVWcfVQhKv0exknSsk4RgeznTgE74ClE9r6iaK4rwXW', 'student', 'CSE', '3rd year', 'DYPATU', 1, 'Front-end developer who enjoys turning messy club requirements into clean, fast interfaces.', 1, 0, 0, '["React","Figma","Tailwind","TypeScript"]', '[{"title":"Robotics Club portal","rating":5,"status":"Completed"},{"title":"Canteen menu app UI","rating":5,"status":"Completed"},{"title":"Alumni meet landing page","rating":5,"status":"Completed"}]', '{"reputation":4.9,"completedProjects":23,"repeatClients":7,"onTimeRate":96,"earnedTerm":18500,"qualityScore":97,"commScore":95,"timeScore":96,"reqScore":94}', '[]');
INSERT INTO `users` (id, name, email, password_hash, role, department, year, college, verified, bio, available, suspended, flagged, skills, portfolio, stats, reviews) VALUES ('u3', 'Rohan Gaikwad', 'rohan@dypatu.edu.in', '$2y$10$bOIuJnmPf7LVWcfVQhKv0exknSsk4RgeznTgE74ClE9r6iaK4rwXW', 'student', 'IT', '2nd year', 'DYPATU', 1, 'Backend enthusiast and full stack developer. Built campus automation bots.', 1, 0, 0, '["React","Node","Figma","Express","MongoDB"]', '[{"title":"Attendance bot","rating":4.8,"status":"Completed"},{"title":"Library seat finder","rating":4.7,"status":"Completed"}]', '{"reputation":4.7,"completedProjects":14,"repeatClients":4,"onTimeRate":91,"earnedTerm":9200,"qualityScore":90,"commScore":89,"timeScore":91,"reqScore":88}', '[]');
INSERT INTO `users` (id, name, email, password_hash, role, department, year, college, verified, bio, available, suspended, flagged, skills, portfolio, stats, reviews) VALUES ('u4', 'Meera Joshi', 'meera@dypatu.edu.in', '$2y$10$bOIuJnmPf7LVWcfVQhKv0exknSsk4RgeznTgE74ClE9r6iaK4rwXW', 'student', 'ENTC', '3rd year', 'DYPATU', 1, 'UI/UX Designer and Illustrator with an eye for clean campus branding and event identity.', 0, 0, 0, '["Figma","UI/UX","Branding","Illustrator"]', '[{"title":"TechFest 2025 Branding","rating":4.9,"status":"Completed"},{"title":"EcoClub brochure design","rating":4.8,"status":"Completed"}]', '{"reputation":4.8,"completedProjects":19,"repeatClients":5,"onTimeRate":98,"earnedTerm":14200,"qualityScore":95,"commScore":94,"timeScore":98,"reqScore":92}', '[]');
INSERT INTO `users` (id, name, email, password_hash, role, department, year, college, verified, bio, available, suspended, flagged, skills, portfolio, stats, reviews) VALUES ('u5', 'Riya Deshmukh', 'riya@dypatu.edu.in', '$2y$10$bOIuJnmPf7LVWcfVQhKv0exknSsk4RgeznTgE74ClE9r6iaK4rwXW', 'student', 'CSE', '3rd year', 'DYPATU', 1, 'TechNova 2026 fest coordinator and student developer.', 1, 0, 0, '["Management","React","Public Speaking"]', '[]', '{"reputation":4.9,"completedProjects":9,"repeatClients":3,"onTimeRate":95,"earnedTerm":6000,"qualityScore":94,"commScore":96,"timeScore":95,"reqScore":92}', '[]');
INSERT INTO `users` (id, name, email, password_hash, role, department, year, college, verified, bio, available, suspended, flagged, skills, portfolio, stats, reviews) VALUES ('u6', 'Karan Jadhav', 'karan@dypatu.edu.in', '$2y$10$bOIuJnmPf7LVWcfVQhKv0exknSsk4RgeznTgE74ClE9r6iaK4rwXW', 'student', 'Mechanical', '4th year', 'DYPATU', 1, 'Robotics Club lead organizer.', 1, 0, 0, '["Robotics","3D Modeling","Branding"]', '[]', '{"reputation":4.6,"completedProjects":5,"repeatClients":1,"onTimeRate":90,"earnedTerm":4000}', '[]');
INSERT INTO `users` (id, name, email, password_hash, role, department, year, college, verified, bio, available, suspended, flagged, skills, portfolio, stats, reviews) VALUES ('u7', 'Omkar Shinde', 'omkar@dypatu.edu.in', '$2y$10$bOIuJnmPf7LVWcfVQhKv0exknSsk4RgeznTgE74ClE9r6iaK4rwXW', 'student', 'IT', '3rd year', 'DYPATU', 1, 'Data enthusiast, Python programmer.', 1, 0, 0, '["Python","Pandas","Excel"]', '[]', '{"reputation":4.8,"completedProjects":8,"repeatClients":2,"onTimeRate":93,"earnedTerm":5200}', '[]');
INSERT INTO `users` (id, name, email, password_hash, role, department, year, college, verified, bio, available, suspended, flagged, skills, portfolio, stats, reviews) VALUES ('u8', 'Sneha Pawar', 'sneha@dypatu.edu.in', '$2y$10$bOIuJnmPf7LVWcfVQhKv0exknSsk4RgeznTgE74ClE9r6iaK4rwXW', 'student', 'CSE', '4th year', 'DYPATU', 1, 'Video creator, department showreel editor.', 1, 0, 0, '["Premiere Pro","Color grading","After Effects"]', '[]', '{"reputation":4.9,"completedProjects":11,"repeatClients":3,"onTimeRate":95,"earnedTerm":8400}', '[]');
INSERT INTO `users` (id, name, email, password_hash, role, department, year, college, verified, bio, available, suspended, flagged, skills, portfolio, stats, reviews) VALUES ('u9', 'Pooja Mane', 'pooja@dypatu.edu.in', '$2y$10$bOIuJnmPf7LVWcfVQhKv0exknSsk4RgeznTgE74ClE9r6iaK4rwXW', 'student', 'CSE', '2nd year', 'DYPATU', 1, 'Academic notes curator, technical writer.', 1, 0, 0, '["Technical writing","DBMS","Markdown"]', '[]', '{"reputation":4.7,"completedProjects":6,"repeatClients":2,"onTimeRate":92,"earnedTerm":3100}', '[]');
INSERT INTO `users` (id, name, email, password_hash, role, department, year, college, verified, bio, available, suspended, flagged, skills, portfolio, stats, reviews) VALUES ('u_admin', 'Ritu Sharma (Admin)', 'admin.ritu@dypatu.edu.in', '$2y$10$tTXYKog.KlgXuehVkMpZXutlksSvvfr8PVm8z7TXBAxMNa6c5h.OC', 'admin', 'Faculty Coordinator', 'Staff', 'DYPATU', 1, 'SkillEx Campus Administrator and Verification Officer.', 1, 0, 0, '["Platform Moderation","Verification","Dispute Resolution"]', '[]', '{"reputation":5,"completedProjects":0,"repeatClients":0,"onTimeRate":100,"earnedTerm":0}', '[]');
INSERT INTO `projects` (id, client_id, client_name, title, description, category, budget, deadline, deadline_date, complexity, status, assigned_freelancer_id, assigned_freelancer_name, match_percent, proposals_count, skills, deliverables, milestones) VALUES ('p1', 'u5', 'Riya Deshmukh', 'Fest website for TechNova 2026', 'Responsive website for the annual college tech fest with schedule, event registration and sponsor pages. Must work well on phones since most students will open it from WhatsApp links.', 'Web Dev', 6000, 'Nov 18, 2026', '2026-11-18', 'Medium', 'In Progress', 'u2', 'Aditi Kamble', 94, 7, '["React","Figma","Tailwind"]', '["Figma design (3 pages)","Deployed site","Source code + README"]', '[{"id":"m1","title":"Design in Figma","deadline":"Oct 05","status":"Approved","deliverable":"Figma design link + prototypes"},{"id":"m2","title":"Homepage + schedule","deadline":"Oct 14","status":"Submitted","deliverable":"Live preview link + files"},{"id":"m3","title":"Registration flow","deadline":"Oct 28","status":"In Progress","deliverable":"Interactive form with validation"},{"id":"m4","title":"Launch + handover","deadline":"Nov 15","status":"Not started","deliverable":"Production deployment and repo handover"}]');
INSERT INTO `projects` (id, client_id, client_name, title, description, category, budget, deadline, deadline_date, complexity, status, assigned_freelancer_id, assigned_freelancer_name, match_percent, proposals_count, skills, deliverables, milestones) VALUES ('p2', 'u6', 'Karan Jadhav', 'Logo and brand kit for Robotics Club', 'Looking for an energetic, modern logo for the DYPATU Robotics Club including vector exports (SVG, AI, PNG), color codes, and social media display avatars.', 'Design', 2500, 'Oct 28, 2026', '2026-10-28', 'Low', 'Open', NULL, NULL, 81, 12, '["Illustrator","Branding"]', '["Primary & secondary logo marks","Color palette specification","Social banner templates"]', '[{"id":"m1","title":"3 Logo Concepts","deadline":"Oct 18","status":"Not started","deliverable":"Draft sketches & vectors"},{"id":"m2","title":"Final Brand Guide","deadline":"Oct 28","status":"Not started","deliverable":"Vector files and usage guidelines"}]');
INSERT INTO `projects` (id, client_id, client_name, title, description, category, budget, deadline, deadline_date, complexity, status, assigned_freelancer_id, assigned_freelancer_name, match_percent, proposals_count, skills, deliverables, milestones) VALUES ('p3', 'u_dept', 'Prof. S. Kulkarni (Dept.)', 'Hostel mess feedback app', 'A mobile application for hostel boarders to submit daily meal ratings, report hygiene complaints with photo attachment, and view weekly meal menus.', 'App Dev', 9000, 'Dec 05, 2026', '2026-12-05', 'High', 'Open', NULL, NULL, 76, 4, '["Flutter","Firebase","UI/UX"]', '["Flutter cross-platform APK","Firebase Firestore database rule setup","Admin dashboard view"]', '[{"id":"m1","title":"UI Mockup & Schema","deadline":"Nov 10","status":"Not started","deliverable":"Figma prototype & database model"},{"id":"m2","title":"Student App MVP","deadline":"Nov 25","status":"Not started","deliverable":"Working APK build"},{"id":"m3","title":"Admin Portal & Testing","deadline":"Dec 05","status":"Not started","deliverable":"Production release"}]');
INSERT INTO `projects` (id, client_id, client_name, title, description, category, budget, deadline, deadline_date, complexity, status, assigned_freelancer_id, assigned_freelancer_name, match_percent, proposals_count, skills, deliverables, milestones) VALUES ('p4', 'u8', 'Sneha Pawar', 'Edit 3-minute department showreel', 'Compile and edit high-energy video highlights from department laboratories, robotics competitions, and campus placements into a 3-minute 4K promotional clip.', 'Video', 3000, 'Oct 22, 2026', '2026-10-22', 'Medium', 'In Progress', 'u1', 'Student User', 68, 9, '["Premiere Pro","Color grading"]', '["Rough cut with synced BGM","Final color-graded 1080p and 4K exports","Vertical reels cut for Instagram"]', '[{"id":"m1","title":"Rough Cut & Audio Sync","deadline":"Oct 15","status":"Approved","deliverable":"Preview video link"},{"id":"m2","title":"Color Grading & Motion Titles","deadline":"Oct 22","status":"Submitted","deliverable":"Final master render"}]');
INSERT INTO `projects` (id, client_id, client_name, title, description, category, budget, deadline, deadline_date, complexity, status, assigned_freelancer_id, assigned_freelancer_name, match_percent, proposals_count, skills, deliverables, milestones) VALUES ('p5', 'u7', 'Omkar Shinde', 'Data cleaning for survey of 600 students', 'Clean survey responses collected across Google Forms for the NAAC accreditation criteria. Standardize department names, handle missing values, and output formatted summaries.', 'Data', 1800, 'Oct 30, 2026', '2026-10-30', 'Low', 'Open', NULL, NULL, 88, 5, '["Python","Pandas","Excel"]', '["Jupyter Notebook or Python script","Cleaned Excel workbook (.xlsx)","Summary chart deck"]', '[{"id":"m1","title":"Data Cleaning Pipeline","deadline":"Oct 20","status":"Approved","deliverable":"Python script"},{"id":"m2","title":"Final Analyzed Spreadsheets","deadline":"Oct 30","status":"In Progress","deliverable":"Excel report with charts"}]');
INSERT INTO `projects` (id, client_id, client_name, title, description, category, budget, deadline, deadline_date, complexity, status, assigned_freelancer_id, assigned_freelancer_name, match_percent, proposals_count, skills, deliverables, milestones) VALUES ('p6', 'u9', 'Pooja Mane', 'Notes summarizer for DBMS syllabus', 'Prepare structured revision cheat-sheets and question banks covering normalization, SQL indexing, and transaction ACID properties based on SU syllabus.', 'Writing', 1200, 'Nov 02, 2026', '2026-11-02', 'Low', 'Open', NULL, NULL, 72, 3, '["Technical writing","DBMS"]', '["5 Unit Markdown summaries","Quick revision formula sheet","Solved university exam questions"]', '[{"id":"m1","title":"Units 1-3 Summary","deadline":"Oct 25","status":"Not started","deliverable":"PDF & Markdown notes"},{"id":"m2","title":"Units 4-5 + Question Bank","deadline":"Nov 02","status":"Not started","deliverable":"Complete booklet"}]');
INSERT INTO `proposals` (id, project_id, freelancer_id, freelancer_name, department, match_percent, rating, on_time_rate, skills, bid_amount, delivery_days, cover_letter, why_points, status) VALUES ('pr1', 'p1', 'u2', 'Aditi Kamble', 'CSE, 3rd year', 92, 4.9, 96, '["React","Figma","Tailwind","TypeScript"]', 5800, 12, 'I built the Robotics Club portal last semester, so I can start this week and share a Figma draft in 3 days. Available every evening.', '["5/6 required skills matched","3 relevant portfolio projects","96% on-time completion","Available before deadline"]', 'Selected');
INSERT INTO `proposals` (id, project_id, freelancer_id, freelancer_name, department, match_percent, rating, on_time_rate, skills, bid_amount, delivery_days, cover_letter, why_points, status) VALUES ('pr2', 'p1', 'u3', 'Rohan Gaikwad', 'IT, 2nd year', 85, 4.7, 91, '["React","Node","Figma"]', 6100, 14, 'Experience building fast single page apps. Ready to integrate mobile WhatsApp responsive share buttons.', '["4/6 required skills matched","2 relevant portfolio projects","91% on-time completion","Available from Oct 20"]', 'Shortlisted');
INSERT INTO `proposals` (id, project_id, freelancer_id, freelancer_name, department, match_percent, rating, on_time_rate, skills, bid_amount, delivery_days, cover_letter, why_points, status) VALUES ('pr3', 'p1', 'u4', 'Meera Joshi', 'ENTC, 3rd year', 79, 4.8, 98, '["Figma","UI/UX","Branding"]', 6400, 16, 'Can deliver high fidelity Figma screens and design tokens for the frontend developer to implement effortlessly.', '["3/6 required skills matched","4 design portfolio projects","98% on-time completion","Limited availability"]', 'Pending');
INSERT INTO `proposals` (id, project_id, freelancer_id, freelancer_name, department, match_percent, rating, on_time_rate, skills, bid_amount, delivery_days, cover_letter, why_points, status) VALUES ('pr4', 'p5', 'u1', 'Student User', 'CSE, 2nd year', 88, 4.8, 94, '["Python","Pandas","Excel"]', 1800, 6, 'Familiar with academic survey dataset cleaning and automated chart exports.', '["Strong Python & Pandas experience","High academic standing","Quick turnaround"]', 'Shortlisted');
INSERT INTO `workspaces` (project_id, client_id, client_name, freelancer_id, freelancer_name, progress_percent, status, milestones, files, chat, timeline) VALUES ('p1', 'u5', 'Riya Deshmukh', 'u2', 'Aditi Kamble', 55, 'In Progress', '[{"id":"m1","title":"Design in Figma","deadline":"Oct 05","status":"Approved","deliverable":"Figma design link + prototypes"},{"id":"m2","title":"Homepage + schedule","deadline":"Oct 14","status":"Submitted","deliverable":"Live preview link + files"},{"id":"m3","title":"Registration flow","deadline":"Oct 28","status":"In Progress","deliverable":"Interactive form with validation"},{"id":"m4","title":"Launch + handover","deadline":"Nov 15","status":"Not started","deliverable":"Production deployment and repo handover"}]', '[{"id":"f1","name":"technova-design-v3.fig","uploader":"Aditi","date":"Oct 05","size":"14.2 MB","isPrivate":true},{"id":"f2","name":"homepage-preview.zip","uploader":"Aditi","date":"Oct 13","size":"8.6 MB","isPrivate":true},{"id":"f3","name":"sponsor-logos.zip","uploader":"Riya","date":"Oct 02","size":"4.1 MB","isPrivate":true}]', '[{"id":"c1","senderId":"u2","senderName":"Aditi","text":"Hi! Homepage preview is up. Check the schedule layout?","timestamp":"10:42 AM","date":"Oct 13","isMe":false},{"id":"c2","senderId":"u1","senderName":"You","text":"Looks great. Can the register button be sticky on mobile?","timestamp":"11:05 AM","date":"Oct 13","isMe":true},{"id":"c3","senderId":"u2","senderName":"Aditi","text":"Done, pushing now.","timestamp":"11:20 AM","date":"Oct 13","isMe":false}]', '[{"title":"Milestone 2 submitted","date":"Oct 13","desc":"Homepage + schedule preview link pushed"},{"title":"Milestone 1 approved","date":"Oct 06","desc":"Design in Figma confirmed by Riya"},{"title":"Aditi selected as freelancer","date":"Sep 28","desc":"Agreement signed, workspace opened"},{"title":"Project published","date":"Sep 20","desc":"TechNova fest requirements shared to campus"}]');
INSERT INTO `verification_queue` (id, name, email, id_card, dept, status) VALUES ('v1', 'Pratik Mane', 'pratik@dypatu.edu.in', 'Uploaded', 'Civil, 2nd yr', 'Pending');
INSERT INTO `verification_queue` (id, name, email, id_card, dept, status) VALUES ('v2', 'Neha Salunkhe', 'neha@dypatu.edu.in', 'Uploaded', 'CSE, 1st yr', 'Pending');
INSERT INTO `verification_queue` (id, name, email, id_card, dept, status) VALUES ('v3', 'Vishal Patil', 'vishal@dypatu.edu.in', 'Uploaded', 'Mech, 3rd yr', 'Pending');
INSERT INTO `skill_demand_supply` (skill, demand, supply, category) VALUES ('Flutter', 22, 6, 'General');
INSERT INTO `skill_demand_supply` (skill, demand, supply, category) VALUES ('Video editing', 27, 11, 'General');
INSERT INTO `skill_demand_supply` (skill, demand, supply, category) VALUES ('React', 48, 40, 'General');
INSERT INTO `skill_demand_supply` (skill, demand, supply, category) VALUES ('Python', 36, 34, 'General');
INSERT INTO `skill_demand_supply` (skill, demand, supply, category) VALUES ('Technical writing', 9, 15, 'General');
INSERT INTO `moderation_queue` (id, title, reason, user, status) VALUES ('m1', 'Project “Write my assignment”', 'Possible academic dishonesty', 'user_0932', 'Pending');
INSERT INTO `moderation_queue` (id, title, reason, user, status) VALUES ('m2', 'Chat message in Showreel edit', 'Asked to pay outside SkillEx', 'user_1187', 'Pending');
INSERT INTO `moderation_queue` (id, title, reason, user, status) VALUES ('m3', 'Profile bio', 'Contains phone number', 'user_1450', 'Pending');
INSERT INTO `disputes` (id, case_id, title, project, details, filed_by, status, severity) VALUES ('d1', '#R-212', 'Missed deadline', 'Showreel edit', '', '', 'Disputed', 'High');
INSERT INTO `disputes` (id, case_id, title, project, details, filed_by, status, severity) VALUES ('d2', '#R-209', 'Rude messages', 'Hostel app', '', '', 'In review', 'Medium');
INSERT INTO `audit_logs` (time, admin, action, target) VALUES ('10:42 AM', 'admin.ritu', 'Approved verification', 'Neha Salunkhe');
INSERT INTO `audit_logs` (time, admin, action, target) VALUES ('10:15 AM', 'admin.ritu', 'Removed project', '“Write my assignment”');
INSERT INTO `audit_logs` (time, admin, action, target) VALUES ('Yesterday', 'admin.sam', 'Suspended user', 'Pratik Mane');
INSERT INTO `audit_logs` (time, admin, action, target) VALUES ('Yesterday', 'system', 'Raised risk alert', 'user_1187');
INSERT INTO `fraud_alerts` (id, alert, user, level) VALUES ('fa1', 'Asked to chat off-platform', 'user_1187', 'High');
INSERT INTO `fraud_alerts` (id, alert, user, level) VALUES ('fa2', '5 identical proposals in 10 min', 'user_0932', 'Medium');
INSERT INTO `notifications` (id, text, time, unread) VALUES ('n1', 'New proposal on “Fest website”', '2h ago', 1);
INSERT INTO `notifications` (id, text, time, unread) VALUES ('n2', 'Milestone 2 needs your review', '5h ago', 1);
INSERT INTO `notifications` (id, text, time, unread) VALUES ('n3', 'Aditi replied in project chat', 'Yesterday', 1);
INSERT INTO `notifications` (id, text, time, unread) VALUES ('n4', 'Review received ★5 from Sneha', '2d ago', 0);
INSERT INTO `notifications` (id, text, time, unread) VALUES ('n5', 'Your verification was approved', '1w ago', 0);
