-- =================================================================================
-- GRABFOOD_DB - PRODUCTION BACKUP & SEED SCRIPT (Spring Boot 3 + MySQL 8)
-- Version: 3.0.0
-- Generated: 2026-10-22
-- Compatible with: Spring Boot 3.3.5 JPA Entities, React 19 Frontend, Docker Compose
-- Character Set: utf8mb4 / Collation: utf8mb4_unicode_ci
-- =================================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `grabfood_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `grabfood_db`;

-- ---------------------------------------------------------------------------------
-- DROP EXISTING TABLES IN REVERSE DEPENDENCY ORDER
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `chat_messages`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `driver_penalties`;
DROP TABLE IF EXISTS `driver_offers`;
DROP TABLE IF EXISTS `driver_locations`;
DROP TABLE IF EXISTS `order_status_logs`;
DROP TABLE IF EXISTS `payment_transactions`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `order_item_toppings`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `order_statuses`;
DROP TABLE IF EXISTS `food_toppings`;
DROP TABLE IF EXISTS `toppings`;
DROP TABLE IF EXISTS `food_items`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `restaurant_change_requests`;
DROP TABLE IF EXISTS `restaurants`;
DROP TABLE IF EXISTS `vouchers`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `user_addresses`;
DROP TABLE IF EXISTS `merchant_details`;
DROP TABLE IF EXISTS `driver_details`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `users`;

-- =================================================================================
-- 1. CORE AUTHENTICATION & RBAC (roles, users, user_roles, user_addresses)
-- =================================================================================

CREATE TABLE `roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `phone` VARCHAR(15) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) DEFAULT NULL,
  `rating_avg` DECIMAL(3,2) DEFAULT '5.00',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_roles` (
  `user_id` INT NOT NULL,
  `role_id` INT NOT NULL,
  PRIMARY KEY (`user_id`, `role_id`),
  KEY `idx_user_roles_role_id` (`role_id`),
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_addresses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `latitude` DOUBLE DEFAULT NULL,
  `longitude` DOUBLE DEFAULT NULL,
  `is_default` TINYINT(1) DEFAULT '0',
  `label` VARCHAR(50) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_addresses_user_id` (`user_id`),
  CONSTRAINT `fk_user_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `driver_details` (
  `user_id` INT NOT NULL,
  `license_plate` VARCHAR(20) DEFAULT NULL,
  `id_card_number` VARCHAR(20) DEFAULT NULL,
  `vehicle_type` VARCHAR(50) DEFAULT NULL,
  `approval_status` VARCHAR(20) DEFAULT 'PENDING',
  `reject_reason` TEXT,
  `is_online` TINYINT(1) DEFAULT '0',
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_driver_details_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `merchant_details` (
  `user_id` INT NOT NULL,
  `business_license` VARCHAR(100) DEFAULT NULL,
  `tax_code` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_merchant_details_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 2. SYSTEM CONFIG & PROMOTIONS (system_settings, vouchers)
-- =================================================================================

CREATE TABLE `system_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `config_key` VARCHAR(50) NOT NULL,
  `config_value` JSON NOT NULL,
  `description` TEXT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_system_settings_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vouchers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(20) NOT NULL,
  `discount_amount` DECIMAL(10,2) NOT NULL,
  `min_order_value` DECIMAL(10,2) DEFAULT '0.00',
  `expiry_date` DATETIME DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_vouchers_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 3. RESTAURANTS & MENU (restaurants, change_requests, categories, toppings, food_items)
-- =================================================================================

