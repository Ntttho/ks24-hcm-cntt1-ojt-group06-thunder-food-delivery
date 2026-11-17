package com.foodthunder.manager.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.foodthunder.manager.dto.SettingRequest;
import com.foodthunder.manager.dto.SettingResponse;
import com.foodthunder.manager.dto.SystemSettingsResponse;
import com.foodthunder.manager.dto.UpdateSystemSettingsRequest;
import com.foodthunder.manager.entity.SystemSetting;
import com.foodthunder.manager.exception.ConflictException;
import com.foodthunder.manager.exception.ResourceNotFoundException;
import com.foodthunder.manager.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SystemSettingsService {
    private static final String DEFAULT_SHIPPING_FEE = "default_shipping_fee";
    private static final String SHIPPING_FEE_PER_KILOMETER = "shipping_fee_per_kilometer";
    private static final String PLATFORM_COMMISSION_RATE = "platform_commission_rate";
    private final SystemSettingRepository repository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<SettingResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SettingResponse findById(Integer id) {
        return toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cấu hình với id=" + id)));
    }

    @Transactional(readOnly = true)
    public SettingResponse findByKey(String key) {
        return toResponse(repository.findByConfigKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cấu hình với key=" + key)));
    }

    @Transactional
    public SettingResponse create(SettingRequest request) {
        if (repository.existsByConfigKey(request.configKey())) {
            throw new ConflictException("Cấu hình đã tồn tại với key=" + request.configKey());
        }
        SystemSetting setting = new SystemSetting();
        setting.setConfigKey(request.configKey());
        setting.setConfigValue(writeJson(request.configValue()));
        setting.setDescription(request.description());
        return toResponse(repository.save(setting));
    }

    @Transactional
    public SettingResponse update(Integer id, SettingRequest request) {
        SystemSetting setting = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cấu hình với id=" + id));
        if (!setting.getConfigKey().equals(request.configKey())
                && repository.existsByConfigKey(request.configKey())) {
            throw new ConflictException("Cấu hình đã tồn tại với key=" + request.configKey());
        }
        setting.setConfigKey(request.configKey());
        setting.setConfigValue(writeJson(request.configValue()));
        setting.setDescription(request.description());
        return toResponse(repository.save(setting));
    }

    @Transactional(readOnly = true)
    public SystemSettingsResponse getAdminSettings() {
        SystemSetting shipping = repository.findByConfigKey(DEFAULT_SHIPPING_FEE).orElseThrow(
                () -> new ResourceNotFoundException("Thiếu cấu hình phí giao hàng mặc định"));
        SystemSetting perKm = repository.findByConfigKey(SHIPPING_FEE_PER_KILOMETER).orElseThrow(
                () -> new ResourceNotFoundException("Thiếu cấu hình phí giao hàng theo kilomet"));
        SystemSetting commission = repository.findByConfigKey(PLATFORM_COMMISSION_RATE).orElseThrow(
                () -> new ResourceNotFoundException("Thiếu cấu hình tỷ lệ hoa hồng"));
        return new SystemSettingsResponse(
                readNumber(shipping, "value"), shipping.getUpdatedAt(),
                readNumber(perKm, "value"), perKm.getUpdatedAt(),
                readNumber(commission, "value"), commission.getUpdatedAt());
    }

    @Transactional
    public SystemSettingsResponse updateAdminSettings(UpdateSystemSettingsRequest request) {
        saveNumber(DEFAULT_SHIPPING_FEE, request.defaultShippingFee(), "Phí giao hàng mặc định (VNĐ)");
        saveNumber(SHIPPING_FEE_PER_KILOMETER, request.shippingFeePerKilometer(),
                "Phí giao hàng trên mỗi kilomet (VNĐ/km)");
        saveNumber(PLATFORM_COMMISSION_RATE, request.platformCommissionRate(), "Tỷ lệ hoa hồng nền tảng (%)");
        repository.flush();
        return getAdminSettings();
    }

    private void saveNumber(String key, BigDecimal value, String description) {
        SystemSetting setting = repository.findByConfigKey(key).orElseGet(SystemSetting::new);
        JsonNode previous = setting.getConfigValue() == null ? null : readConfigJson(setting.getConfigValue());
        setting.setConfigKey(key);
        setting.setDescription(description);
        ObjectNode stored = objectMapper.createObjectNode();
        stored.put("value", value);
        stored.put("type", "NUMBER");
        LocalDateTime updatedAt = LocalDateTime.now();
        stored.put("updatedAt", updatedAt.toString());
        if (PLATFORM_COMMISSION_RATE.equals(key)) {
            stored.set("history", commissionHistory(previous, value, updatedAt));
        }
        setting.setConfigValue(writeJson(stored));
        repository.save(setting);
    }

    private ArrayNode commissionHistory(JsonNode previous, BigDecimal value, LocalDateTime updatedAt) {
        ArrayNode history = objectMapper.createArrayNode();
        JsonNode previousHistory = previous == null ? null : previous.get("history");
        if (previousHistory != null && previousHistory.isArray()) {
            history.addAll((ArrayNode) previousHistory);
        } else if (previous != null && previous.has("value") && previous.hasNonNull("updatedAt")) {
            ObjectNode previousEntry = objectMapper.createObjectNode();
            previousEntry.set("value", previous.get("value"));
            previousEntry.set("updatedAt", previous.get("updatedAt"));
            history.add(previousEntry);
        }

        JsonNode lastValue = history.isEmpty() ? (previous == null ? null : previous.get("value"))
                : history.get(history.size() - 1).get("value");
        if (lastValue == null || !lastValue.isNumber()
                || lastValue.decimalValue().compareTo(value) != 0 || history.isEmpty()) {
            ObjectNode nextEntry = objectMapper.createObjectNode();
            nextEntry.put("value", value);
            nextEntry.put("updatedAt", updatedAt.toString());
            history.add(nextEntry);
        }
        return history;
    }

    private BigDecimal readNumber(SystemSetting setting, String field) {
        JsonNode value = readConfigJson(setting.getConfigValue()).get(field);
        if (value == null || !value.isNumber()) {
            throw new IllegalStateException("Giá trị cấu hình không phải số: " + setting.getConfigKey());
        }
        return value.decimalValue();
    }

    private SettingResponse toResponse(SystemSetting setting) {
        return new SettingResponse(setting.getId(), setting.getConfigKey(),
                readConfigJson(setting.getConfigValue()), setting.getDescription(),
                setting.getCreatedAt(), setting.getUpdatedAt());
    }

    private JsonNode readConfigJson(String value) {
        try {
            JsonNode node = objectMapper.readTree(value);
            return node.isTextual() ? objectMapper.readTree(node.textValue()) : node;
        } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
            throw new IllegalStateException("Giá trị cấu hình không phải JSON hợp lệ", ex);
        }
    }

    private String writeJson(JsonNode value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
            throw new IllegalArgumentException("Không thể tuần tự hóa giá trị cấu hình", ex);
        }
    }
}
