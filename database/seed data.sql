-- =================================================================================
-- GRABFOOD_DB - SEED DATA (MICROSERVICES DECOUPLED SCHEMA)
-- Version: 4.0.0 (Decoupled Logical Foreign Keys Architecture)
-- =================================================================================

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

-- =================================================================================
-- 1. AUTH-SERVICE DOMAIN
-- =================================================================================

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

-- [Logical FK]: user_id trỏ sang auth-service: users.id
CREATE TABLE `driver_details` (
  `user_id` int NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `license_plate` varchar(20) DEFAULT NULL,
  `id_card_number` varchar(20) DEFAULT NULL,
  `vehicle_type` varchar(50) DEFAULT NULL,
  `approval_status` varchar(20) DEFAULT 'PENDING',
  `reject_reason` text,
  `is_online` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`user_id`)
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

-- =================================================================================
-- 2. RESTAURANT-SERVICE DOMAIN
-- =================================================================================

CREATE TABLE `voucher_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_voucher_categories_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `vouchers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `restaurant_id` int DEFAULT NULL,
  `voucher_category` varchar(50) NOT NULL DEFAULT 'DISCOUNT_FOOD',
  `code` varchar(20) NOT NULL,
  `discount_type` varchar(20) NOT NULL DEFAULT 'FIXED',
  `discount_value` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `max_discount_amount` decimal(10,2) DEFAULT NULL,
  `min_order_value` decimal(10,2) DEFAULT '0.00',
  `usage_limit` int DEFAULT NULL,
  `used_count` int NOT NULL DEFAULT '0',
  `start_date` datetime DEFAULT NULL,
  `expiry_date` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_vouchers_restaurant_id` (`restaurant_id`),
  KEY `idx_vouchers_category` (`voucher_category`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- [Logical FK]: owner_id, approved_by trỏ sang auth-service
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
  KEY `approved_by` (`approved_by`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- [Physical FK]: restaurant_id nội bộ
-- [Logical FK]: requested_by, reviewed_by trỏ sang auth-service
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
  CONSTRAINT `restaurant_change_requests_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

-- =================================================================================
-- 3. ORDER-SERVICE DOMAIN
-- =================================================================================

CREATE TABLE `order_statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `label` varchar(100) DEFAULT NULL,
  `description` text,
  `sort_order` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- [Logical FK]: customer_id, restaurant_id, driver_id, voucher_id, cancelled_by_user_id
-- [Physical FK]: status_id nội bộ
CREATE TABLE `orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_code` varchar(50) NOT NULL,
  `idempotency_key` varchar(100) NOT NULL,
  `customer_id` int NOT NULL,
  `restaurant_id` int NOT NULL,
  `driver_id` int DEFAULT NULL,
  `voucher_id` int DEFAULT NULL,
  `voucher_code` varchar(30) DEFAULT NULL,
  `system_voucher_id` int DEFAULT NULL,
  `system_voucher_code` varchar(30) DEFAULT NULL,
  `receiver_address` text,
  `receiver_lat` double DEFAULT NULL,
  `receiver_lng` double DEFAULT NULL,
  `distance_km` double DEFAULT NULL,
  `subtotal_amount` decimal(10,2) DEFAULT NULL,
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `shipping_fee` decimal(10,2) DEFAULT NULL,
  `shipping_discount_amount` decimal(10,2) DEFAULT '0.00',
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
  CONSTRAINT `orders_ibfk_5` FOREIGN KEY (`status_id`) REFERENCES `order_statuses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- [Logical FK]: food_id trỏ sang restaurant-service
