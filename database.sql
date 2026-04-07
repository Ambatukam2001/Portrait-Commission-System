-- phpMyAdmin SQL Dump
-- Single Import File (Creates Database and All Tables)

CREATE DATABASE IF NOT EXISTS `portrait_drawing_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `portrait_drawing_db`;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- --------------------------------------------------------

-- Table structure for table `artworks`
CREATE TABLE `artworks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `size` varchar(255) DEFAULT NULL,
  `image_url` longtext DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `artworks`
INSERT INTO `artworks` (`id`, `title`, `category`, `size`, `image_url`, `is_featured`, `created_at`) VALUES
(1, 'Graceful Glance', 'Graphite', '9x12 inches', 'images/portrait_sample.png', 1, '2026-04-06 14:00:01');

-- --------------------------------------------------------

-- Table structure for table `bookings`
CREATE TABLE `bookings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_name` varchar(255) NOT NULL,
  `client_email` varchar(255) NOT NULL,
  `client_phone` varchar(255) DEFAULT '',
  `client_social` varchar(255) DEFAULT '',
  `medium` varchar(255) NOT NULL,
  `size` varchar(255) DEFAULT '',
  `address` text DEFAULT NULL,
  `deadline` varchar(255) DEFAULT '',
  `payment_method` varchar(255) DEFAULT '',
  `reference_url` longtext DEFAULT NULL,
  `receipt_url` longtext DEFAULT NULL,
  `status` enum('pending','accepted','completed','rejected') DEFAULT 'pending',
  `live_status` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `bookings`
INSERT INTO `bookings` (`id`, `client_name`, `client_email`, `client_phone`, `client_social`, `medium`, `size`, `address`, `deadline`, `payment_method`, `reference_url`, `receipt_url`, `status`, `live_status`, `created_at`, `updated_at`) VALUES
(1, 'PHP Test', 'test@example.com', '', '', 'pencil', '', '', '', 'cash-in', '', '', 'pending', 0, '2026-04-06 14:04:27', '2026-04-06 14:04:27');

-- --------------------------------------------------------

-- Table structure for table `rates`
CREATE TABLE `rates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `size` varchar(255) NOT NULL,
  `label` varchar(255) DEFAULT NULL,
  `price` varchar(255) DEFAULT NULL,
  `order_index` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `rates`
INSERT INTO `rates` (`id`, `size`, `label`, `price`, `order_index`) VALUES
(1, '8.5 x 11', 'Standard Letter', 500.00, 1),
(2, '9 x 12', 'Artist Choice', 750.00, 2),
(3, '11 x 14', 'Premium Large', 1200.00, 3),
(4, '12 x 18', 'Exhibition Size', 2000.00, 4);

-- --------------------------------------------------------

-- Table structure for table `services`
CREATE TABLE `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` longtext DEFAULT NULL,
  `order_index` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `services`
INSERT INTO `services` (`id`, `title`, `description`, `image_url`, `order_index`) VALUES
(1, 'Pencil Realism Art',  '"BINI Mikha" - A breathtaking hyper-realistic pencil portrait, meticulously crafted to capture every fine detail and expression.', 'images/portrait_sample.png', 1),
(2, 'Colored Drawing Art', '"Evil Demon Slayer" - A masterful triple-panel hand-drawn illustration with vibrant colored pencils and bold Japanese calligraphy.',  'images/colored.jpg',          2),
(3, 'Digital Masterpiece', '"ASEAN Diversity" - A professional digital commission celebrating Southeast Asian unity and cultural harmony.',                      'images/digital_art.png',      3);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
