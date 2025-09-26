-- MariaDB dump 10.19  Distrib 10.4.28-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: attendance_system
-- ------------------------------------------------------
-- Server version	10.4.28-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','late') DEFAULT 'absent',
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attendance` (`student_id`,`date`),
  KEY `idx_student_date` (`student_id`,`date`),
  KEY `idx_date` (`date`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (1,'13','2025-09-21','absent',NULL,NULL,NULL,'2025-09-21 08:21:18','2025-09-21 08:35:37'),(2,'12','2025-09-21','present',NULL,NULL,NULL,'2025-09-21 08:21:18','2025-09-21 08:34:54');
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'IT','Information Technology Department','2025-09-21 09:29:51'),(2,'HR','Human Resources Department','2025-09-21 09:29:51'),(3,'Finance','Finance and Accounting Department','2025-09-21 09:29:51'),(4,'Marketing','Marketing and Sales Department','2025-09-21 09:29:51'),(5,'Operations','Operations and Management Department','2025-09-21 09:29:51');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `department` varchar(100) NOT NULL,
  `position` varchar(100) NOT NULL,
  `hire_date` date DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `status` enum('active','inactive','terminated') DEFAULT 'active',
  `date_added` timestamp NOT NULL DEFAULT current_timestamp(),
  `father_name` varchar(100) DEFAULT NULL,
  `cnic` varchar(15) DEFAULT NULL,
  `education` varchar(200) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `address` text DEFAULT NULL,
  `reference` varchar(200) DEFAULT NULL,
  `picture` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `cnic` (`cnic`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_email` (`email`),
  KEY `idx_department` (`department`),
  KEY `idx_cnic` (`cnic`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (26,'MCS001','Aqeel Ur Rehman','aaqueel@gmail.com','03214424625','IT','System Administrator','2020-02-21',NULL,'active','2025-09-21 09:35:39','Chowdhary Allah Bukhash','35201-9055954-3','MCS',NULL,'Office No. 306, EdenTower, Main Boulevord, Gulberg','Aziz Ur Rehman','/uploads/employee_MCS001_1758458207514.png'),(32,'MCS002','MCS RWP','mcsrwp@gmail.com','03334488205','IT','Software Developer','2025-08-06',41520.00,'active','2025-09-21 11:49:57','NN','33333-3333333-3','BBA',NULL,'83, The Mall, Lahore','AZIZ SB','/uploads/employee_MCS002_1758458345355.jpeg'),(33,'MCS003','onenet pk','onenetpk@gmail.com','03334488205','Finance','Accountant','2003-10-25',75000.00,'active','2025-09-21 11:53:13','Gh','45556-6666667-7','Mcs',NULL,'83, The Mall, Lahore','Aziz Ur Rehman','/uploads/employee-1758455593557-914535146.png'),(34,'MCS004','Bilal Aqeel','bilal@gmail.com','03138888888','IT','Game Developer','2009-10-10',250000.00,'active','2025-09-24 00:01:54','Aqeel Ur Rehman','35201-9055954-5','10th',NULL,'Office No. 306, EdenTower, Main Boulevord, Gulberg','AZIZ SB','/uploads/employee_MCS004_1758672468109.png');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `positions`
--

DROP TABLE IF EXISTS `positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `positions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `title` (`title`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `positions_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `positions`
--

LOCK TABLES `positions` WRITE;
/*!40000 ALTER TABLE `positions` DISABLE KEYS */;
INSERT INTO `positions` VALUES (1,'Software Developer',1,'Develops and maintains software applications','2025-09-21 09:29:51'),(2,'System Administrator',1,'Manages IT infrastructure and systems','2025-09-21 09:29:51'),(3,'HR Manager',2,'Manages human resources operations','2025-09-21 09:29:51'),(4,'HR Assistant',2,'Assists with HR administrative tasks','2025-09-21 09:29:51'),(5,'Financial Analyst',3,'Analyzes financial data and reports','2025-09-21 09:29:51'),(6,'Accountant',3,'Handles accounting and bookkeeping','2025-09-21 09:29:51'),(7,'Marketing Specialist',4,'Develops marketing strategies and campaigns','2025-09-21 09:29:51'),(8,'Sales Representative',4,'Manages client relationships and sales','2025-09-21 09:29:51'),(9,'Operations Manager',5,'Oversees daily operations','2025-09-21 09:29:51'),(10,'Project Manager',5,'Manages projects and teams','2025-09-21 09:29:51'),(11,'Game Developer',NULL,NULL,'2025-09-24 00:01:05');
/*!40000 ALTER TABLE `positions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `class` varchar(100) NOT NULL,
  `date_added` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (4,'12','Aqeel','aaqueel@gmial.com','03214424625','5th','2025-09-21 08:16:00'),(5,'13','Bilal','bilal@gmail.com','03114424625','4th','2025-09-21 08:18:01');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('admin','manager','user') DEFAULT 'user',
  `employee_id` varchar(50) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2b$10$DLvuln.Z5JfBux2uFTL3N.ZqX0PUPmOrD04ADVA9/CP9tDs0lMntW','admin@example.com','admin',NULL,'2025-09-25 06:16:34','active','2025-09-23 04:54:31','2025-09-25 06:16:34'),(2,'attendance','$2b$10$OmEJM2KwUIFDfWwpdopLqe0q41wmgTSDqrf9TGdF1gSZbaL7ZCpxO','attendance@example.com','user',NULL,'2025-09-25 06:16:40','active','2025-09-23 04:54:31','2025-09-25 06:16:40');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_records`
--

DROP TABLE IF EXISTS `work_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `work_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','late','sick_leave','vacation') DEFAULT 'absent',
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `hours_worked` decimal(4,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `checkout_reason` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_employee_date` (`employee_id`,`date`),
  KEY `idx_date` (`date`),
  CONSTRAINT `work_records_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_records`
--

LOCK TABLES `work_records` WRITE;
/*!40000 ALTER TABLE `work_records` DISABLE KEYS */;
INSERT INTO `work_records` VALUES (2,'MCS001','2025-09-21','present',NULL,NULL,NULL,NULL,'2025-09-21 12:58:38','2025-09-21 12:58:38',NULL),(3,'MCS003','2025-09-21','present',NULL,NULL,NULL,NULL,'2025-09-21 13:16:04','2025-09-21 13:16:04',NULL),(4,'MCS001','2025-09-22','present',NULL,NULL,NULL,NULL,'2025-09-21 13:54:05','2025-09-21 13:54:05',NULL),(5,'MCS001','2025-09-23','present',NULL,NULL,NULL,NULL,'2025-09-21 13:55:47','2025-09-21 13:55:47',NULL),(6,'MCS002','2025-09-21','present',NULL,NULL,NULL,NULL,'2025-09-21 14:43:36','2025-09-21 14:43:36',NULL),(7,'mcs001','2025-09-24','present','05:08:00','06:56:00',1.80,NULL,'2025-09-24 00:08:24','2025-09-24 01:56:20','Lunch'),(8,'mcs004','2025-09-24','present','05:42:00','06:59:00',1.28,NULL,'2025-09-24 00:42:43','2025-09-24 01:59:03','Day off'),(10,'mcs003','2025-09-24','present','06:14:00','07:00:00',0.77,NULL,'2025-09-24 01:14:22','2025-09-24 02:00:24','Day off'),(13,'mcs001','2025-09-24','present','07:53:00','08:17:00',0.40,NULL,'2025-09-24 02:53:07','2025-09-24 03:17:34','Day off'),(16,'mcs001','2025-09-24','present','08:30:00','08:50:00',0.33,NULL,'2025-09-24 03:30:16','2025-09-24 03:50:02','Lunch break'),(17,'mcs001','2025-09-24','present','08:51:00','08:55:00',0.07,NULL,'2025-09-24 03:51:16','2025-09-24 03:55:08','Tea'),(18,'mcs004','2025-09-24','present','08:51:00',NULL,NULL,NULL,'2025-09-24 03:51:50','2025-09-24 03:51:50',NULL),(19,'mcs001','2025-09-24','present','08:55:00','08:55:00',0.00,NULL,'2025-09-24 03:55:19','2025-09-24 03:55:29','Lunch'),(20,'mcs001','2025-09-24','present','08:55:00','09:29:00',0.57,NULL,'2025-09-24 03:55:37','2025-09-24 04:29:22','Lunch'),(21,'mcs003','2025-09-24','present','09:29:00','09:34:00',0.08,NULL,'2025-09-24 04:29:03','2025-09-24 04:34:00','Day off'),(25,'mcs003','2025-09-24','present','09:34:00','09:41:00',0.12,NULL,'2025-09-24 04:34:08','2025-09-24 04:41:07','Tea'),(36,'mcs003','2025-09-24','present','09:42:00','09:42:00',0.00,NULL,'2025-09-24 04:42:33','2025-09-24 04:42:42','Day off'),(38,'MCS002','2025-09-24','present','09:00:00','17:00:00',8.00,NULL,'2025-09-24 04:47:44','2025-09-24 04:47:44','Day off'),(39,'MCS001','2025-09-25','present','10:09:00','10:11:00',0.03,NULL,'2025-09-25 05:09:21','2025-09-25 05:11:55','Tea'),(40,'MCS002','2025-09-25','present','10:09:00','10:09:00',0.00,NULL,'2025-09-25 05:09:30','2025-09-25 05:09:38','Official Work'),(41,'MCS002','2025-09-25','present','10:10:00','10:10:00',0.00,NULL,'2025-09-25 05:10:38','2025-09-25 05:10:51','Day off'),(42,'MCS001','2025-09-25','present','10:12:00','10:12:00',0.00,NULL,'2025-09-25 05:12:08','2025-09-25 05:12:21','Lunch'),(43,'MCS001','2025-09-25','present','10:12:00','10:13:00',0.02,NULL,'2025-09-25 05:12:39','2025-09-25 05:13:42','Tea'),(44,'MCS001','2025-09-25','present','10:13:00','10:14:00',0.02,NULL,'2025-09-25 05:13:48','2025-09-25 05:14:00','Personal Work'),(45,'MCS001','2025-09-25','present','10:14:00','10:14:00',0.00,NULL,'2025-09-25 05:14:05','2025-09-25 05:14:21','Lunch'),(46,'MCS001','2025-09-25','present','10:14:00','10:14:00',0.00,NULL,'2025-09-25 05:14:27','2025-09-25 05:14:39','Official Work'),(47,'MCS003','2025-09-25','present','10:15:00','10:15:00',0.00,NULL,'2025-09-25 05:15:08','2025-09-25 05:15:19','Lunch'),(48,'MCS003','2025-09-25','present','10:15:00','10:15:00',0.00,NULL,'2025-09-25 05:15:29','2025-09-25 05:15:37','Tea'),(49,'MCS003','2025-09-25','present','10:15:00','10:16:00',0.02,NULL,'2025-09-25 05:15:53','2025-09-25 05:16:05','Personal Work'),(50,'MCS001','2025-09-25','present','10:26:00','10:26:00',0.00,NULL,'2025-09-25 05:26:24','2025-09-25 05:26:47','Tea'),(51,'MCS001','2025-09-25','present','10:26:00','10:27:00',0.02,NULL,'2025-09-25 05:26:53','2025-09-25 05:27:06','Official Work'),(52,'MCS001','2025-09-25','present','10:32:00','10:32:00',0.00,NULL,'2025-09-25 05:32:39','2025-09-25 05:32:48','Lunch'),(53,'MCS001','2025-09-25','present','11:01:00','11:02:00',0.02,NULL,'2025-09-25 06:01:54','2025-09-25 06:02:17','Lunch');
/*!40000 ALTER TABLE `work_records` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-25 11:31:24
