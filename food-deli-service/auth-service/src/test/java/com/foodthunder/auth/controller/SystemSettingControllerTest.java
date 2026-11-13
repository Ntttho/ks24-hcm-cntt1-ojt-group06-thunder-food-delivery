package com.foodthunder.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.auth.dto.OrderCostConfigDto;
import com.foodthunder.auth.dto.SystemSettingsResponse;
import com.foodthunder.auth.dto.UpdateSystemSettingsRequest;
import com.foodthunder.auth.security.JwtProvider;
import com.foodthunder.auth.service.SystemSettingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SystemSettingController.class)
@AutoConfigureMockMvc(addFilters = false)
class SystemSettingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SystemSettingService systemSettingService;

    @MockBean
    private JwtProvider jwtProvider;

    private SystemSettingsResponse sampleSettings() {
        return SystemSettingsResponse.builder()
                .baseKm(2.0)
                .baseFee(BigDecimal.valueOf(15000))
                .extraPerKm(BigDecimal.valueOf(5000))
                .priorityFee(BigDecimal.valueOf(5000))
                .serviceFee(BigDecimal.valueOf(3000))
                .vatRate(new BigDecimal("0.08"))
                .vatIncluded(true)
                .platformCommissionPercent(new BigDecimal("15.0"))
                .build();
    }

    private OrderCostConfigDto sampleCostConfig() {
        return OrderCostConfigDto.builder()
                .baseKm(2.0)
                .baseFee(BigDecimal.valueOf(15000))
                .extraPerKm(BigDecimal.valueOf(5000))
                .priorityFee(BigDecimal.valueOf(5000))
                .serviceFee(BigDecimal.valueOf(3000))
                .vatRate(new BigDecimal("0.08"))
                .vatIncluded(true)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/admin/settings trả về 200 với ROLE_ADMIN")
    void getAdminSettings_asAdmin_returns200() throws Exception {
        when(systemSettingService.getSystemSettings()).thenReturn(sampleSettings());

        mockMvc.perform(get("/api/v1/admin/settings")
                        .header("X-User-Role", "ROLE_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.baseFee").value(15000))
                .andExpect(jsonPath("$.data.serviceFee").value(3000));
    }

    @Test
    @DisplayName("GET /api/v1/admin/settings trả về 403 với ROLE_CUSTOMER")
    void getAdminSettings_asCustomer_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/settings")
                        .header("X-User-Role", "ROLE_CUSTOMER"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/admin/settings trả về 401 khi thiếu X-User-Role")
    void getAdminSettings_withoutRole_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/settings"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PUT /api/v1/admin/settings trả về 200 khi Admin cập nhật hợp lệ")
    void updateAdminSettings_valid_returns200() throws Exception {
        UpdateSystemSettingsRequest req = UpdateSystemSettingsRequest.builder()
                .baseKm(2.5)
                .baseFee(BigDecimal.valueOf(18000))
                .extraPerKm(BigDecimal.valueOf(6000))
                .priorityFee(BigDecimal.valueOf(5000))
                .serviceFee(BigDecimal.valueOf(4000))
                .vatRate(new BigDecimal("0.08"))
                .vatIncluded(false)
                .platformCommissionPercent(new BigDecimal("16.0"))
                .build();

        SystemSettingsResponse updated = sampleSettings();
        updated.setBaseFee(BigDecimal.valueOf(18000));
        when(systemSettingService.updateSystemSettings(any())).thenReturn(updated);

        mockMvc.perform(put("/api/v1/admin/settings")
                        .header("X-User-Role", "ROLE_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.baseFee").value(18000));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/settings trả về 400 khi baseFee âm")
    void updateAdminSettings_invalidNegativeFee_returns400() throws Exception {
        UpdateSystemSettingsRequest req = UpdateSystemSettingsRequest.builder()
                .baseKm(2.0)
                .baseFee(BigDecimal.valueOf(-5000))
                .extraPerKm(BigDecimal.valueOf(5000))
                .priorityFee(BigDecimal.valueOf(5000))
                .serviceFee(BigDecimal.valueOf(3000))
                .vatRate(new BigDecimal("0.08"))
                .vatIncluded(true)
                .platformCommissionPercent(new BigDecimal("15.0"))
                .build();

        mockMvc.perform(put("/api/v1/admin/settings")
                        .header("X-User-Role", "ROLE_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/settings/order-fees public trả về 200 không cần header Admin")
    void getPublicOrderFees_returns200() throws Exception {
        when(systemSettingService.getOrderCostConfig()).thenReturn(sampleCostConfig());

        mockMvc.perform(get("/api/v1/settings/order-fees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.serviceFee").value(3000))
                .andExpect(jsonPath("$.data.priorityFee").value(5000));
    }
}