CREATE TABLE `restaurants` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `owner_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `address` TEXT,
  `latitude` DOUBLE NOT NULL DEFAULT '0',
  `longitude` DOUBLE NOT NULL DEFAULT '0',
  `opening_time` TIME DEFAULT '07:00:00',
  `closing_time` TIME DEFAULT '22:00:00',
  `is_open` TINYINT(1) DEFAULT '1',
  `is_open_today` TINYINT(1) NOT NULL DEFAULT '1',
  `temporary_closed_reason` TEXT,
  `temporary_closed_until` DATETIME DEFAULT NULL,
  `image_url` VARCHAR(255) DEFAULT NULL,
  `rating_avg` DECIMAL(3,2) DEFAULT '5.00',
  `approval_status` VARCHAR(20) DEFAULT 'APPROVED',
  `approved_by` INT DEFAULT NULL,
  `approved_at` DATETIME DEFAULT NULL,
  `reject_reason` TEXT,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_restaurants_owner_id` (`owner_id`),
  KEY `idx_restaurants_approved_by` (`approved_by`),
  CONSTRAINT `fk_restaurants_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_restaurants_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `restaurant_change_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `restaurant_id` INT NOT NULL,
  `requested_by` INT NOT NULL,
  `payload` JSON NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `reviewed_by` INT DEFAULT NULL,
  `reviewed_at` DATETIME DEFAULT NULL,
  `reject_reason` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_change_requests_restaurant_id` (`restaurant_id`),
  KEY `idx_change_requests_requested_by` (`requested_by`),
  KEY `idx_change_requests_reviewed_by` (`reviewed_by`),
  CONSTRAINT `fk_change_requests_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_change_requests_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_change_requests_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `restaurant_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_categories_restaurant_id` (`restaurant_id`),
  CONSTRAINT `fk_categories_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `toppings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `restaurant_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `is_available` TINYINT(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_toppings_restaurant_id` (`restaurant_id`),
  CONSTRAINT `fk_toppings_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `food_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `category_id` INT DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `is_available` TINYINT(1) DEFAULT '1',
  `default_quantity` INT NOT NULL DEFAULT '0',
  `current_quantity` INT NOT NULL DEFAULT '0',
  `quantity_reset_date` DATE DEFAULT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  `image_url` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_food_items_category_id` (`category_id`),
  KEY `idx_food_items_quantity_reset_date` (`quantity_reset_date`),
  CONSTRAINT `fk_food_items_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_food_items_default_qty` CHECK (`default_quantity` >= 0),
  CONSTRAINT `chk_food_items_current_qty` CHECK (`current_quantity` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `food_toppings` (
  `food_id` INT NOT NULL,
  `topping_id` INT NOT NULL,
  PRIMARY KEY (`food_id`, `topping_id`),
  KEY `idx_food_toppings_topping_id` (`topping_id`),
  CONSTRAINT `fk_food_toppings_food` FOREIGN KEY (`food_id`) REFERENCES `food_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_food_toppings_topping` FOREIGN KEY (`topping_id`) REFERENCES `toppings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 4. ORDER MANAGEMENT (order_statuses, orders, order_items, order_item_toppings)
-- =================================================================================

CREATE TABLE `order_statuses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `label` VARCHAR(100) DEFAULT NULL,
  `description` TEXT,
  `sort_order` INT DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_order_statuses_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `orders` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_code` VARCHAR(50) NOT NULL,
  `idempotency_key` VARCHAR(100) NOT NULL,
  `customer_id` INT NOT NULL,
  `restaurant_id` INT NOT NULL,
  `driver_id` INT DEFAULT NULL,
  `voucher_id` INT DEFAULT NULL,
  `receiver_address` TEXT,
  `receiver_lat` DOUBLE DEFAULT NULL,
  `receiver_lng` DOUBLE DEFAULT NULL,
  `distance_km` DOUBLE DEFAULT NULL,
  `subtotal_amount` DECIMAL(10,2) DEFAULT NULL,
  `tax_amount` DECIMAL(10,2) DEFAULT '0.00',
  `shipping_fee` DECIMAL(10,2) DEFAULT NULL,
  `discount_amount` DECIMAL(10,2) DEFAULT '0.00',
  `total_amount` DECIMAL(10,2) DEFAULT NULL,
  `status_id` INT NOT NULL,
  `version` INT NOT NULL DEFAULT '0',
  `cancel_reason` TEXT,
  `cancelled_by_role` VARCHAR(20) DEFAULT NULL,
  `cancelled_by_user_id` INT DEFAULT NULL,
  `cancelled_at` DATETIME DEFAULT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_orders_idempotency_key` (`idempotency_key`),
  KEY `idx_orders_order_code` (`order_code`),
  KEY `idx_orders_customer_id` (`customer_id`),
  KEY `idx_orders_restaurant_id` (`restaurant_id`),
  KEY `idx_orders_driver_id` (`driver_id`),
  KEY `idx_orders_voucher_id` (`voucher_id`),
  KEY `idx_orders_status_id` (`status_id`),
  KEY `idx_orders_created_at` (`created_at`),
  KEY `idx_orders_cancelled_by_user_id` (`cancelled_by_user_id`),
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_orders_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`),
  CONSTRAINT `fk_orders_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_orders_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`),
  CONSTRAINT `fk_orders_status` FOREIGN KEY (`status_id`) REFERENCES `order_statuses` (`id`),
  CONSTRAINT `fk_orders_cancelled_by` FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT NOT NULL,
  `food_id` INT NOT NULL,
  `food_name` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL,
  `price_at_order` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order_id` (`order_id`),
  KEY `idx_order_items_food_id` (`food_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_food` FOREIGN KEY (`food_id`) REFERENCES `food_items` (`id`),
  CONSTRAINT `chk_order_items_quantity` CHECK (`quantity` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_item_toppings` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_item_id` BIGINT NOT NULL,
  `topping_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_item_toppings_order_item_id` (`order_item_id`),
  KEY `idx_order_item_toppings_topping_id` (`topping_id`),
  CONSTRAINT `fk_oit_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_oit_topping` FOREIGN KEY (`topping_id`) REFERENCES `toppings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 5. PAYMENTS & AUDIT LOGS (payments, payment_transactions, order_status_logs)
-- =================================================================================

