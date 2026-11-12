package com.foodthunder.auth.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.auth.dto.OrderCostConfigDto;
import com.foodthunder.auth.dto.SystemSettingsResponse;
import com.foodthunder.auth.dto.UpdateSystemSettingsRequest;
import com.foodthunder.auth.model.SystemSetting;
import com.foodthunder.auth.repository.SystemSettingRepository;
import com.foodthunder.auth.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemSettingServiceImpl implements SystemSettingService {

    public static final String KEY_SHIPPING_CONFIG = "shipping_config";
    public static final String KEY_ORDER_FEE_CONFIG = "order_fee_config";
    public static final String KEY_TAX_CONFIG = "tax_config";
    public static final String KEY_COMMISSION_CONFIG = "commission_config";

    private static final double DEFAULT_BASE_KM = 2.0;
    private static final BigDecimal DEFAULT_BASE_FEE = new BigDecimal("15000");
    private static final BigDecimal DEFAULT_EXTRA_PER_KM = new BigDecimal("5000");
    private static final BigDecimal DEFAULT_PRIORITY_FEE = new BigDecimal("5000");
    private static final BigDecimal DEFAULT_SERVICE_FEE = new BigDecimal("3000");
    private static final BigDecimal DEFAULT_VAT_RATE = new BigDecimal("0.08");
    private static final boolean DEFAULT_VAT_INCLUDED = true;
    private static final BigDecimal DEFAULT_COMMISSION_PERCENT = new BigDecimal("15.0");

    private final SystemSettingRepository systemSettingRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public SystemSettingsResponse getSystemSettings() {
        OrderCostConfigDto costConfig = getOrderCostConfig();
        Map<String, Object> commissionMap = readConfigMap(KEY_COMMISSION_CONFIG);
        BigDecimal commissionPercent = readDecimal(commissionMap, "platform_fee_percent", DEFAULT_COMMISSION_PERCENT);

        return SystemSettingsResponse.builder()
                .baseKm(costConfig.getBaseKm())
                .baseFee(costConfig.getBaseFee())
                .extraPerKm(costConfig.getExtraPerKm())
                .priorityFee(costConfig.getPriorityFee())
                .serviceFee(costConfig.getServiceFee())
                .vatRate(costConfig.getVatRate())
                .vatIncluded(costConfig.getVatIncluded())
                .platformCommissionPercent(commissionPercent)
                .build();
    }

    @Override
    @Transactional
    public SystemSettingsResponse updateSystemSettings(UpdateSystemSettingsRequest request) {
        Map<String, Object> shippingMap = new LinkedHashMap<>();
        shippingMap.put("base_km", request.getBaseKm());
        shippingMap.put("base_fee", request.getBaseFee());
        shippingMap.put("extra_per_km", request.getExtraPerKm());
        shippingMap.put("priority_fee", request.getPriorityFee());
        upsertConfig(KEY_SHIPPING_CONFIG, shippingMap, "Cấu hình tính phí giao hàng");

        Map<String, Object> orderFeeMap = new LinkedHashMap<>();
        orderFeeMap.put("service_fee", request.getServiceFee());
        upsertConfig(KEY_ORDER_FEE_CONFIG, orderFeeMap, "Cấu hình phí dịch vụ và đóng gói trên mỗi đơn hàng");

        Map<String, Object> taxMap = new LinkedHashMap<>();
        taxMap.put("vat_rate", request.getVatRate());
        taxMap.put("vat_included", request.getVatIncluded());
        upsertConfig(KEY_TAX_CONFIG, taxMap, "Cấu hình thuế VAT trên đơn hàng");

        Map<String, Object> commissionMap = new LinkedHashMap<>();
        commissionMap.put("platform_fee_percent", request.getPlatformCommissionPercent());
        upsertConfig(KEY_COMMISSION_CONFIG, commissionMap, "Cấu hình tỷ lệ hoa hồng sàn (%)");

        log.info("Updated system settings: baseKm={}, baseFee={}, extraPerKm={}, priorityFee={}, serviceFee={}, vatRate={}, vatIncluded={}, commission={}%",
                request.getBaseKm(), request.getBaseFee(), request.getExtraPerKm(), request.getPriorityFee(),
                request.getServiceFee(), request.getVatRate(), request.getVatIncluded(), request.getPlatformCommissionPercent());

        return SystemSettingsResponse.builder()
                .baseKm(request.getBaseKm())
                .baseFee(request.getBaseFee())
                .extraPerKm(request.getExtraPerKm())
                .priorityFee(request.getPriorityFee())
                .serviceFee(request.getServiceFee())
                .vatRate(request.getVatRate())
                .vatIncluded(request.getVatIncluded())
                .platformCommissionPercent(request.getPlatformCommissionPercent())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderCostConfigDto getOrderCostConfig() {
        Map<String, Object> shippingMap = readConfigMap(KEY_SHIPPING_CONFIG);
        Map<String, Object> orderFeeMap = readConfigMap(KEY_ORDER_FEE_CONFIG);
        Map<String, Object> taxMap = readConfigMap(KEY_TAX_CONFIG);

        return OrderCostConfigDto.builder()
                .baseKm(readDouble(shippingMap, "base_km", DEFAULT_BASE_KM))
                .baseFee(readDecimal(shippingMap, "base_fee", DEFAULT_BASE_FEE))
                .extraPerKm(readDecimal(shippingMap, "extra_per_km", DEFAULT_EXTRA_PER_KM))
                .priorityFee(readDecimal(shippingMap, "priority_fee", DEFAULT_PRIORITY_FEE))
                .serviceFee(readDecimal(orderFeeMap, "service_fee", DEFAULT_SERVICE_FEE))
                .vatRate(readDecimal(taxMap, "vat_rate", DEFAULT_VAT_RATE))
                .vatIncluded(readBoolean(taxMap, "vat_included", DEFAULT_VAT_INCLUDED))
                .build();
    }

    private void upsertConfig(String key, Map<String, Object> payload, String description) {
        try {
            String jsonValue = objectMapper.writeValueAsString(payload);
            SystemSetting setting = systemSettingRepository.findByConfigKey(key)
                    .orElseGet(() -> SystemSetting.builder()
                            .configKey(key)
                            .description(description)
                            .build());
            setting.setConfigValue(jsonValue);
            if (setting.getDescription() == null || setting.getDescription().isBlank()) {
                setting.setDescription(description);
            }
            systemSettingRepository.save(setting);
        } catch (Exception ex) {
            throw new IllegalStateException("Không thể lưu cấu hình hệ thống cho key=" + key, ex);
        }
    }

    private Map<String, Object> readConfigMap(String key) {
        return systemSettingRepository.findByConfigKey(key)
                .map(SystemSetting::getConfigValue)
                .map(json -> {
                    try {
                        return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
                    } catch (Exception ex) {
                        log.warn("Invalid JSON in system_settings for key {}: {}", key, ex.getMessage());
                        return Collections.<String, Object>emptyMap();
                    }
                })
                .orElse(Collections.emptyMap());
    }

    private double readDouble(Map<String, Object> map, String key, double defaultVal) {
        Object val = map.get(key);
        if (val instanceof Number num) {
            return num.doubleValue();
        }
        if (val != null) {
            try {
                return Double.parseDouble(val.toString());
            } catch (NumberFormatException ignored) {
            }
        }
        return defaultVal;
    }

    private BigDecimal readDecimal(Map<String, Object> map, String key, BigDecimal defaultVal) {
        Object val = map.get(key);
        if (val instanceof BigDecimal bd) {
            return bd;
        }
        if (val instanceof Number num) {
            return new BigDecimal(num.toString());
        }
        if (val != null) {
            try {
                return new BigDecimal(val.toString());
            } catch (NumberFormatException ignored) {
            }
        }
        return defaultVal;
    }

    private boolean readBoolean(Map<String, Object> map, String key, boolean defaultVal) {
        Object val = map.get(key);
        if (val instanceof Boolean bool) {
            return bool;
        }
        if (val != null) {
            return Boolean.parseBoolean(val.toString());
        }
        return defaultVal;
    }
}
