package com.foodthunder.order.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.order.dto.settings.UpdateSystemSettingsRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SystemSettingsServiceTest {
    @Mock
    private JdbcTemplate jdbcTemplate;

    private SystemSettingsService systemSettingsService;

    @BeforeEach
    void setUp() {
        systemSettingsService = new SystemSettingsService(jdbcTemplate, new ObjectMapper());
    }

    @Test
    @DisplayName("Reads the existing shipping_config values when per-setting keys have not been initialized")
    void getSettings_shouldReadLegacyShippingConfiguration() {
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), anyString()))
                .thenAnswer(invocation -> {
                    String key = invocation.getArgument(2);
                    return switch (key) {
                        case "shipping_config" -> "{\"base_km\":2,\"base_fee\":15000,\"extra_per_km\":5000}";
                        case "platform_commission_rate" -> "{\"value\":12,\"type\":\"NUMBER\",\"updatedAt\":\"2026-01-01T00:00:00\"}";
                        default -> throw new org.springframework.dao.EmptyResultDataAccessException(1);
                    };
                });

        var settings = systemSettingsService.getSettings();

        assertThat(settings.getDefaultShippingFee()).isEqualByComparingTo("15000");
        assertThat(settings.getShippingFeePerKilometer()).isEqualByComparingTo("5000");
        assertThat(settings.getPlatformCommissionRate()).isEqualByComparingTo("12");
    }

    @Test
    @DisplayName("Applies the commission rate that was effective when the order was created")
    void commissionRateAt_shouldReturnHistoricalRate() {
        String commission = """
                {"value":15,"type":"NUMBER","updatedAt":"2026-02-01T00:00:00",
                 "history":[
                   {"value":10,"updatedAt":"2026-01-01T00:00:00"},
                   {"value":15,"updatedAt":"2026-02-01T00:00:00"}
                 ]}
                """;
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq("platform_commission_rate")))
                .thenReturn(commission);

        assertThat(systemSettingsService.commissionRateAt(LocalDateTime.parse("2026-01-15T12:00:00")))
                .isEqualByComparingTo("10");
        assertThat(systemSettingsService.commissionRateAt(LocalDateTime.parse("2026-02-15T12:00:00")))
                .isEqualByComparingTo("15");
        assertThat(systemSettingsService.commissionRateAt(LocalDateTime.parse("2025-12-31T23:59:59")))
                .isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Upserts each setting using the existing unique config_key")
    void updateSettings_shouldUpsertAllSettingKeys() {
        Map<String, String> persisted = new HashMap<>();
        persisted.put("default_shipping_fee", "{\"value\":10000,\"type\":\"NUMBER\",\"updatedAt\":\"2026-01-01T00:00:00\"}");
        persisted.put("shipping_fee_per_kilometer", "{\"value\":5000,\"type\":\"NUMBER\",\"updatedAt\":\"2026-01-01T00:00:00\"}");
        persisted.put("platform_commission_rate", "{\"value\":10,\"type\":\"NUMBER\",\"updatedAt\":\"2026-01-01T00:00:00\",\"history\":[{\"value\":10,\"updatedAt\":\"2026-01-01T00:00:00\"}]}");
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), anyString()))
                .thenAnswer(invocation -> {
                    String key = invocation.getArgument(2);
                    String value = persisted.get(key);
                    if (value == null) {
                        throw new org.springframework.dao.EmptyResultDataAccessException(1);
                    }
                    return value;
                });
        when(jdbcTemplate.update(anyString(), any(), any(), any())).thenAnswer(invocation -> {
            persisted.put(invocation.getArgument(1), invocation.getArgument(2));
            return 1;
        });

        UpdateSystemSettingsRequest request = new UpdateSystemSettingsRequest();
        request.setDefaultShippingFee(new BigDecimal("12000"));
        request.setShippingFeePerKilometer(new BigDecimal("6000"));
        request.setPlatformCommissionRate(new BigDecimal("15"));

        var updated = systemSettingsService.updateSettings(request);

        assertThat(updated.getDefaultShippingFee()).isEqualByComparingTo("12000");
        assertThat(updated.getShippingFeePerKilometer()).isEqualByComparingTo("6000");
        assertThat(updated.getPlatformCommissionRate()).isEqualByComparingTo("15");
        verify(jdbcTemplate, times(3)).update(contains("ON DUPLICATE KEY UPDATE"), any(), any(), any());
    }
}
