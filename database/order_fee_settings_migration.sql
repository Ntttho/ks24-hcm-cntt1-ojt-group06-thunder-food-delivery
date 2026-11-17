INSERT INTO system_settings (config_key, config_value, description)
VALUES
    ('shipping_config', '{"base_km":2,"base_fee":15000,"extra_per_km":5000,"priority_fee":5000}', 'Cấu hình tính phí giao hàng'),
    ('order_fee_config', '{"service_fee":3000}', 'Cấu hình phí dịch vụ mỗi đơn hàng'),
    ('tax_config', '{"vat_rate":0.10,"vat_included":true}', 'Cấu hình thuế VAT'),
    ('commission_config', '{"platform_fee_percent":10}', 'Cấu hình tỷ lệ hoa hồng sàn')
ON DUPLICATE KEY UPDATE config_key = VALUES(config_key);

UPDATE system_settings
SET config_value = JSON_SET(
    CAST(config_value AS JSON),
    '$.priority_fee',
    COALESCE(JSON_EXTRACT(CAST(config_value AS JSON), '$.priority_fee'), 5000)
)
WHERE config_key = 'shipping_config';

UPDATE system_settings
SET config_value = JSON_SET(
    CAST(config_value AS JSON),
    '$.vat_included',
    COALESCE(JSON_EXTRACT(CAST(config_value AS JSON), '$.vat_included'), TRUE)
)
WHERE config_key = 'tax_config';

SET @initial_commission_rate = COALESCE(
    (
        SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(config_value, '$.platform_fee_percent')) AS DECIMAL(5,2))
        FROM system_settings
        WHERE config_key = 'commission_config'
    ),
    10
);
SET @initial_commission_time = DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m-%dT%H:%i:%s');

INSERT INTO system_settings (config_key, config_value, description)
VALUES (
    'platform_commission_rate',
    JSON_OBJECT(
        'value', @initial_commission_rate,
        'type', 'NUMBER',
        'updatedAt', @initial_commission_time,
        'history', JSON_ARRAY(JSON_OBJECT('value', @initial_commission_rate, 'updatedAt', @initial_commission_time))
    ),
    'Tỷ lệ hoa hồng nền tảng (%)'
)
ON DUPLICATE KEY UPDATE config_key = VALUES(config_key);
