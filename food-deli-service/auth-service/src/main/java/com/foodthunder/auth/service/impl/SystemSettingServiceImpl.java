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
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
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

    private final SystemSettingRepository systemSettingRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public SystemSettingsResponse getSystemSettings() {
        OrderCostConfigDto costConfig = getOrderCostConfig();
        Map<String, Object> commissionMap = readConfigMap(KEY_COMMISSION_CONFIG);
        BigDecimal commissionPercent = readRequiredDecimal(
                commissionMap, "platform_fee_percent", KEY_COMMISSION_CONFIG);

        return SystemSettingsResponse.builder()
                .baseKm(costConfig.getBaseKm())
                .baseFee(costConfig.getBaseFee())
                .extraPerKm(costConfig.getExtraPerKm())
                .priorityFee(costConfig.getPriorityFee())
                .serviceFee(costConfig.getServiceFee())
                .vatRate(costConfig.getVatRate().multiply(BigDecimal.valueOf(100)))
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
        taxMap.put("vat_rate", request.getVatRate().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        taxMap.put("vat_included", request.getVatIncluded());
        upsertConfig(KEY_TAX_CONFIG, taxMap, "Cấu hình thuế VAT trên đơn hàng");

        Map<String, Object> commissionMap = new LinkedHashMap<>();
        commissionMap.put("platform_fee_percent", request.getPlatformCommissionPercent());
        upsertConfig(KEY_COMMISSION_CONFIG, commissionMap, "Cấu hình tỷ lệ hoa hồng sàn (%)");
        upsertCommissionRate(request.getPlatformCommissionPercent());

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
                .baseKm(readRequiredDouble(shippingMap, "base_km", KEY_SHIPPING_CONFIG))
                .baseFee(readRequiredDecimal(shippingMap, "base_fee", KEY_SHIPPING_CONFIG))
                .extraPerKm(readRequiredDecimal(shippingMap, "extra_per_km", KEY_SHIPPING_CONFIG))
                .priorityFee(readRequiredDecimal(shippingMap, "priority_fee", KEY_SHIPPING_CONFIG))
                .serviceFee(readRequiredDecimal(orderFeeMap, "service_fee", KEY_ORDER_FEE_CONFIG))
                .vatRate(readRequiredDecimal(taxMap, "vat_rate", KEY_TAX_CONFIG))
                .vatIncluded(readRequiredBoolean(taxMap, "vat_included", KEY_TAX_CONFIG))
                .platformCommissionPercent(readRequiredDecimal(
                        readConfigMap(KEY_COMMISSION_CONFIG), "platform_fee_percent", KEY_COMMISSION_CONFIG))
                .build();
    }

    private void upsertCommissionRate(BigDecimal newRate) {
        LocalDateTime now = LocalDateTime.now();
        Map<String, Object> previous = readConfigMap("platform_commission_rate");
        var history = new ArrayList<Map<String, Object>>();
        Object previousHistory = previous.get("history");
        if (previousHistory instanceof Iterable<?> entries) {
            for (Object entry : entries) {
                if (entry instanceof Map<?, ?> map) {
                    Map<String, Object> copy = new LinkedHashMap<>();
                    map.forEach((key, value) -> copy.put(String.valueOf(key), value));
                    history.add(copy);
                }
            }
        } else if (previous.get("value") != null && previous.get("updatedAt") != null) {
            history.add(Map.of("value", previous.get("value"), "updatedAt", previous.get("updatedAt")));
        }

        BigDecimal previousRate = readDecimal(previous, "value", null);
        if (history.isEmpty() || previousRate == null || previousRate.compareTo(newRate) != 0) {
            history.add(Map.of("value", newRate, "updatedAt", now.toString()));
        }

        Map<String, Object> commissionSetting = new LinkedHashMap<>();
        commissionSetting.put("value", newRate);
        commissionSetting.put("type", "NUMBER");
        commissionSetting.put("updatedAt", now.toString());
        commissionSetting.put("history", history);
        upsertConfig("platform_commission_rate", commissionSetting, "Tỷ lệ hoa hồng nền tảng (%)");
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
                        throw new IllegalStateException("Giá trị cấu hình không phải JSON hợp lệ: " + key, ex);
                    }
                })
                .orElse(Collections.emptyMap());
    }

    private double readRequiredDouble(Map<String, Object> map, String field, String configKey) {
        Object value = map.get(field);
        if (value instanceof Number number) {
            double result = number.doubleValue();
            if (Double.isFinite(result)) return result;
        }
        throw new IllegalStateException("Thiếu hoặc sai kiểu cấu hình " + configKey + "." + field);
    }

    private BigDecimal readRequiredDecimal(Map<String, Object> map, String field, String configKey) {
        BigDecimal value = readDecimal(map, field, null);
        if (value == null) {
            throw new IllegalStateException("Thiếu hoặc sai kiểu cấu hình " + configKey + "." + field);
        }
        return value;
    }

    private boolean readRequiredBoolean(Map<String, Object> map, String field, String configKey) {
        Object value = map.get(field);
        if (value instanceof Boolean result) return result;
        throw new IllegalStateException("Thiếu hoặc sai kiểu cấu hình " + configKey + "." + field);
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
}
