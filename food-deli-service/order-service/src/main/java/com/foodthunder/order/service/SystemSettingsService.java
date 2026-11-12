package com.foodthunder.order.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.foodthunder.order.dto.settings.ShippingSettingsResponse;
import com.foodthunder.order.dto.settings.SystemSettingsResponse;
import com.foodthunder.order.dto.settings.UpdateSystemSettingsRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SystemSettingsService {
    private static final String DEFAULT_SHIPPING_FEE_KEY = "default_shipping_fee";
    private static final String SHIPPING_FEE_PER_KILOMETER_KEY = "shipping_fee_per_kilometer";
    private static final String PLATFORM_COMMISSION_RATE_KEY = "platform_commission_rate";
    private static final String LEGACY_SHIPPING_CONFIG_KEY = "shipping_config";
    private static final String SETTINGS_SELECT_SQL =
            "SELECT config_value FROM system_settings WHERE config_key = ?";
    private static final String SETTINGS_UPSERT_SQL =
            "INSERT INTO system_settings (config_key, config_value, description) VALUES (?, ?, ?) " +
            "ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), description = VALUES(description)";

    private record ShippingConfiguration(
            JsonNode defaultShipping,
            JsonNode perKilometer,
            BigDecimal defaultFee,
            BigDecimal perKilometerFee
    ) {
    }

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public SystemSettingsResponse getSettings() {
        ShippingConfiguration shipping = readShippingConfiguration();
        JsonNode commission = findSetting(PLATFORM_COMMISSION_RATE_KEY).orElse(null);
        return SystemSettingsResponse.builder()
                .defaultShippingFee(shipping.defaultFee())
                .defaultShippingFeeUpdatedAt(readTimestamp(shipping.defaultShipping()))
                .shippingFeePerKilometer(shipping.perKilometerFee())
                .shippingFeePerKilometerUpdatedAt(readTimestamp(shipping.perKilometer()))
                .platformCommissionRate(readNumber(commission, "value"))
                .platformCommissionRateUpdatedAt(readTimestamp(commission))
                .build();
    }

    public ShippingSettingsResponse getShippingSettings() {
        ShippingConfiguration shipping = readShippingConfiguration();
        return ShippingSettingsResponse.builder()
                .defaultShippingFee(shipping.defaultFee())
                .shippingFeePerKilometer(shipping.perKilometerFee())
                .build();
    }

    private ShippingConfiguration readShippingConfiguration() {
        JsonNode defaultShipping = findSetting(DEFAULT_SHIPPING_FEE_KEY).orElse(null);
        JsonNode perKilometer = findSetting(SHIPPING_FEE_PER_KILOMETER_KEY).orElse(null);
        JsonNode legacyShipping = defaultShipping == null || perKilometer == null
                ? findSetting(LEGACY_SHIPPING_CONFIG_KEY).orElse(null)
                : null;
        BigDecimal baseFee = readNumber(defaultShipping, "value");
        BigDecimal perKmFee = readNumber(perKilometer, "value");
        if (legacyShipping != null) {
            if (baseFee == null) {
                baseFee = readNumber(legacyShipping, "base_fee");
            }
            if (perKmFee == null) {
                perKmFee = readNumber(legacyShipping, "extra_per_km");
            }
        }
        if (baseFee == null || perKmFee == null) {
            throw new IllegalStateException("Thiếu cấu hình phí giao hàng hợp lệ trong system_settings");
        }
        return new ShippingConfiguration(defaultShipping, perKilometer, baseFee, perKmFee);
    }

    @Transactional
    public SystemSettingsResponse updateSettings(UpdateSystemSettingsRequest request) {
        LocalDateTime now = LocalDateTime.now();
        JsonNode previousCommission = findSetting(PLATFORM_COMMISSION_RATE_KEY).orElse(null);

        saveSetting(DEFAULT_SHIPPING_FEE_KEY, request.getDefaultShippingFee(),
                "Phí giao hàng mặc định (VNĐ)", now, null);
        saveSetting(SHIPPING_FEE_PER_KILOMETER_KEY, request.getShippingFeePerKilometer(),
                "Phí giao hàng trên mỗi kilomet (VNĐ/km)", now, null);
        saveSetting(PLATFORM_COMMISSION_RATE_KEY, request.getPlatformCommissionRate(),
                "Tỷ lệ hoa hồng nền tảng (%)", now, commissionHistory(previousCommission, request.getPlatformCommissionRate(), now));
        return getSettings();
    }

    public BigDecimal commissionRateAt(LocalDateTime orderCreatedAt) {
        return commissionRatesAt(orderCreatedAt == null ? java.util.List.of() : java.util.List.of(orderCreatedAt))
                .getOrDefault(orderCreatedAt, BigDecimal.ZERO);
    }

    public Map<LocalDateTime, BigDecimal> commissionRatesAt(Collection<LocalDateTime> orderCreatedTimes) {
        JsonNode commission = findSetting(PLATFORM_COMMISSION_RATE_KEY).orElse(null);
        Map<LocalDateTime, BigDecimal> rates = new HashMap<>();
        for (LocalDateTime orderCreatedAt : orderCreatedTimes) {
            if (orderCreatedAt != null) {
                rates.put(orderCreatedAt, rateAt(commission, orderCreatedAt));
            }
        }
        return rates;
    }

    private BigDecimal rateAt(JsonNode commission, LocalDateTime orderCreatedAt) {
        if (commission == null || orderCreatedAt == null) {
            return BigDecimal.ZERO;
        }

        JsonNode history = commission.path("history");
        if (history.isArray()) {
            BigDecimal applicableRate = BigDecimal.ZERO;
            for (JsonNode entry : history) {
                BigDecimal value = readNumber(entry, "value");
                LocalDateTime updatedAt = readTimestamp(entry);
                if (value != null && updatedAt != null && !updatedAt.isAfter(orderCreatedAt)) {
                    applicableRate = value;
                }
            }
            return applicableRate;
        }

        BigDecimal currentValue = readNumber(commission, "value");
        LocalDateTime updatedAt = readTimestamp(commission);
        return currentValue != null && updatedAt != null && !updatedAt.isAfter(orderCreatedAt)
                ? currentValue
                : BigDecimal.ZERO;
    }

    private Optional<JsonNode> findSetting(String key) {
        try {
            String json = jdbcTemplate.queryForObject(SETTINGS_SELECT_SQL, String.class, key);
            return Optional.of(parseJson(json, key));
        } catch (EmptyResultDataAccessException ex) {
            return Optional.empty();
        }
    }

    private JsonNode parseJson(String json, String key) {
        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Giá trị cấu hình không phải JSON hợp lệ: " + key, ex);
        }
    }

    private BigDecimal readNumber(JsonNode node, String fieldName) {
        if (node == null) {
            return null;
        }
        JsonNode value = node.get(fieldName);
        if (value == null || !value.isNumber()) {
            return null;
        }
        return value.decimalValue();
    }

    private LocalDateTime readTimestamp(JsonNode node) {
        if (node == null) {
            return null;
        }
        JsonNode value = node.get("updatedAt");
        if (value == null || !value.isTextual()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value.asText());
        } catch (DateTimeParseException ex) {
            throw new IllegalStateException("Thời gian cập nhật cấu hình không hợp lệ", ex);
        }
    }

    private ArrayNode commissionHistory(JsonNode previous, BigDecimal newRate, LocalDateTime updatedAt) {
        ArrayNode history = objectMapper.createArrayNode();
        JsonNode previousHistory = previous == null ? null : previous.get("history");
        if (previousHistory != null && previousHistory.isArray()) {
            history.addAll((ArrayNode) previousHistory);
        } else if (previous != null) {
            BigDecimal previousRate = readNumber(previous, "value");
            LocalDateTime previousUpdatedAt = readTimestamp(previous);
            if (previousRate != null && previousUpdatedAt != null) {
                addHistoryEntry(history, previousRate, previousUpdatedAt);
            }
        }

        BigDecimal lastRate = history.isEmpty()
                ? readNumber(previous, "value")
                : readNumber(history.get(history.size() - 1), "value");
        if (lastRate == null || lastRate.compareTo(newRate) != 0 || history.isEmpty()) {
            addHistoryEntry(history, newRate, updatedAt);
        }
        return history;
    }

    private void addHistoryEntry(ArrayNode history, BigDecimal rate, LocalDateTime updatedAt) {
        ObjectNode entry = objectMapper.createObjectNode();
        entry.put("value", rate);
        entry.put("updatedAt", updatedAt.toString());
        history.add(entry);
    }

    private void saveSetting(
            String key,
            BigDecimal value,
            String description,
            LocalDateTime updatedAt,
            ArrayNode history
    ) {
        ObjectNode setting = objectMapper.createObjectNode();
        setting.put("value", value);
        setting.put("type", "NUMBER");
        setting.put("updatedAt", updatedAt.toString());
        if (history != null) {
            setting.set("history", history);
        }

        try {
            jdbcTemplate.update(SETTINGS_UPSERT_SQL, key, objectMapper.writeValueAsString(setting), description);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Không thể tuần tự hóa cấu hình hệ thống", ex);
        }
    }
}