CREATE TABLE `payments` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT NOT NULL,
  `idempotency_key` VARCHAR(100) NOT NULL,
  `payment_method` ENUM('CASH','E_WALLET','CREDIT_CARD') NOT NULL,
  `status` ENUM('PENDING','PROCESSING','SUCCESS','FAILED') DEFAULT 'PENDING',
  `amount` DECIMAL(10,2) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_payments_order_id` (`order_id`),
  UNIQUE KEY `uniq_payments_idempotency_key` (`idempotency_key`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payment_transactions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `payment_id` BIGINT NOT NULL,
  `attempt_number` INT NOT NULL DEFAULT '1',
  `status` ENUM('PENDING','PROCESSING','SUCCESS','FAILED','RETRYING') DEFAULT 'PENDING',
  `transaction_ref` VARCHAR(100) DEFAULT NULL,
  `gateway_response` JSON DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payment_transactions_payment_id` (`payment_id`),
  CONSTRAINT `fk_payment_transactions_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_status_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT NOT NULL,
  `previous_status` VARCHAR(50) DEFAULT NULL,
  `new_status` VARCHAR(50) NOT NULL,
  `changed_by` INT DEFAULT NULL,
  `reason` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_status_logs_order_id` (`order_id`),
  KEY `idx_order_status_logs_changed_by` (`changed_by`),
  CONSTRAINT `fk_order_status_logs_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_status_logs_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 6. DRIVER TELEMETRY, DISPATCH & PENALTIES
-- =================================================================================

CREATE TABLE `driver_locations` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `driver_id` INT NOT NULL,
  `order_id` BIGINT DEFAULT NULL,
  `latitude` DOUBLE NOT NULL,
  `longitude` DOUBLE NOT NULL,
  `heading` DOUBLE NOT NULL DEFAULT '0',
  `speed_kmh` DOUBLE NOT NULL DEFAULT '24',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_driver_locations_driver_id` (`driver_id`),
  KEY `idx_driver_locations_order_id` (`order_id`),
  KEY `idx_driver_locations_created_at` (`created_at`),
  CONSTRAINT `fk_driver_locations_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `driver_offers` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT NOT NULL,
  `driver_id` INT NOT NULL,
  `status` VARCHAR(30) NOT NULL,
  `algorithm` VARCHAR(50) DEFAULT NULL,
  `search_radius_km` DOUBLE DEFAULT NULL,
  `distance_km` DOUBLE DEFAULT NULL,
  `pickup_eta_minutes` DOUBLE DEFAULT NULL,
  `dispatch_score` DOUBLE DEFAULT NULL,
  `offered_at` DATETIME NOT NULL,
  `responded_at` DATETIME DEFAULT NULL,
  `expires_at` DATETIME DEFAULT NULL,
  `response_reason` TEXT,
  `cancellation_chargeable` TINYINT(1) NOT NULL DEFAULT '0',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_driver_offers_order_id` (`order_id`),
  KEY `idx_driver_offers_driver_id` (`driver_id`),
  CONSTRAINT `fk_driver_offers_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `driver_penalties` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `driver_id` INT NOT NULL,
  `type` VARCHAR(30) NOT NULL,
  `status` VARCHAR(20) NOT NULL,
  `reason` TEXT,
  `starts_at` DATETIME NOT NULL,
  `ends_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_driver_penalties_driver_id` (`driver_id`),
  CONSTRAINT `fk_driver_penalties_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 7. REVIEWS & CHAT MESSAGES
-- =================================================================================

