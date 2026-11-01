SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS grabfood_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE grabfood_db;

DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS driver_details;
DROP TABLE IF EXISTS merchant_details;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS vouchers;
DROP TABLE IF EXISTS restaurants;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS food_items;
DROP TABLE IF EXISTS order_statuses;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS payment_transactions;
DROP TABLE IF EXISTS order_status_logs;
DROP TABLE IF EXISTS driver_locations;
DROP TABLE IF EXISTS restaurant_change_requests;
DROP TABLE IF EXISTS reviews;

CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `rating_avg` decimal(3,2) DEFAULT '5.00',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_roles` (
  `user_id` int NOT NULL,
  `role_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `driver_details` (
  `user_id` int NOT NULL,
  `license_plate` varchar(20) DEFAULT NULL,
  `id_card_number` varchar(20) DEFAULT NULL,
  `vehicle_type` varchar(50) DEFAULT NULL,
  `approval_status` varchar(20) DEFAULT 'PENDING',
  `reject_reason` text,
  `is_online` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`user_id`),
  CONSTRAINT `driver_details_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `merchant_details` (
  `user_id` int NOT NULL,
  `business_license` varchar(100) DEFAULT NULL,
  `tax_code` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `merchant_details_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `system_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(50) NOT NULL,
  `config_value` json NOT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `vouchers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `min_order_value` decimal(10,2) DEFAULT '0.00',
  `expiry_date` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `restaurants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text,
  `latitude` double NOT NULL DEFAULT '0',
  `longitude` double NOT NULL DEFAULT '0',
  `opening_time` time DEFAULT '07:00:00',
  `closing_time` time DEFAULT '22:00:00',
  `is_open` tinyint(1) DEFAULT '1',
  `is_open_today` tinyint(1) NOT NULL DEFAULT '1',
  `temporary_closed_reason` text,
  `temporary_closed_until` datetime DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `rating_avg` decimal(3,2) DEFAULT '5.00',
  `approval_status` varchar(20) DEFAULT 'APPROVED',
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `reject_reason` text,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `owner_id` (`owner_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `restaurants_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`),
  CONSTRAINT `restaurants_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `restaurant_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_categories_restaurant` (`restaurant_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `food_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `default_quantity` int NOT NULL DEFAULT '0',
  `current_quantity` int NOT NULL DEFAULT '0',
  `quantity_reset_date` date DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_food_items_category` (`category_id`),
  KEY `idx_food_items_quantity_reset_date` (`quantity_reset_date`),
  CONSTRAINT `food_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `food_items_chk_1` CHECK ((`default_quantity` >= 0)),
  CONSTRAINT `food_items_chk_2` CHECK ((`current_quantity` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `order_statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `label` varchar(100) DEFAULT NULL,
  `description` text,
  `sort_order` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_code` varchar(50) NOT NULL,
  `idempotency_key` varchar(100) NOT NULL,
  `customer_id` int NOT NULL,
  `restaurant_id` int NOT NULL,
  `driver_id` int DEFAULT NULL,
  `voucher_id` int DEFAULT NULL,
  `receiver_address` text,
  `receiver_lat` double DEFAULT NULL,
  `receiver_lng` double DEFAULT NULL,
  `distance_km` double DEFAULT NULL,
  `subtotal_amount` decimal(10,2) DEFAULT NULL,
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `shipping_fee` decimal(10,2) DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) DEFAULT NULL,
  `status_id` int NOT NULL,
  `version` int NOT NULL DEFAULT '0',
  `cancel_reason` text,
  `cancelled_by_role` varchar(20) DEFAULT NULL,
  `cancelled_by_user_id` int DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `voucher_id` (`voucher_id`),
  KEY `idx_orders_customer_id` (`customer_id`),
  KEY `idx_orders_driver_id` (`driver_id`),
  KEY `idx_orders_restaurant_id` (`restaurant_id`),
  KEY `idx_orders_status_id` (`status_id`),
  KEY `idx_orders_order_code` (`order_code`),
  UNIQUE KEY `uniq_orders_idempotency_key` (`idempotency_key`),
  KEY `idx_orders_created_at` (`created_at`),
  KEY `idx_orders_cancelled_by_user_id` (`cancelled_by_user_id`),
  KEY `idx_orders_cancelled_at` (`cancelled_at`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`),
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`),
  CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`),
  CONSTRAINT `orders_ibfk_5` FOREIGN KEY (`status_id`) REFERENCES `order_statuses` (`id`),
  CONSTRAINT `orders_ibfk_6` FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `order_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `food_id` int NOT NULL,
  `food_name` varchar(255) NOT NULL,
  `quantity` int NOT NULL,
  `price_at_order` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order_id` (`order_id`),
  KEY `idx_order_items_food_id` (`food_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`food_id`) REFERENCES `food_items` (`id`),
  CONSTRAINT `order_items_chk_1` CHECK ((`quantity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `idempotency_key` varchar(100) NOT NULL,
  `payment_method` enum('CASH','E_WALLET','CREDIT_CARD') NOT NULL,
  `status` enum('PENDING','PROCESSING','SUCCESS','FAILED') DEFAULT 'PENDING',
  `amount` decimal(10,2) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`),
  UNIQUE KEY `idempotency_key` (`idempotency_key`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `payment_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `payment_id` bigint NOT NULL,
  `attempt_number` int NOT NULL DEFAULT '1',
  `status` enum('PENDING','PROCESSING','SUCCESS','FAILED','RETRYING') DEFAULT 'PENDING',
  `transaction_ref` varchar(100) DEFAULT NULL,
  `gateway_response` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payment_transactions_payment_id` (`payment_id`),
  CONSTRAINT `payment_transactions_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `order_status_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `previous_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) NOT NULL,
  `changed_by` int DEFAULT NULL,
  `reason` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `changed_by` (`changed_by`),
  KEY `idx_order_status_logs_order_id` (`order_id`),
  CONSTRAINT `order_status_logs_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_status_logs_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `driver_locations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `driver_id` int NOT NULL,
  `order_id` bigint DEFAULT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `heading` double NOT NULL DEFAULT '0',
  `speed_kmh` double NOT NULL DEFAULT '24',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_driver_locations_driver_id` (`driver_id`),
  KEY `idx_driver_locations_order_id` (`order_id`),
  KEY `idx_driver_locations_created_at` (`created_at`),
  CONSTRAINT `driver_locations_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `restaurant_change_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `restaurant_id` int NOT NULL,
  `requested_by` int NOT NULL,
  `payload` json NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `reject_reason` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `restaurant_id` (`restaurant_id`),
  KEY `requested_by` (`requested_by`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `restaurant_change_requests_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `restaurant_change_requests_ibfk_2` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `restaurant_change_requests_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `customer_id` int NOT NULL,
  `target_type` enum('RESTAURANT','DRIVER') NOT NULL,
  `target_id` int NOT NULL,
  `rating` tinyint DEFAULT NULL,
  `comment` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_order_target` (`order_id`,`target_type`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO roles (id, name) VALUES
(4, 'ADMIN'),
(1, 'CUSTOMER'),
(2, 'DRIVER'),
(3, 'MERCHANT');

INSERT INTO users (id, phone, password, full_name, rating_avg, created_at, deleted_at) VALUES
(1, '0900000001', '123456', 'Customer Demo', '4.80', '2026-06-10 08:08:00', NULL),
(2, '0900000002', '123456', 'Tran Thi B', '4.95', '2026-06-10 08:08:00', NULL),
(3, '0900000003', '123456', 'Le Van C', '4.70', '2026-06-10 08:08:00', NULL),
(4, '0900000004', '123456', 'Pham Thi D', '4.88', '2026-06-10 08:08:00', NULL),
(5, '0900000005', '123456', 'Admin User', '5.00', '2026-06-10 08:08:00', NULL),
(6, '0944495653', '123456', 'Huỳnh La Tiến Lộc', '5.00', '2026-06-10 01:32:08', NULL);

INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1),
(2, 2),
(4, 2),
(3, 3),
(6, 3),
(5, 4);