-- [Physical FK]: order_id nội bộ
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
  CONSTRAINT `order_items_chk_1` CHECK ((`quantity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- [Logical FK]: changed_by trỏ sang auth-service
-- [Physical FK]: order_id nội bộ
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
  CONSTRAINT `order_status_logs_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =================================================================================
-- 4. DELIVERY-SERVICE DOMAIN
-- =================================================================================

-- [Logical FK]: driver_id, order_id
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
  KEY `idx_driver_locations_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =================================================================================
-- 5. PAYMENT-SERVICE DOMAIN
-- =================================================================================

-- [Logical FK]: order_id
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
  UNIQUE KEY `idempotency_key` (`idempotency_key`)
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

-- =================================================================================
-- 6. REVIEW-SERVICE DOMAIN
-- =================================================================================

-- [Logical FK]: order_id, customer_id
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
  KEY `idx_reviews_order_id` (`order_id`),
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =================================================================================
-- 7. INITIAL SEED DATA
-- =================================================================================

INSERT INTO roles (id, name) VALUES
(4, 'ADMIN'),
(1, 'CUSTOMER'),
(2, 'DRIVER'),
(3, 'MERCHANT');

INSERT INTO users (id, phone, password, full_name, rating_avg, created_at, deleted_at) VALUES
(1, '0900000001', '$2a$10$tFzqYb.rxAZWJ4ggv1I2XOnr1zkXQDmXoI48V5TxspPkr93B33F6a', 'Nguyễn Văn An', '4.80', '2026-06-10 08:08:00', NULL),
(2, '0900000002', '$2a$10$5WGj8RuHVMH4FwpZkTSkGOssJKqG6oefZLlpzM8kkjgWclazmcttO', 'Trần Thị Bích', '4.95', '2026-06-10 08:08:00', NULL),
(3, '0900000003', '$2a$10$CmbVVephSjEcxKDbxtsbG.2/nQ0q9.poRcUsCIPDxpf20nIheLWle', 'Lê Văn Cường', '4.70', '2026-06-10 08:08:00', NULL),
(4, '0900000004', '$2a$10$DnzFJhBXWPHqNyHgpceR2.7LG4yNcJK4.dxswiFV5We.pee7RD8qG', 'Phạm Thị Dung', '4.88', '2026-06-10 08:08:00', NULL),
(5, '0900000000', '$2a$10$TP0RsDH.JXTLrDqcrg9fwe5XGxEgGRyYXxgCWztamYLIl1URYiNfO', 'Quản Trị Viên Hệ Thống', '5.00', '2026-06-10 08:08:00', NULL),
(6, '0944495653', '$2a$10$ExCfal4mIKRCNd8Q/4apLedkozCHtu5zfIqCZI2SxKUJyd9yTOxLi', 'Huỳnh La Tiến Lộc', '5.00', '2026-06-10 01:32:08', NULL);

INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1),
(2, 2),
(4, 2),
(3, 3),
(6, 3),
(5, 4);

INSERT INTO driver_details (user_id, full_name, phone_number, email, license_plate, id_card_number, vehicle_type, approval_status, reject_reason, is_online) VALUES
(2, 'Trần Thị Bích', '0900000002', 'driver.b@foodthunder.com', '59A1-12345', '079123456789', 'Xe máy số', 'APPROVED', NULL, 1),
(4, 'Phạm Thị Dung', '0900000004', 'driver.d@foodthunder.com', '51B2-67890', '079987654321', 'Xe máy tay ga', 'APPROVED', NULL, 0);

INSERT INTO merchant_details (user_id, business_license, tax_code) VALUES
(3, 'GPKD-123456789', 'MST-987654321'),
(6, 'GPKD-987654321', 'MST-123456789');

INSERT INTO system_settings (id, config_key, config_value, description) VALUES
(1, 'shipping_config', '{"base_km":2,"base_fee":15000,"extra_per_km":5000}', 'Cấu hình tính phí giao hàng'),
(2, 'tax_config', '{"vat_rate":0.08}', 'Cấu hình thuế VAT');

INSERT INTO voucher_categories (id, code, name, description, is_active) VALUES
(1, 'FREESHIP', 'Miễn phí vận chuyển', 'Mã ưu đãi giảm trực tiếp vào phí giao hàng', 1),
(2, 'DISCOUNT_FOOD', 'Giảm giá món ăn', 'Mã giảm giá áp dụng cho giá trị món ăn', 1),
(3, 'NEW_USER', 'Khách hàng mới', 'Mã khuyến mãi cho đơn hàng đầu tiên', 1);

INSERT INTO vouchers (id, restaurant_id, voucher_category, code, discount_type, discount_value, discount_amount, min_order_value, expiry_date, is_active) VALUES
(1, NULL, 'FREESHIP', 'FREESHIP', 'FIXED', '15000.00', '15000.00', '50000.00', '2026-12-31 16:59:59', 1);

INSERT INTO restaurants (id, owner_id, name, address, latitude, longitude, opening_time, closing_time, is_open, is_open_today, temporary_closed_reason, temporary_closed_until, image_url, rating_avg, approval_status, approved_by, approved_at, reject_reason, deleted_at) VALUES
(1, 3, 'Hạnh Dung - Ẩm Thực Chay Mặn', '111-113 Âu Cơ, Phường 14, Quận 11, TP.HCM', 10.771, 106.649, '07:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5', '4.80', 'APPROVED', 5, '2026-06-10 08:08:00', NULL, NULL),
(2, 3, 'Quán Chay Thanh Ái', '264 Bà Hạt, Phường 9, Quận 10, TP.HCM', 10.765, 106.671, '07:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/19/99/2f/11/getlstd-property-photo.jpg?w=1000&h=-1&s=1', '4.70', 'APPROVED', 5, '2026-06-10 08:08:00', NULL, NULL),
(3, 6, 'Cơm Tấm Tiến Lộc', '300A Phú Chánh, Xã Phú Hưng, TP. Bến Tre', 10.229067, 106.40525, '07:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://tse3.mm.bing.net/th/id/OIP.YO6ZnE23qqs6g_8FvlITewHaFS?rs=1&pid=ImgDetMain&o=7&rm=3', '5.00', 'APPROVED', 1, '2026-06-10 02:07:20', NULL, NULL),
(4, 3, 'Cơm Niêu Sài Gòn Xưa', '123 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP.HCM', 10.77, 106.69, '07:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', '5.00', 'APPROVED', 5, '2026-06-10 02:43:43', NULL, '2026-06-10 02:43:43'),
(5, 3, 'Phở Thìn Lò Đúc', '45 Đinh Tiên Hoàng, Phường Đa Kao, Quận 1, TP.HCM', 10.77, 106.69, '07:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1552566626-52f8b828add9', '5.00', 'APPROVED', 5, '2026-06-10 02:44:54', NULL, '2026-06-10 02:44:54'),
(6, 3, 'Bếp Nhà Sài Gòn', '25 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM', 10.7698, 106.6939, '06:30:00', '21:30:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5', '4.85', 'APPROVED', 5, '2026-06-11 08:00:00', NULL, NULL),
(7, 3, 'Bún Bò Cố Đô Huế', '88 Lý Thường Kiệt, Phường 7, Quận 10, TP.HCM', 10.7721, 106.6578, '06:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec', '4.75', 'APPROVED', 5, '2026-06-11 08:00:00', NULL, NULL),
(8, 6, 'Trà Sữa Mây Xanh', '145 Cách Mạng Tháng 8, Phường 5, Quận 3, TP.HCM', 10.7824, 106.6841, '09:00:00', '23:00:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1558857563-b371033873b8', '4.60', 'APPROVED', 5, '2026-06-11 08:00:00', NULL, NULL),
(9, 6, 'Pizza Phô Mai 4P Mini', '17 Phan Xích Long, Phường 2, Quận Phú Nhuận, TP.HCM', 10.7993, 106.6865, '10:00:00', '22:30:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1513104890138-7c749659a591', '4.90', 'APPROVED', 5, '2026-06-11 08:00:00', NULL, NULL),
(10, 3, 'Gà Rán Giòn Rụm', '62 Lê Văn Sỹ, Phường 11, Quận 3, TP.HCM', 10.7874, 106.6742, '09:30:00', '22:30:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1562967916-eb82221dfb92', '4.65', 'APPROVED', 5, '2026-06-11 08:00:00', NULL, NULL);

INSERT INTO categories (id, restaurant_id, name) VALUES
(1, 1, 'Món chính'),
(2, 1, 'Nước uống'),
(3, 2, 'Điểm tâm'),
(4, 2, 'Cơm tấm chay'),
(5, 3, 'Món chính'),
(8, 3, 'Món phụ & Canh'),
(12, 6, 'Cơm nhà làm'),
(13, 6, 'Canh và món phụ'),
(14, 6, 'Nước giải khát'),
(15, 7, 'Bún bò Huế'),
(16, 7, 'Món ăn kèm'),
(17, 7, 'Nước uống'),
(18, 8, 'Trà sữa đặc biệt'),
(19, 8, 'Trà trái cây tươi'),
(20, 8, 'Topping thêm'),
(21, 9, 'Pizza đút lò'),
(22, 9, 'Mì Ý & Pasta'),
(23, 9, 'Món khai vị'),
(24, 10, 'Gà rán giòn rụm'),
(25, 10, 'Burger đậm vị'),
(26, 10, 'Combo siêu tiết kiệm');

INSERT INTO food_items (id, category_id, name, price, is_available, default_quantity, current_quantity, quantity_reset_date, deleted_at, image_url) VALUES
(1, 1, 'Cơm tấm sườn bì chả chay', '45000.00', 1, 40, 38, '2026-06-09 17:00:00', NULL, 'https://i.ytimg.com/vi/I7IO_xMc4yA/maxresdefault.jpg'),
(2, 2, 'Trà đá giải nhiệt', '5000.00', 1, 120, 120, '2026-06-09 17:00:00', NULL, 'https://tse1.mm.bing.net/th/id/OIP.UmpBdKB2TIJmZIcyRXsY0AHaFj?rs=1&pid=ImgDetMain&o=7&rm=3'),
(3, 3, 'Hủ tiếu Nam Vang chay đặc biệt', '55000.00', 1, 35, 35, '2026-06-09 17:00:00', NULL, 'https://tse3.mm.bing.net/th/id/OIP.geNSt6WrdCUaHKp_QuzPrgHaEL?rs=1&pid=ImgDetMain&o=7&rm=3'),
(4, 5, 'Cơm tấm sườn nướng mật ong', '30000.00', 1, 5, 3, '2026-06-09 17:00:00', NULL, 'https://asianinspirations.com.au/wp-content/uploads/2019/08/R01069_Com-Tam-3.jpg'),
(5, 5, 'Cơm tấm sườn bì chả đặc biệt', '45000.00', 1, 5, 3, '2026-06-09 17:00:00', NULL, 'https://asianinspirations.com.au/wp-content/uploads/2019/08/R01069_Com-Tam-3.jpg'),
(6, 5, 'Cơm tấm sườn bì', '40000.00', 1, 10, 4, '2026-06-09 17:00:00', NULL, 'https://asianinspirations.com.au/wp-content/uploads/2019/08/R01069_Com-Tam-3.jpg'),
(7, 8, 'Chả trứng hấp thêm', '10000.00', 1, 100, 5, '2026-06-09 17:00:00', NULL, 'https://th.bing.com/th/id/OSK.b0513d6867f39fd7cfc1e204f4dbc936?w=424&h=424&c=7&rs=1&qlt=90&o=6&pid=16.1'),
(11, 12, 'Cơm gà xối mỡ giòn da', '52000.00', 1, 45, 45, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d'),
(12, 12, 'Cơm thịt kho trứng cút đậm đà', '48000.00', 1, 40, 40, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'),
(13, 12, 'Cơm cá ba sa kho tộ', '55000.00', 1, 35, 35, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1512058564366-18510be2db19'),
(14, 12, 'Cơm bò lúc lắc khoai tây', '68000.00', 1, 30, 30, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1544025162-d76694265947'),
(15, 13, 'Canh chua cá lóc Nam Bộ', '39000.00', 1, 25, 25, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1547592180-85f173990554'),
(16, 13, 'Rau muống xào tỏi xanh giòn', '28000.00', 1, 35, 35, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd'),
(17, 14, 'Trà tắc mật ong hoa nhài', '18000.00', 1, 80, 80, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1497534446932-c925b458314e'),
(18, 14, 'Nước mía tắc tươi siêu sạch', '15000.00', 1, 90, 90, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8'),
(19, 15, 'Bún bò Huế đặc biệt thập cẩm', '65000.00', 1, 50, 50, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1555126634-323283e090fa'),
(20, 15, 'Bún bò giò heo hầm mềm', '59000.00', 1, 45, 45, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624'),
(21, 15, 'Bún bò tái nạm giòn', '62000.00', 1, 45, 45, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092'),
(22, 16, 'Chả cua Huế hấp thêm', '18000.00', 1, 60, 60, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1529042410759-befb1204b468'),
(23, 16, 'Quẩy nóng vàng giòn', '8000.00', 1, 100, 100, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1509440159596-0249088772ff'),
(24, 17, 'Sữa đậu nành nguyên chất', '12000.00', 1, 80, 80, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc'),
(25, 18, 'Trà sữa trân châu đường đen', '39000.00', 1, 70, 70, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1558857563-b371033873b8'),
(26, 18, 'Trà sữa Ô Long kem cheese', '42000.00', 1, 65, 65, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054'),
(27, 18, 'Matcha latte trân châu', '45000.00', 1, 55, 55, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7'),
(28, 19, 'Trà đào cam sả thanh nhiệt', '35000.00', 1, 70, 70, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc'),
(29, 19, 'Trà vải hạt chia giải khát', '36000.00', 1, 70, 70, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1544145945-f90425340c7e'),
(30, 20, 'Trân châu đen dẻo dai', '7000.00', 1, 120, 120, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e'),
(31, 20, 'Thạch phô mai tươi', '9000.00', 1, 100, 100, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1551024601-bec78aea704b'),
(32, 21, 'Pizza hải sản sốt Pesto', '129000.00', 1, 25, 25, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1513104890138-7c749659a591'),
(33, 21, 'Pizza pepperoni', '119000.00', 1, 30, 30, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1628840042765-356cda07504e'),
(34, 21, 'Pizza bò bằm phô mai đút lò', '139000.00', 1, 25, 25, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1594007654729-407eedc4be65'),
(35, 22, 'Mì Ý sốt bò bằm Bolognese', '79000.00', 1, 30, 30, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141'),
(36, 22, 'Mì Ý Carbonara thịt xông khói', '85000.00', 1, 30, 30, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9'),
(37, 23, 'Khoai tây chiên giòn lắc phô mai', '39000.00', 1, 60, 60, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1576107232684-1279f390859f'),
(38, 23, 'Salad Caesar rau củ tươi', '49000.00', 1, 35, 35, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd'),
(39, 24, 'Gà rán truyền thống giòn rụm (2 miếng)', '59000.00', 1, 50, 50, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1562967916-eb82221dfb92'),
(40, 24, 'Gà rán sốt cay ngọt Hàn Quốc', '69000.00', 1, 45, 45, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58'),
(41, 24, 'Cánh gà chiên nước mắm tỏi ớt', '55000.00', 1, 50, 50, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1527477396000-e27163b481c2'),
(42, 25, 'Burger phi lê gà giòn cay', '49000.00', 1, 40, 40, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd'),
(43, 25, 'Burger bò Úc nướng phô mai', '59000.00', 1, 35, 35, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1550547660-d9450f859349'),
(44, 26, 'Combo 1 gà rán + 1 burger + 1 Coca', '99000.00', 1, 30, 30, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b'),
(45, 26, 'Combo gia đình (6 miếng gà + khoai + 2 Coca)', '189000.00', 1, 20, 20, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f');

INSERT INTO order_statuses (id, code, label, description, sort_order) VALUES
(1, 'PENDING', 'Chờ xác nhận', 'Đơn hàng vừa được tạo, đang chờ xử lý', 1),
(2, 'DRIVER_ACCEPTED', 'Tài xế đã nhận', 'Tài xế đã chấp nhận cuốc xe', 2),
(3, 'DRIVER_REJECTED', 'Tài xế từ chối', 'Tài xế đã từ chối nhận đơn', 3),
(4, 'CONFIRMED', 'Đã xác nhận', 'Quán đã xác nhận và đang chế biến món ăn', 4),
(5, 'PICKING_UP', 'Đang lấy hàng', 'Tài xế đang di chuyển tới quán lấy món', 5),
(6, 'DELIVERING', 'Đang giao hàng', 'Tài xế đang trên đường giao tới người nhận', 6),
(7, 'COMPLETED', 'Hoàn thành', 'Giao hàng và thanh toán thành công', 7),
(8, 'CANCELLED', 'Đã huỷ', 'Đơn hàng đã bị huỷ', 8),
(9, 'TIMEOUT', 'Quá thời gian', 'Quá thời hạn tiếp nhận đơn', 9);

INSERT INTO orders (id, order_code, idempotency_key, customer_id, restaurant_id, driver_id, voucher_id, receiver_address, receiver_lat, receiver_lng, distance_km, subtotal_amount, tax_amount, shipping_fee, discount_amount, total_amount, status_id, version, deleted_at, created_at) VALUES
(1, 'ORD-20260324-001', 'IDEM-CLIENT-20260324-UUID-001', 1, 1, 2, 1, '12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM', 10.7769, 106.7009, 3.2, '95000.00', '7600.00', '21000.00', '15000.00', '108600.00', 7, 1, NULL, '2026-03-24 03:00:00'),
(2, 'ORD-20260610-1781084623774', 'audit-1781084623757', 1, 1, NULL, NULL, '144 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội', 10.78, 106.7, 2, '45000.00', '0.00', '7000.00', '0.00', '52000.00', 1, 0, NULL, '2026-06-10 02:43:43'),
(3, 'ORD-20260610-1781084695040', 'audit-1781084695019', 1, 1, NULL, NULL, '144 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội', 10.78, 106.7, 2, '45000.00', '0.00', '7000.00', '0.00', '52000.00', 1, 0, NULL, '2026-06-10 02:44:55');

INSERT INTO order_items (id, order_id, food_id, food_name, quantity, price_at_order) VALUES
(1, 1, 1, 'Cơm tấm sườn bì chả chay', 2, '45000.00'),
(2, 1, 2, 'Trà đá giải nhiệt', 1, '5000.00'),
(3, 2, 1, 'Cơm tấm sườn bì chả chay', 1, '45000.00'),
(4, 3, 1, 'Cơm tấm sườn bì chả chay', 1, '45000.00');

INSERT INTO payments (id, order_id, idempotency_key, payment_method, status, amount, created_at, updated_at) VALUES
(1, 1, 'PAY-IDEM-20260324-001', 'E_WALLET', 'SUCCESS', '108600.00', '2026-06-10 08:08:00', '2026-06-10 08:08:00'),
(2, 3, 'pay-1781084695071', 'E_WALLET', 'PENDING', '52000.00', '2026-06-10 02:44:55', '2026-06-10 02:44:55');

INSERT INTO payment_transactions (id, payment_id, attempt_number, status, transaction_ref, gateway_response, created_at, updated_at) VALUES
(1, 1, 1, 'SUCCESS', 'MOMO-9988776655', '{"code":"0","message":"Thanh toán thành công"}', '2026-06-10 08:08:00', '2026-06-10 08:08:00');

INSERT INTO order_status_logs (id, order_id, previous_status, new_status, changed_by, reason, created_at) VALUES
(1, 1, 'DELIVERING', 'COMPLETED', 2, 'Giao hàng thành công', '2026-06-10 08:08:00');

INSERT INTO driver_locations (id, driver_id, order_id, latitude, longitude, heading, speed_kmh, created_at) VALUES
(1, 2, 1, 10.771, 106.649, 90, 24, '2026-06-10 08:08:00'),
(2, 2, NULL, 10.7757, 106.6868, 90, 24, '2026-06-10 08:09:00');

INSERT INTO restaurant_change_requests (id, restaurant_id, requested_by, payload, status, reviewed_by, reviewed_at, reject_reason, created_at) VALUES
(1, 1, 1, '{"name":"Hạnh Dung - Ẩm Thực Chay Mặn","address":"111-113 Âu Cơ, Phường 14, Quận 11, TP.HCM","ownerId":5,"imageUrl":null,"latitude":10.771,"longitude":106.649,"ratingAvg":4.8}', 'PENDING', NULL, NULL, NULL, '2026-06-10 01:53:52'),
(2, 3, 1, '{"name":"Cơm Tấm Tiến Lộc","address":"300A Phú Chánh, Xã Phú Hưng, TP. Bến Tre","ownerId":6,"imageUrl":"https://tse3.mm.bing.net/th/id/OIP.YO6ZnE23qqs6g_8FvlITewHaFS?rs=1&pid=ImgDetMain&o=7&rm=3","latitude":10.229067,"longitude":106.40525,"ratingAvg":5}', 'PENDING', NULL, NULL, NULL, '2026-06-10 02:00:21'),
(3, 2, 1, '{"name":"Quán Chay Thanh Ái","address":"264 Bà Hạt, Phường 9, Quận 10, TP.HCM","ownerId":3,"imageUrl":null,"latitude":10.765,"longitude":106.671,"ratingAvg":4.7}', 'PENDING', NULL, NULL, NULL, '2026-06-10 02:04:21');

INSERT INTO reviews (id, order_id, customer_id, target_type, target_id, rating, comment, created_at) VALUES
(1, 1, 1, 'RESTAURANT', 1, 5, 'Món ăn ngon miệng, đóng gói sạch sẽ và cẩn thận!', '2026-06-10 08:08:00'),
(2, 1, 1, 'DRIVER', 2, 5, 'Tài xế lịch sự, giao hàng nhanh chóng và còn nóng hổi.', '2026-06-10 08:08:00');

SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;
