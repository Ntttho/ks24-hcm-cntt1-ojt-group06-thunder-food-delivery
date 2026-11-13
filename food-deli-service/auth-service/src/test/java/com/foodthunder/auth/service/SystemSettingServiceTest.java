package com.foodthunder.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.auth.dto.OrderCostConfigDto;
import com.foodthunder.auth.dto.SystemSettingsResponse;
import com.foodthunder.auth.dto.UpdateSystemSettingsRequest;
import com.foodthunder.auth.model.SystemSetting;
import com.foodthunder.auth.repository.SystemSettingRepository;
import com.foodthunder.auth.service.impl.SystemSettingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SystemSettingServiceTest {

    @Mock
    private SystemSettingRepository systemSettingRepository;

    private SystemSettingServiceImpl systemSettingService;

    @BeforeEach
    void setUp() {
        systemSettingService = new SystemSettingServiceImpl(systemSettingRepository, new ObjectMapper());
    }

    @Test
    @DisplayName("Trả về cấu hình mặc định khi bảng system_settings chưa có dữ liệu")
    void getSystemSettings_returnsDefaultsWhenEmpty() {
        when(systemSettingRepository.findByConfigKey(any())).thenReturn(Optional.empty());

        SystemSettingsResponse response = systemSettingService.getSystemSettings();

        assertThat(response.getBaseKm()).isEqualTo(2.0);
        assertThat(response.getBaseFee()).isEqualByComparingTo(BigDecimal.valueOf(15000));
        assertThat(response.getExtraPerKm()).isEqualByComparingTo(BigDecimal.valueOf(5000));
        assertThat(response.getPriorityFee()).isEqualByComparingTo(BigDecimal.valueOf(5000));
        assertThat(response.getServiceFee()).isEqualByComparingTo(BigDecimal.valueOf(3000));
        assertThat(response.getVatRate()).isEqualByComparingTo(new BigDecimal("0.08"));
        assertThat(response.getVatIncluded()).isTrue();
        assertThat(response.getPlatformCommissionPercent()).isEqualByComparingTo(new BigDecimal("15.0"));
    }

    @Test
    @DisplayName("Đọc đúng cấu hình JSON đã lưu trong system_settings")
    void getOrderCostConfig_parsesStoredJson() {
        when(systemSettingRepository.findByConfigKey(SystemSettingServiceImpl.KEY_SHIPPING_CONFIG))
                .thenReturn(Optional.of(SystemSetting.builder()
                        .configKey(SystemSettingServiceImpl.KEY_SHIPPING_CONFIG)
                        .configValue("{\"base_km\": 3.0, \"base_fee\": 20000, \"extra_per_km\": 6000, \"priority_fee\": 7000}")
                        .build()));
        when(systemSettingRepository.findByConfigKey(SystemSettingServiceImpl.KEY_ORDER_FEE_CONFIG))
                .thenReturn(Optional.of(SystemSetting.builder()
                        .configKey(SystemSettingServiceImpl.KEY_ORDER_FEE_CONFIG)
                        .configValue("{\"service_fee\": 4000}")
                        .build()));
        when(systemSettingRepository.findByConfigKey(SystemSettingServiceImpl.KEY_TAX_CONFIG))
                .thenReturn(Optional.of(SystemSetting.builder()
                        .configKey(SystemSettingServiceImpl.KEY_TAX_CONFIG)
                        .configValue("{\"vat_rate\": 0.10, \"vat_included\": false}")
                        .build()));

        OrderCostConfigDto dto = systemSettingService.getOrderCostConfig();

        assertThat(dto.getBaseKm()).isEqualTo(3.0);
        assertThat(dto.getBaseFee()).isEqualByComparingTo(BigDecimal.valueOf(20000));
        assertThat(dto.getExtraPerKm()).isEqualByComparingTo(BigDecimal.valueOf(6000));
        assertThat(dto.getPriorityFee()).isEqualByComparingTo(BigDecimal.valueOf(7000));
        assertThat(dto.getServiceFee()).isEqualByComparingTo(BigDecimal.valueOf(4000));
        assertThat(dto.getVatRate()).isEqualByComparingTo(new BigDecimal("0.10"));
        assertThat(dto.getVatIncluded()).isFalse();
    }

    @Test
    @DisplayName("Cập nhật cấu hình chi phí order lưu đúng 4 config keys vào DB")
    void updateSystemSettings_savesAllConfigKeys() {
        when(systemSettingRepository.findByConfigKey(any())).thenReturn(Optional.empty());
        when(systemSettingRepository.save(any(SystemSetting.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateSystemSettingsRequest req = UpdateSystemSettingsRequest.builder()
                .baseKm(2.5)
                .baseFee(BigDecimal.valueOf(18000))
                .extraPerKm(BigDecimal.valueOf(5500))
                .priorityFee(BigDecimal.valueOf(6000))
                .serviceFee(BigDecimal.valueOf(3500))
                .vatRate(new BigDecimal("0.08"))
                .vatIncluded(false)
                .platformCommissionPercent(new BigDecimal("16.0"))
                .build();

        SystemSettingsResponse response = systemSettingService.updateSystemSettings(req);

        assertThat(response.getBaseFee()).isEqualByComparingTo(BigDecimal.valueOf(18000));
        assertThat(response.getServiceFee()).isEqualByComparingTo(BigDecimal.valueOf(3500));
        assertThat(response.getVatIncluded()).isFalse();
        assertThat(response.getPlatformCommissionPercent()).isEqualByComparingTo(new BigDecimal("16.0"));

        ArgumentCaptor<SystemSetting> captor = ArgumentCaptor.forClass(SystemSetting.class);
        verify(systemSettingRepository, times(4)).save(captor.capture());
        List<String> savedKeys = captor.getAllValues().stream().map(SystemSetting::getConfigKey).toList();
        assertThat(savedKeys).containsExactlyInAnyOrder(
                SystemSettingServiceImpl.KEY_SHIPPING_CONFIG,
                SystemSettingServiceImpl.KEY_ORDER_FEE_CONFIG,
                SystemSettingServiceImpl.KEY_TAX_CONFIG,
                SystemSettingServiceImpl.KEY_COMMISSION_CONFIG
        );
    }
}