INSERT INTO driver_details (user_id, license_plate, id_card_number, vehicle_type, approval_status, reject_reason, is_online) VALUES
(2, '59A1-12345', '079123456789', 'Motorbike', 'APPROVED', NULL, 1),
(4, '51B2-67890', '079987654321', 'Motorbike', 'APPROVED', NULL, 0);

INSERT INTO merchant_details (user_id, business_license, tax_code) VALUES
(3, 'GPKD-123456789', 'MST-987654321'),
(6, 'GPKD-987654321', 'MST-123456789');

INSERT INTO system_settings (id, config_key, config_value, description) VALUES
(1, 'shipping_config', '{"base_km":2,"base_fee":15000,"extra_per_km":5000}', 'Shipping fee config'),
(2, 'tax_config', '{"vat_rate":0.08}', 'VAT config');

INSERT INTO vouchers (id, code, discount_amount, min_order_value, expiry_date, is_active) VALUES
(1, 'FREESHIP', '15000.00', '50000.00', '2026-12-31 16:59:59', 1);

INSERT INTO restaurants (id, owner_id, name, address, latitude, longitude, opening_time, closing_time, is_open, is_open_today, temporary_closed_reason, temporary_closed_until, image_url, rating_avg, approval_status, approved_by, approved_at, reject_reason, deleted_at) VALUES
(1, 3, 'Hanh Dung - Am Thuc Chay Man', '111-113 Au Co, P.14, Q.11', 10.771, 106.649, '07:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://example.com/merchant.jpg', '4.80', 'APPROVED', 5, '2026-06-10 08:08:00', NULL, NULL),
(2, 3, 'Quan Chay Thanh Ai', '264 Ba Hat, P.9, Q.10', 10.765, 106.671, '07:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/19/99/2f/11/getlstd-property-photo.jpg?w=1000&h=-1&s=1', '4.70', 'APPROVED', 5, '2026-06-10 08:08:00', NULL, NULL),
(3, 6, 'Cơm Tấm TL', '300A Phu chanh Phu Hung', 10.229067, 106.40525, '07:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://tse3.mm.bing.net/th/id/OIP.YO6ZnE23qqs6g_8FvlITewHaFS?rs=1&pid=ImgDetMain&o=7&rm=3', '5.00', 'APPROVED', 1, '2026-06-10 02:07:20', NULL, NULL),
(4, 3, 'Audit Restaurant 1781084623708', '123 Test St', 10.77, 106.69, '07:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://example.com/test.jpg', '5.00', 'APPROVED', 5, '2026-06-10 02:43:43', NULL, '2026-06-10 02:43:43'),
(5, 3, 'Audit Restaurant 1781084694966', '123 Test St', 10.77, 106.69, '07:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://example.com/test.jpg', '5.00', 'APPROVED', 5, '2026-06-10 02:44:54', NULL, '2026-06-10 02:44:54'),
(6, 3, 'Bep Nha Sai Gon', '25 Nguyen Trai, P. Ben Thanh, Q.1, TP.HCM', 10.7698, 106.6939, '06:30:00', '21:30:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5', '4.85', 'APPROVED', 5, '2026-06-11 08:00:00', NULL, NULL),
(7, 3, 'Bun Bo Co Hue', '88 Ly Thuong Kiet, P.7, Q.10, TP.HCM', 10.7721, 106.6578, '06:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec', '4.75', 'APPROVED', 5, '2026-06-11 08:00:00', NULL, NULL),
(8, 6, 'Tra Sua May Xanh', '145 Cach Mang Thang 8, P.5, Q.3, TP.HCM', 10.7824, 106.6841, '09:00:00', '23:00:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1558857563-b371033873b8', '4.60', 'APPROVED', 5, '2026-06-11 08:00:00', NULL, NULL),
(9, 6, 'Pizza Pho Mai 4P Mini', '17 Phan Xich Long, P.2, Q. Phu Nhuan, TP.HCM', 10.7993, 106.6865, '10:00:00', '22:30:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1513104890138-7c749659a591', '4.90', 'APPROVED', 5, '2026-06-11 08:00:00', NULL, NULL),
(10, 3, 'Ga Ran Gion Rum', '62 Le Van Sy, P.11, Q.3, TP.HCM', 10.7874, 106.6742, '09:30:00', '22:30:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1562967916-eb82221dfb92', '4.65', 'APPROVED', 5, '2026-06-11 08:00:00', NULL, NULL);