CREATE TABLE `reviews` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT NOT NULL,
  `customer_id` INT NOT NULL,
  `target_type` ENUM('RESTAURANT','DRIVER') NOT NULL,
  `target_id` INT NOT NULL,
  `rating` TINYINT DEFAULT NULL,
  `comment` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_order_target` (`order_id`, `target_type`),
  KEY `idx_reviews_customer_id` (`customer_id`),
  CONSTRAINT `fk_reviews_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_reviews_rating` CHECK (`rating` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `chat_messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sender_id` INT NOT NULL,
  `shop_id` INT NOT NULL,
  `order_id` INT DEFAULT NULL,
  `message` VARCHAR(1000) NOT NULL,
  `sender_role` VARCHAR(20) NOT NULL,
  `is_read` TINYINT(1) DEFAULT '0',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_sender_id` (`sender_id`),
  KEY `idx_chat_messages_shop_id` (`shop_id`),
  KEY `idx_chat_messages_order_id` (`order_id`),
  CONSTRAINT `fk_chat_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_messages_shop` FOREIGN KEY (`shop_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 8. INITIAL DATA INSERTION (SEED DATA)
-- =================================================================================

-- 8.1 Roles
INSERT INTO `roles` (`id`, `name`) VALUES
(1, 'CUSTOMER'),
(2, 'DRIVER'),
(3, 'MERCHANT'),
(4, 'ADMIN');

-- 8.2 Users (Password: 123456)
INSERT INTO `users` (`id`, `phone`, `password`, `full_name`, `rating_avg`, `created_at`, `deleted_at`) VALUES
(1, '0900000001', '123456', 'Customer Demo', '4.80', '2026-06-10 08:08:00', NULL),
(2, '0900000002', '123456', 'Tran Thi B', '4.95', '2026-06-10 08:08:00', NULL),
(3, '0900000003', '123456', 'Le Van C', '4.70', '2026-06-10 08:08:00', NULL),
(4, '0900000004', '123456', 'Pham Thi D', '4.88', '2026-06-10 08:08:00', NULL),
(5, '0900000005', '123456', 'Admin User', '5.00', '2026-06-10 08:08:00', NULL),
(6, '0944495653', '123456', 'Huỳnh La Tiến Lộc', '5.00', '2026-06-10 01:32:08', NULL);

-- 8.3 User Roles
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 1),
(4, 2),
(5, 4),
(6, 3);

-- 8.4 User Addresses
INSERT INTO `user_addresses` (`id`, `user_id`, `address`, `latitude`, `longitude`, `is_default`, `label`, `created_at`) VALUES
(1, 1, '144 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội', 21.0368, 105.7827, 1, 'Nhà riêng', '2026-06-10 08:00:00'),
(2, 1, 'Keangnam Landmark 72, Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội', 21.0173, 105.7838, 0, 'Công ty', '2026-06-10 08:30:00'),
(3, 2, '264 Bà Hạt, Phường 9, Quận 10, TP.HCM', 10.765, 106.671, 1, 'Nhà riêng', '2026-06-10 09:00:00');

-- 8.5 Driver Details
INSERT INTO `driver_details` (`user_id`, `license_plate`, `id_card_number`, `vehicle_type`, `approval_status`, `reject_reason`, `is_online`) VALUES
(2, '59A1-12345', '079123456789', 'Motorbike', 'APPROVED', NULL, 1),
(4, '51B2-67890', '079987654321', 'Motorbike', 'APPROVED', NULL, 0);

-- 8.6 Merchant Details
INSERT INTO `merchant_details` (`user_id`, `business_license`, `tax_code`) VALUES
(3, 'GPKD-123456789', 'MST-987654321'),
(6, 'GPKD-987654321', 'MST-123456789');

-- 8.7 System Settings
INSERT INTO `system_settings` (`id`, `config_key`, `config_value`, `description`) VALUES
(1, 'shipping_config', '{"base_km": 2, "base_fee": 15000, "extra_per_km": 5000}', 'Cấu hình tính phí giao hàng'),
(2, 'tax_config', '{"vat_rate": 0.08}', 'Cấu hình thuế VAT');

-- 8.8 Vouchers
INSERT INTO `vouchers` (`id`, `code`, `discount_amount`, `min_order_value`, `expiry_date`, `is_active`) VALUES
(1, 'FREESHIP', 15000.00, 50000.00, '2026-12-31 23:59:59', 1),
(2, 'FLASHFOOD20', 20000.00, 80000.00, '2026-12-31 23:59:59', 1),
(3, 'WELCOME50', 50000.00, 150000.00, '2026-12-31 23:59:59', 1);

-- 8.9 Restaurants
INSERT INTO `restaurants` (`id`, `owner_id`, `name`, `address`, `latitude`, `longitude`, `opening_time`, `closing_time`, `is_open`, `is_open_today`, `temporary_closed_reason`, `temporary_closed_until`, `image_url`, `rating_avg`, `approval_status`, `approved_by`, `approved_at`, `reject_reason`, `deleted_at`) VALUES
(1, 3, 'Hanh Dung - Am Thuc Chay Man', '111-113 Au Co, P.14, Q.11', 10.771, 106.649, '07:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5', '4.80', 'APPROVED', 5, '2026-06-10 08:08:00', NULL, NULL),
(2, 3, 'Quan Chay Thanh Ai', '264 Ba Hat, P.9, Q.10', 10.765, 106.671, '07:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/19/99/2f/11/getlstd-property-photo.jpg?w=1000&h=-1&s=1', '4.70', 'APPROVED', 5, '2026-06-10 08:08:00', NULL, NULL),
(3, 6, 'Cơm Tấm TL', '300A Phu chanh Phu Hung', 10.229067, 106.40525, '07:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://tse3.mm.bing.net/th/id/OIP.YO6ZnE23qqs6g_8FvlITewHaFS?rs=1&pid=ImgDetMain&o=7&rm=3', '5.00', 'APPROVED', 1, '2026-06-10 02:07:20', NULL, NULL),
(4, 3, 'Audit Restaurant Demo', '123 Test St', 10.77, 106.69, '07:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', '5.00', 'APPROVED', 5, '2026-06-10 02:43:43', NULL, '2026-06-10 02:43:43'),
(5, 3, 'Audit Restaurant Demo 2', '123 Test St', 10.77, 106.69, '07:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1552566626-52f8b828add9', '5.00', 'APPROVED', 5, '2026-06-10 02:44:54', NULL, '2026-06-10 02:44:54'),
(6, 3, 'Bep Nha Sai Gon', '25 Nguyen Trai, P. Ben Thanh, Q.1, TP.HCM', 10.7698, 106.6939, '06:30:00', '21:30:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5', '4.85', 'APPROVED', 5, '2026-06-11 08:00:00', NULL, NULL),
(7, 3, 'Bun Bo Co Hue', '88 Ly Thuong Kiet, P.7, Q.10, TP.HCM', 10.7721, 106.6578, '06:00:00', '22:00:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec', '4.75', 'APPROVED', 5, '2026-06-11 08:00:00', NULL, NULL),
(8, 6, 'Tra Sua May Xanh', '145 Cach Mang Thang 8, P.5, Q.3, TP.HCM', 10.7824, 106.6841, '09:00:00', '23:00:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1558857563-b371033873b8', '4.60', 'APPROVED', 5, '2026-06-11 08:00:00', NULL, NULL),
(9, 6, 'Pizza Pho Mai 4P Mini', '17 Phan Xich Long, P.2, Q. Phu Nhuan, TP.HCM', 10.7993, 106.6865, '10:00:00', '22:30:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1513104890138-7c749659a591', '4.90', 'APPROVED', 5, '2026-06-11 08:00:00', NULL, NULL),
(10, 3, 'Ga Ran Gion Rum', '62 Le Van Sy, P.11, Q.3, TP.HCM', 10.7874, 106.6742, '09:30:00', '22:30:00', 1, 1, NULL, NULL, 'https://images.unsplash.com/photo-1562967916-eb82221dfb92', '4.65', 'APPROVED', 5, '2026-06-11 08:00:00', NULL, NULL);

-- 8.10 Restaurant Change Requests
INSERT INTO `restaurant_change_requests` (`id`, `restaurant_id`, `requested_by`, `payload`, `status`, `reviewed_by`, `reviewed_at`, `reject_reason`, `created_at`) VALUES
(1, 1, 1, '{"name":"Hanh Dung - Am Thuc Chay Man","address":"111-113 Au Co, P.14, Q.11","ownerId":5,"imageUrl":null,"latitude":10.771,"longitude":106.649,"ratingAvg":4.8}', 'PENDING', NULL, NULL, NULL, '2026-06-10 01:53:52'),
(2, 3, 1, '{"name":"Cơm Tấm TL","address":"300A Phu chanh Phu Hung","ownerId":6,"imageUrl":"https://tse3.mm.bing.net/th/id/OIP.YO6ZnE23qqs6g_8FvlITewHaFS?rs=1&pid=ImgDetMain&o=7&rm=3","latitude":10.229067,"longitude":106.40525,"ratingAvg":5}', 'PENDING', NULL, NULL, NULL, '2026-06-10 02:00:21'),
(3, 2, 1, '{"name":"Quan Chay Thanh Ai","address":"264 Ba Hat, P.9, Q.10","ownerId":3,"imageUrl":null,"latitude":10.765,"longitude":106.671,"ratingAvg":4.7}', 'PENDING', NULL, NULL, NULL, '2026-06-10 02:04:21');

-- 8.11 Categories
INSERT INTO `categories` (`id`, `restaurant_id`, `name`) VALUES
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

-- 8.12 Toppings
INSERT INTO `toppings` (`id`, `restaurant_id`, `name`, `price`, `is_available`) VALUES
(1, 1, 'Thêm chả lụa chay', 10000.00, 1),
(2, 1, 'Thêm sườn non chay', 12000.00, 1),
(3, 1, 'Thêm cơm', 5000.00, 1),
(4, 3, 'Trứng ốp la', 8000.00, 1),
(5, 3, 'Chả trứng hấp', 10000.00, 1),
(6, 3, 'Bì heo xé sợi', 10000.00, 1),
(7, 6, 'Trứng kho thêm', 7000.00, 1),
(8, 8, 'Trân châu đen', 7000.00, 1),
(9, 8, 'Thạch phô mai', 9000.00, 1),
(10, 8, 'Pudding trứng', 8000.00, 1);

-- 8.13 Food Items
INSERT INTO `food_items` (`id`, `category_id`, `name`, `price`, `is_available`, `default_quantity`, `current_quantity`, `quantity_reset_date`, `deleted_at`, `image_url`) VALUES
(1, 1, 'Com Tam Chay', 45000.00, 1, 40, 38, '2026-06-18', NULL, 'https://i.ytimg.com/vi/I7IO_xMc4yA/maxresdefault.jpg'),
(2, 2, 'Tra Da', 5000.00, 1, 120, 120, '2026-06-18', NULL, 'https://tse1.mm.bing.net/th/id/OIP.UmpBdKB2TIJmZIcyRXsY0AHaFj?rs=1&pid=ImgDetMain&o=7&rm=3'),
(3, 3, 'Hu Tieu Nam Vang', 55000.00, 1, 35, 35, '2026-06-18', NULL, 'https://tse3.mm.bing.net/th/id/OIP.geNSt6WrdCUaHKp_QuzPrgHaEL?rs=1&pid=ImgDetMain&o=7&rm=3'),
(4, 5, 'Cơm tấm Sườn', 30000.00, 1, 5, 3, '2026-06-18', NULL, 'https://asianinspirations.com.au/wp-content/uploads/2019/08/R01069_Com-Tam-3.jpg'),
(5, 5, 'Cơm Sườn Bì Chả', 45000.00, 1, 5, 3, '2026-06-18', NULL, 'https://asianinspirations.com.au/wp-content/uploads/2019/08/R01069_Com-Tam-3.jpg'),
(6, 5, 'Cơm Sườn Bì', 40000.00, 1, 10, 4, '2026-06-18', NULL, 'https://asianinspirations.com.au/wp-content/uploads/2019/08/R01069_Com-Tam-3.jpg'),
(7, 8, 'Chả', 10000.00, 1, 100, 5, '2026-06-18', NULL, 'https://th.bing.com/th/id/OSK.b0513d6867f39fd7cfc1e204f4dbc936?w=424&h=424&c=7&rs=1&qlt=90&o=6&pid=16.1'),
(11, 12, 'Com ga xoi mo', 52000.00, 1, 45, 45, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d'),
(12, 12, 'Com thit kho trung', 48000.00, 1, 40, 40, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'),
(13, 12, 'Com ca kho to', 55000.00, 1, 35, 35, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1512058564366-18510be2db19'),
(14, 12, 'Com bo luc lac', 68000.00, 1, 30, 30, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1544025162-d76694265947'),
(15, 13, 'Canh chua ca loc', 39000.00, 1, 25, 25, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1547592180-85f173990554'),
(16, 13, 'Rau muong xao toi', 28000.00, 1, 35, 35, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd'),
(17, 14, 'Tra tac mat ong', 18000.00, 1, 80, 80, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1497534446932-c925b458314e'),
(18, 14, 'Nuoc mia tac', 15000.00, 1, 90, 90, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8'),
(19, 15, 'Bun bo dac biet', 65000.00, 1, 50, 50, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1555126634-323283e090fa'),
(20, 15, 'Bun bo gio heo', 59000.00, 1, 45, 45, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624'),
(21, 15, 'Bun bo tai nam', 62000.00, 1, 45, 45, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092'),
(22, 16, 'Cha cua them', 18000.00, 1, 60, 60, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1529042410759-befb1204b468'),
(23, 16, 'Quay nong', 8000.00, 1, 100, 100, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1509440159596-0249088772ff'),
(24, 17, 'Sua dau nanh', 12000.00, 1, 80, 80, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc'),
(25, 18, 'Tra sua tran chau duong den', 39000.00, 1, 70, 70, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1558857563-b371033873b8'),
(26, 18, 'Tra sua oolong kem cheese', 42000.00, 1, 65, 65, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054'),
(27, 18, 'Matcha latte tran chau', 45000.00, 1, 55, 55, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7'),
(28, 19, 'Tra dao cam sa', 35000.00, 1, 70, 70, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc'),
(29, 19, 'Tra vai hat chia', 36000.00, 1, 70, 70, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1544145945-f90425340c7e'),
(30, 20, 'Tran chau den', 7000.00, 1, 120, 120, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e'),
(31, 20, 'Thach pho mai', 9000.00, 1, 100, 100, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1551024601-bec78aea704b'),
(32, 21, 'Pizza hai san', 129000.00, 1, 25, 25, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1513104890138-7c749659a591'),
(33, 21, 'Pizza pepperoni', 119000.00, 1, 30, 30, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1628840042765-356cda07504e'),
(34, 21, 'Pizza bo bam pho mai', 139000.00, 1, 25, 25, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1594007654729-407eedc4be65'),
(35, 22, 'Mi y sot bo bam', 79000.00, 1, 30, 30, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141'),
(36, 22, 'Carbonara thit xong khoi', 85000.00, 1, 30, 30, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9'),
(37, 23, 'Khoai tay chien', 39000.00, 1, 60, 60, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1576107232684-1279f390859f'),
(38, 23, 'Salad caesar', 49000.00, 1, 35, 35, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd'),
(39, 24, 'Ga ran truyen thong 2 mieng', 59000.00, 1, 50, 50, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1562967916-eb82221dfb92'),
(40, 24, 'Ga sot cay Han Quoc', 69000.00, 1, 45, 45, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58'),
(41, 24, 'Canh ga chien mam', 55000.00, 1, 50, 50, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1527477396000-e27163b481c2'),
(42, 25, 'Burger ga gion', 49000.00, 1, 40, 40, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd'),
(43, 25, 'Burger bo pho mai', 59000.00, 1, 35, 35, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1550547660-d9450f859349'),
(44, 26, 'Combo ga ran burger nuoc', 99000.00, 1, 30, 30, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b'),
(45, 26, 'Combo gia dinh 6 mieng ga', 189000.00, 1, 20, 20, '2026-06-18', NULL, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f');

-- 8.14 Food Toppings Junction
INSERT INTO `food_toppings` (`food_id`, `topping_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(4, 4),
(4, 5),
(4, 6),
(5, 4),
(5, 5),
(5, 6),
(6, 4),
(6, 5),
(6, 6),
(12, 7),
(25, 8),
(25, 9),
(25, 10),
(26, 8),
(26, 9),
(26, 10),
(27, 8),
(27, 9);

-- 8.15 Order Statuses
INSERT INTO `order_statuses` (`id`, `code`, `label`, `description`, `sort_order`) VALUES
(1, 'PENDING', 'Chờ xác nhận', 'Đơn hàng vừa được tạo, đang chờ xử lý', 1),
(2, 'DRIVER_ACCEPTED', 'Tài xế đã nhận', 'Tài xế đã chấp nhận cuốc xe', 2),
(3, 'DRIVER_REJECTED', 'Tài xế từ chối', 'Tài xế đã từ chối nhận đơn', 3),
(4, 'CONFIRMED', 'Đã xác nhận', 'Quán đã xác nhận và đang chế biến món ăn', 4),
(5, 'PICKING_UP', 'Đang lấy hàng', 'Tài xế đang di chuyển tới quán lấy món', 5),
(6, 'DELIVERING', 'Đang giao hàng', 'Tài xế đang trên đường giao tới người nhận', 6),
(7, 'COMPLETED', 'Hoàn thành', 'Giao hàng và thanh toán thành công', 7),
(8, 'CANCELLED', 'Đã huỷ', 'Đơn hàng đã bị huỷ', 8),
(9, 'TIMEOUT', 'Quá thời gian', 'Quá thời hạn tiếp nhận đơn', 9);

-- 8.16 Orders
INSERT INTO `orders` (`id`, `order_code`, `idempotency_key`, `customer_id`, `restaurant_id`, `driver_id`, `voucher_id`, `receiver_address`, `receiver_lat`, `receiver_lng`, `distance_km`, `subtotal_amount`, `tax_amount`, `shipping_fee`, `discount_amount`, `total_amount`, `status_id`, `version`, `cancel_reason`, `cancelled_by_role`, `cancelled_by_user_id`, `cancelled_at`, `deleted_at`, `created_at`) VALUES
(1, 'ORD-20260324-001', 'IDEM-CLIENT-20260324-UUID-001', 1, 1, 2, 1, '12 Nguyen Hue, Quan 1', 10.7769, 106.7009, 3.2, 95000.00, 7600.00, 21000.00, 15000.00, 108600.00, 7, 1, NULL, NULL, NULL, NULL, NULL, '2026-03-24 03:00:00'),
(2, 'ORD-20260610-1781084623774', 'audit-1781084623757', 1, 1, NULL, NULL, '1 Test Address', 10.78, 106.7, 2, 45000.00, 0.00, 7000.00, 0.00, 52000.00, 1, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-10 02:43:43'),
(3, 'ORD-20260610-1781084695040', 'audit-1781084695019', 1, 1, NULL, NULL, '1 Test Address', 10.78, 106.7, 2, 45000.00, 0.00, 7000.00, 0.00, 52000.00, 1, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-10 02:44:55');

-- 8.17 Order Items
INSERT INTO `order_items` (`id`, `order_id`, `food_id`, `food_name`, `quantity`, `price_at_order`) VALUES
(1, 1, 1, 'Com Tam Chay', 2, 45000.00),
(2, 1, 2, 'Tra Da', 1, 5000.00),
(3, 2, 1, 'Com Tam Chay', 1, 45000.00),
(4, 3, 1, 'Com Tam Chay', 1, 45000.00);

-- 8.18 Order Item Toppings
INSERT INTO `order_item_toppings` (`id`, `order_item_id`, `topping_id`, `quantity`, `price`) VALUES
(1, 1, 1, 1, 10000.00),
(2, 1, 3, 1, 5000.00);

-- 8.19 Payments
INSERT INTO `payments` (`id`, `order_id`, `idempotency_key`, `payment_method`, `status`, `amount`, `created_at`, `updated_at`) VALUES
(1, 1, 'PAY-IDEM-20260324-001', 'E_WALLET', 'SUCCESS', 108600.00, '2026-06-10 08:08:00', '2026-06-10 08:08:00'),
(2, 3, 'pay-1781084695071', 'E_WALLET', 'PENDING', 52000.00, '2026-06-10 02:44:55', '2026-06-10 02:44:55');

-- 8.20 Payment Transactions
INSERT INTO `payment_transactions` (`id`, `payment_id`, `attempt_number`, `status`, `transaction_ref`, `gateway_response`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'SUCCESS', 'MOMO-9988776655', '{"code": "0", "message": "Thanh toán ví thành công"}', '2026-06-10 08:08:00', '2026-06-10 08:08:00');

-- 8.21 Order Status Logs
INSERT INTO `order_status_logs` (`id`, `order_id`, `previous_status`, `new_status`, `changed_by`, `reason`, `created_at`) VALUES
(1, 1, 'DELIVERING', 'COMPLETED', 2, 'Giao hàng thành công', '2026-06-10 08:08:00');

-- 8.22 Driver Locations (Historical telemetry)
INSERT INTO `driver_locations` (`id`, `driver_id`, `order_id`, `latitude`, `longitude`, `heading`, `speed_kmh`, `created_at`) VALUES
(1, 2, 1, 10.771, 106.649, 90, 24, '2026-06-10 08:08:00'),
(2, 2, NULL, 10.7757, 106.6868, 90, 24, '2026-06-10 08:09:00');

-- 8.23 Driver Offers
INSERT INTO `driver_offers` (`id`, `order_id`, `driver_id`, `status`, `algorithm`, `search_radius_km`, `distance_km`, `pickup_eta_minutes`, `dispatch_score`, `offered_at`, `responded_at`, `expires_at`, `response_reason`, `cancellation_chargeable`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 'ACCEPTED', 'NEAREST_NEIGHBOR', 5.0, 1.8, 8.5, 95.0, '2026-03-24 10:01:00', '2026-03-24 10:01:20', '2026-03-24 10:02:00', NULL, 0, '2026-03-24 10:01:00', '2026-03-24 10:01:20');

-- 8.24 Driver Penalties
INSERT INTO `driver_penalties` (`id`, `driver_id`, `type`, `status`, `reason`, `starts_at`, `ends_at`, `created_at`, `updated_at`) VALUES
(1, 4, 'LATE_PICKUP', 'RESOLVED', 'Trễ lấy hàng 15 phút do kẹt xe', '2026-06-01 10:00:00', '2026-06-01 12:00:00', '2026-06-01 10:00:00', '2026-06-01 12:00:00');

-- 8.25 Reviews
INSERT INTO `reviews` (`id`, `order_id`, `customer_id`, `target_type`, `target_id`, `rating`, `comment`, `created_at`) VALUES
(1, 1, 1, 'RESTAURANT', 1, 5, 'Cơm tấm rất ngon, phục vụ nhanh!', '2026-06-10 08:08:00'),
(2, 1, 1, 'DRIVER', 2, 5, 'Tài xế lịch sự, giao hàng nhanh chóng.', '2026-06-10 08:08:00');

-- 8.26 Chat Messages
INSERT INTO `chat_messages` (`id`, `sender_id`, `shop_id`, `order_id`, `message`, `sender_role`, `is_read`, `created_at`) VALUES
(1, 1, 1, 1, 'Chào quán, đơn mình có thể làm ít cay được không ạ?', 'CUSTOMER', 1, '2026-03-24 10:02:00'),
(2, 3, 1, 1, 'Dạ được ạ, quán đã ghi chú cho bếp rồi bạn yên tâm nhé!', 'MERCHANT', 1, '2026-03-24 10:03:00'),
(3, 1, 1, 1, 'Cảm ơn quán nhiều nhé!', 'CUSTOMER', 1, '2026-03-24 10:03:30'),
(4, 1, 3, NULL, 'Shop cho mình hỏi cơm tấm TL hôm nay có sườn cây không?', 'CUSTOMER', 0, '2026-06-10 11:15:00'),
(5, 6, 3, NULL, 'Dạ còn bạn nhé, bạn đặt sớm giúp quán nha!', 'MERCHANT', 0, '2026-06-10 11:16:00');

-- =================================================================================
-- 9. RESET AUTO_INCREMENT VALUES
-- =================================================================================
ALTER TABLE `roles`                      AUTO_INCREMENT = 10;
ALTER TABLE `users`                      AUTO_INCREMENT = 10;
ALTER TABLE `user_addresses`             AUTO_INCREMENT = 10;
ALTER TABLE `system_settings`            AUTO_INCREMENT = 10;
ALTER TABLE `vouchers`                   AUTO_INCREMENT = 10;
ALTER TABLE `restaurants`                AUTO_INCREMENT = 20;
ALTER TABLE `restaurant_change_requests` AUTO_INCREMENT = 10;
ALTER TABLE `categories`                 AUTO_INCREMENT = 30;
ALTER TABLE `toppings`                   AUTO_INCREMENT = 20;
ALTER TABLE `food_items`                 AUTO_INCREMENT = 50;
ALTER TABLE `order_statuses`             AUTO_INCREMENT = 15;
ALTER TABLE `orders`                     AUTO_INCREMENT = 10;
ALTER TABLE `order_items`                AUTO_INCREMENT = 10;
ALTER TABLE `order_item_toppings`        AUTO_INCREMENT = 10;
ALTER TABLE `payments`                   AUTO_INCREMENT = 10;
ALTER TABLE `payment_transactions`       AUTO_INCREMENT = 10;
ALTER TABLE `order_status_logs`          AUTO_INCREMENT = 10;
ALTER TABLE `driver_locations`           AUTO_INCREMENT = 10;
ALTER TABLE `driver_offers`              AUTO_INCREMENT = 10;
ALTER TABLE `driver_penalties`           AUTO_INCREMENT = 10;
ALTER TABLE `reviews`                    AUTO_INCREMENT = 10;
ALTER TABLE `chat_messages`              AUTO_INCREMENT = 10;

SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;
COMMIT;

-- =================================================================================
-- END OF SCRIPT
-- =================================================================================
