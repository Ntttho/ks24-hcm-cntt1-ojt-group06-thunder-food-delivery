package com.foodthunder.manager.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.foodthunder.manager.entity.SystemSetting;
import com.foodthunder.manager.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class SettingsSeeder implements ApplicationRunner {
    private final SystemSettingRepository repository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        seed("default_shipping_fee", legacyNumber("shipping_config", "base_fee", "15000"),
                "Phí giao hàng mặc định (VNĐ)");
        seed("shipping_fee_per_kilometer", legacyNumber("shipping_config", "extra_per_km", "5000"),
                "Phí giao hàng trên mỗi kilomet (VNĐ/km)");
        seed("platform_commission_rate", legacyNumber("commission_config", "platform_fee_percent", "15"),
                "Tỷ lệ hoa hồng nền tảng (%)");
        seed("minimum_order_value", new BigDecimal("0"), "Giá trị đơn hàng tối thiểu (VNĐ)");
    }

    private BigDecimal legacyNumber(String configKey, String valueKey, String fallback) {
        return repository.findByConfigKey(configKey)
                .map(setting -> {
                    try {
                        JsonNode config = objectMapper.readTree(setting.getConfigValue());
                        if (config.isTextual()) config = objectMapper.readTree(config.textValue());
                        JsonNode value = config.get(valueKey);
                        return value != null && value.isNumber()
                                ? value.decimalValue() : new BigDecimal(fallback);
                    } catch (Exception ex) {
                        throw new IllegalStateException("Không thể đọc cấu hình hiện có: " + configKey, ex);
                    }
                })
                .orElseGet(() -> new BigDecimal(fallback));
    }

    private void seed(String key, BigDecimal value, String description) throws Exception {
        if (repository.existsByConfigKey(key)) return;
        ObjectNode json = objectMapper.createObjectNode();
        json.put("value", value);
        json.put("type", "NUMBER");
        json.put("updatedAt", LocalDateTime.now().toString());
        SystemSetting setting = new SystemSetting();
        setting.setConfigKey(key);
        setting.setConfigValue(objectMapper.writeValueAsString(json));
        setting.setDescription(description);
        repository.save(setting);
    }
}