INSERT INTO categories (id, restaurant_id, name) VALUES
(1, 1, 'Mon chinh'),
(2, 1, 'Nuoc uong'),
(3, 2, 'Diem tam'),
(4, 2, 'Com tam'),
(5, 3, 'Món Chính'),
(8, 3, 'Mon Phu'),
(12, 6, 'Com nha lam'),
(13, 6, 'Canh va mon phu'),
(14, 6, 'Nuoc giai khat'),
(15, 7, 'Bun bo'),
(16, 7, 'Mon an kem'),
(17, 7, 'Nuoc uong'),
(18, 8, 'Tra sua'),
(19, 8, 'Tra trai cay'),
(20, 8, 'Topping'),
(21, 9, 'Pizza'),
(22, 9, 'Pasta'),
(23, 9, 'Khai vi'),
(24, 10, 'Ga ran'),
(25, 10, 'Burger'),
(26, 10, 'Combo');

INSERT INTO food_items (id, category_id, name, price, is_available, default_quantity, current_quantity, quantity_reset_date, deleted_at, image_url) VALUES
(1, 1, 'Com Tam Chay', '45000.00', 1, 40, 38, '2026-06-09 17:00:00', NULL, 'https://i.ytimg.com/vi/I7IO_xMc4yA/maxresdefault.jpg'),
(2, 2, 'Tra Da', '5000.00', 1, 120, 120, '2026-06-09 17:00:00', NULL, 'https://tse1.mm.bing.net/th/id/OIP.UmpBdKB2TIJmZIcyRXsY0AHaFj?rs=1&pid=ImgDetMain&o=7&rm=3'),
(3, 3, 'Hu Tieu Nam Vang', '55000.00', 1, 35, 35, '2026-06-09 17:00:00', NULL, 'https://tse3.mm.bing.net/th/id/OIP.geNSt6WrdCUaHKp_QuzPrgHaEL?rs=1&pid=ImgDetMain&o=7&rm=3'),
(4, 5, 'Cơm tấm Sườn', '30000.00', 1, 5, 3, '2026-06-09 17:00:00', NULL, 'https://asianinspirations.com.au/wp-content/uploads/2019/08/R01069_Com-Tam-3.jpg'),
(5, 5, 'Cơm Sườn Bì Chả', '45000.00', 1, 5, 3, '2026-06-09 17:00:00', NULL, 'https://asianinspirations.com.au/wp-content/uploads/2019/08/R01069_Com-Tam-3.jpg'),
(6, 5, 'Cơm Sườn Bì', '40000.00', 1, 10, 4, '2026-06-09 17:00:00', NULL, 'https://asianinspirations.com.au/wp-content/uploads/2019/08/R01069_Com-Tam-3.jpg'),
(7, 8, 'Chả', '10000.00', 1, 100, 5, '2026-06-09 17:00:00', NULL, 'https://th.bing.com/th/id/OSK.b0513d6867f39fd7cfc1e204f4dbc936?w=424&h=424&c=7&rs=1&qlt=90&o=6&pid=16.1'),
(11, 12, 'Com ga xoi mo', '52000.00', 1, 45, 45, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d'),
(12, 12, 'Com thit kho trung', '48000.00', 1, 40, 40, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'),
(13, 12, 'Com ca kho to', '55000.00', 1, 35, 35, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1512058564366-18510be2db19'),
(14, 12, 'Com bo luc lac', '68000.00', 1, 30, 30, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1544025162-d76694265947'),
(15, 13, 'Canh chua ca loc', '39000.00', 1, 25, 25, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1547592180-85f173990554'),
(16, 13, 'Rau muong xao toi', '28000.00', 1, 35, 35, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd'),
(17, 14, 'Tra tac mat ong', '18000.00', 1, 80, 80, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1497534446932-c925b458314e'),
(18, 14, 'Nuoc mia tac', '15000.00', 1, 90, 90, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8'),
(19, 15, 'Bun bo dac biet', '65000.00', 1, 50, 50, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1555126634-323283e090fa'),
(20, 15, 'Bun bo gio heo', '59000.00', 1, 45, 45, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624'),
(21, 15, 'Bun bo tai nam', '62000.00', 1, 45, 45, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092'),
(22, 16, 'Cha cua them', '18000.00', 1, 60, 60, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1529042410759-befb1204b468'),
(23, 16, 'Quay nong', '8000.00', 1, 100, 100, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1509440159596-0249088772ff'),
(24, 17, 'Sua dau nanh', '12000.00', 1, 80, 80, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc'),
(25, 18, 'Tra sua tran chau duong den', '39000.00', 1, 70, 70, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1558857563-b371033873b8'),
(26, 18, 'Tra sua oolong kem cheese', '42000.00', 1, 65, 65, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054'),
(27, 18, 'Matcha latte tran chau', '45000.00', 1, 55, 55, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7'),
(28, 19, 'Tra dao cam sa', '35000.00', 1, 70, 70, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc'),
(29, 19, 'Tra vai hat chia', '36000.00', 1, 70, 70, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1544145945-f90425340c7e'),
(30, 20, 'Tran chau den', '7000.00', 1, 120, 120, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e'),
(31, 20, 'Thach pho mai', '9000.00', 1, 100, 100, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1551024601-bec78aea704b'),
(32, 21, 'Pizza hai san', '129000.00', 1, 25, 25, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1513104890138-7c749659a591'),
(33, 21, 'Pizza pepperoni', '119000.00', 1, 30, 30, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1628840042765-356cda07504e'),
(34, 21, 'Pizza bo bam pho mai', '139000.00', 1, 25, 25, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1594007654729-407eedc4be65'),
(35, 22, 'Mi y sot bo bam', '79000.00', 1, 30, 30, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141'),
(36, 22, 'Carbonara thit xong khoi', '85000.00', 1, 30, 30, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9'),
(37, 23, 'Khoai tay chien', '39000.00', 1, 60, 60, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1576107232684-1279f390859f'),
(38, 23, 'Salad caesar', '49000.00', 1, 35, 35, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd'),
(39, 24, 'Ga ran truyen thong 2 mieng', '59000.00', 1, 50, 50, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1562967916-eb82221dfb92'),
(40, 24, 'Ga sot cay Han Quoc', '69000.00', 1, 45, 45, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58'),
(41, 24, 'Canh ga chien mam', '55000.00', 1, 50, 50, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1527477396000-e27163b481c2'),
(42, 25, 'Burger ga gion', '49000.00', 1, 40, 40, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd'),
(43, 25, 'Burger bo pho mai', '59000.00', 1, 35, 35, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1550547660-d9450f859349'),
(44, 26, 'Combo ga ran burger nuoc', '99000.00', 1, 30, 30, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b'),
(45, 26, 'Combo gia dinh 6 mieng ga', '189000.00', 1, 20, 20, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f');

INSERT INTO order_statuses (id, code, label, description, sort_order) VALUES
(1, 'PENDING', 'Cho xac nhan', NULL, 1),
(2, 'DRIVER_ACCEPTED', 'Tai xe da nhan', NULL, 2),
(3, 'DRIVER_REJECTED', 'Tai xe tu choi', NULL, 3),
(4, 'CONFIRMED', 'Da xac nhan', NULL, 4),
(5, 'PICKING_UP', 'Dang lay hang', NULL, 5),
(6, 'DELIVERING', 'Dang giao hang', NULL, 6),
(7, 'COMPLETED', 'Hoan thanh', NULL, 7),
(8, 'CANCELLED', 'Da huy', NULL, 8),
(9, 'TIMEOUT', 'Qua thoi gian', NULL, 9);

INSERT INTO orders (id, order_code, idempotency_key, customer_id, restaurant_id, driver_id, voucher_id, receiver_address, receiver_lat, receiver_lng, distance_km, subtotal_amount, tax_amount, shipping_fee, discount_amount, total_amount, status_id, version, deleted_at, created_at) VALUES
(1, 'ORD-20260324-001', 'IDEM-CLIENT-20260324-UUID-001', 1, 1, 2, 1, '12 Nguyen Hue, Quan 1', 10.7769, 106.7009, 3.2, '95000.00', '7600.00', '21000.00', '15000.00', '108600.00', 7, 1, NULL, '2026-03-24 03:00:00'),
(2, 'ORD-20260610-1781084623774', 'audit-1781084623757', 1, 1, NULL, NULL, '1 Test Address', 10.78, 106.7, 2, '45000.00', '0.00', '7000.00', '0.00', '52000.00', 1, 0, NULL, '2026-06-10 02:43:43'),
(3, 'ORD-20260610-1781084695040', 'audit-1781084695019', 1, 1, NULL, NULL, '1 Test Address', 10.78, 106.7, 2, '45000.00', '0.00', '7000.00', '0.00', '52000.00', 1, 0, NULL, '2026-06-10 02:44:55');

INSERT INTO order_items (id, order_id, food_id, food_name, quantity, price_at_order) VALUES
(1, 1, 1, 'Com Tam Chay', 2, '45000.00'),
(2, 1, 2, 'Tra Da', 1, '5000.00'),
(3, 2, 1, 'Com Tam Chay', 1, '45000.00'),
(4, 3, 1, 'Com Tam Chay', 1, '45000.00');

INSERT INTO payments (id, order_id, idempotency_key, payment_method, status, amount, created_at, updated_at) VALUES
(1, 1, 'PAY-IDEM-20260324-001', 'E_WALLET', 'SUCCESS', '108600.00', '2026-06-10 08:08:00', '2026-06-10 08:08:00'),
(2, 3, 'pay-1781084695071', 'E_WALLET', 'PENDING', '52000.00', '2026-06-10 02:44:55', '2026-06-10 02:44:55');

INSERT INTO payment_transactions (id, payment_id, attempt_number, status, transaction_ref, gateway_response, created_at, updated_at) VALUES
(1, 1, 1, 'SUCCESS', 'MOMO-9988776655', '{"code":"0","message":"Thanh cong"}', '2026-06-10 08:08:00', '2026-06-10 08:08:00');

INSERT INTO order_status_logs (id, order_id, previous_status, new_status, changed_by, reason, created_at) VALUES
(1, 1, 'DELIVERING', 'COMPLETED', 2, 'Giao hang thanh cong', '2026-06-10 08:08:00');

INSERT INTO driver_locations (id, driver_id, order_id, latitude, longitude, heading, speed_kmh, created_at) VALUES
(1, 2, 1, 10.771, 106.649, 90, 24, '2026-06-10 08:08:00'),
(2, 2, NULL, 10.7757, 106.6868, 90, 24, '2026-06-10 08:09:00');

INSERT INTO restaurant_change_requests (id, restaurant_id, requested_by, payload, status, reviewed_by, reviewed_at, reject_reason, created_at) VALUES
(1, 1, 1, '{"name":"Hanh Dung - Am Thuc Chay Man","address":"111-113 Au Co, P.14, Q.11","ownerId":5,"imageUrl":null,"latitude":10.771,"longitude":106.649,"ratingAvg":4.8}', 'PENDING', NULL, NULL, NULL, '2026-06-10 01:53:52'),
(2, 3, 1, '{"name":"Cơm Tấm TL","address":"300A Phu chanh Phu Hung","ownerId":6,"imageUrl":"https://tse3.mm.bing.net/th/id/OIP.YO6ZnE23qqs6g_8FvlITewHaFS?rs=1&pid=ImgDetMain&o=7&rm=3","latitude":10.229067,"longitude":106.40525,"ratingAvg":5}', 'PENDING', NULL, NULL, NULL, '2026-06-10 02:00:21'),
(3, 2, 1, '{"name":"Quan Chay Thanh Ai","address":"264 Ba Hat, P.9, Q.10","ownerId":3,"imageUrl":null,"latitude":10.765,"longitude":106.671,"ratingAvg":4.7}', 'PENDING', NULL, NULL, NULL, '2026-06-10 02:04:21');

INSERT INTO reviews (id, order_id, customer_id, target_type, target_id, rating, comment, created_at) VALUES
(1, 1, 1, 'RESTAURANT', 1, 5, 'Com tam rat ngon', '2026-06-10 08:08:00'),
(2, 1, 1, 'DRIVER', 2, 5, 'Tai xe giao nhanh', '2026-06-10 08:08:00');

SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;
