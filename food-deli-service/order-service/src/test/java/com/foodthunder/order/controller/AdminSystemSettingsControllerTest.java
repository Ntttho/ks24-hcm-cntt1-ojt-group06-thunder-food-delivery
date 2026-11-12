package com.foodthunder.order.controller;

import com.foodthunder.order.dto.settings.SystemSettingsResponse;
import com.foodthunder.order.service.SystemSettingsService;
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
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminSystemSettingsController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminSystemSettingsControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SystemSettingsService systemSettingsService;

    @Test
    @DisplayName("Admin can read system settings")
    void getSettings_asAdmin_returnsSettings() throws Exception {
        when(systemSettingsService.getSettings()).thenReturn(SystemSettingsResponse.builder()
                .defaultShippingFee(new BigDecimal("10000"))
                .shippingFeePerKilometer(new BigDecimal("5000"))
                .platformCommissionRate(new BigDecimal("10"))
                .build());

        mockMvc.perform(get("/api/v1/admin/system-settings")
                        .header("X-User-Role", "ROLE_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.defaultShippingFee").value(10000))
                .andExpect(jsonPath("$.data.shippingFeePerKilometer").value(5000))
                .andExpect(jsonPath("$.data.platformCommissionRate").value(10));
    }

    @Test
    @DisplayName("Non-admin cannot update system settings")
    void updateSettings_asCustomer_returnsForbidden() throws Exception {
        mockMvc.perform(put("/api/v1/admin/system-settings")
                        .header("X-User-Role", "ROLE_CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "defaultShippingFee": 10000,
                                  "shippingFeePerKilometer": 5000,
                                  "platformCommissionRate": 10
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        verifyNoInteractions(systemSettingsService);
    }

    @Test
    @DisplayName("Rejects negative shipping fee and commission above 100 percent")
    void updateSettings_invalidValues_returnsBadRequest() throws Exception {
        mockMvc.perform(put("/api/v1/admin/system-settings")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "defaultShippingFee": -1,
                                  "shippingFeePerKilometer": 5000,
                                  "platformCommissionRate": 101
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.defaultShippingFee").exists())
                .andExpect(jsonPath("$.data.platformCommissionRate").exists());
    }

    @Test
    @DisplayName("Admin update returns the persisted settings")
    void updateSettings_asAdmin_returnsUpdatedSettings() throws Exception {
        when(systemSettingsService.updateSettings(any())).thenReturn(SystemSettingsResponse.builder()
                .defaultShippingFee(new BigDecimal("12000"))
                .shippingFeePerKilometer(new BigDecimal("6000"))
                .platformCommissionRate(new BigDecimal("15"))
                .build());

        mockMvc.perform(put("/api/v1/admin/system-settings")
                        .header("X-User-Role", "ROLE_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "defaultShippingFee": 12000,
                                  "shippingFeePerKilometer": 6000,
                                  "platformCommissionRate": 15
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.defaultShippingFee").value(12000))
                .andExpect(jsonPath("$.data.platformCommissionRate").value(15));
    }
}
