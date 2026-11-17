CREATE TABLE IF NOT EXISTS system_settings (
  id INT NOT NULL AUTO_INCREMENT,
  config_key VARCHAR(50) NOT NULL,
  config_value JSON NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_system_settings_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO system_settings (config_key, config_value, description) VALUES
  ('default_shipping_fee', '{"value":15000,"type":"NUMBER","updatedAt":"2026-01-01T00:00:00"}', 'Phí giao hàng mặc định (VNĐ)'),
  ('shipping_fee_per_kilometer', '{"value":5000,"type":"NUMBER","updatedAt":"2026-01-01T00:00:00"}', 'Phí giao hàng trên mỗi kilomet (VNĐ/km)'),
  ('platform_commission_rate', '{"value":15,"type":"NUMBER","updatedAt":"2026-01-01T00:00:00","history":[{"value":15,"updatedAt":"2026-01-01T00:00:00"}]}', 'Tỷ lệ hoa hồng nền tảng (%)'),
  ('minimum_order_value', '{"value":0,"type":"NUMBER","updatedAt":"2026-01-01T00:00:00"}', 'Giá trị đơn hàng tối thiểu (VNĐ)');
