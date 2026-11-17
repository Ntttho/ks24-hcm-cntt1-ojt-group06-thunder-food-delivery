package com.foodthunder.manager;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.manager.dto.UpdateSystemSettingsRequest;
import com.foodthunder.manager.repository.SystemSettingRepository;
import com.foodthunder.manager.service.SystemSettingsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:manager;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.cloud.config.enabled=false",
        "eureka.client.enabled=false"
})
@AutoConfigureMockMvc
class ManagerServiceIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private SystemSettingsService settingsService;
    @Autowired private SystemSettingRepository settingsRepository;

    @Test
    void shouldSeedUpdateAndPersistSystemSettings() throws Exception {
        mockMvc.perform(get("/api/v1/admin/system-settings").header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.defaultShippingFee").value(15000))
                .andExpect(jsonPath("$.data.platformCommissionRate").value(15));

        UpdateSystemSettingsRequest request = new UpdateSystemSettingsRequest(
                new BigDecimal("18000"), new BigDecimal("6000"), new BigDecimal("12.5"));
        mockMvc.perform(put("/api/v1/admin/system-settings")
                        .header("X-User-Role", "ROLE_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.defaultShippingFee").value(18000))
                .andExpect(jsonPath("$.data.platformCommissionRate").value(12.5));

        assertThat(settingsService.getAdminSettings().shippingFeePerKilometer())
                .isEqualByComparingTo("6000");
        JsonNode commission = objectMapper.readTree(settingsRepository.findByConfigKey("platform_commission_rate")
                .orElseThrow().getConfigValue());
        if (commission.isTextual()) commission = objectMapper.readTree(commission.textValue());
        assertThat(commission.path("history").size()).isEqualTo(2);
    }

    @Test
    void shouldSupportGenericSettingsAndReportMissingOrDuplicateKeys() throws Exception {
        String request = """
                {"configKey":"delivery_cutoff","configValue":{"value":15,"type":"NUMBER"},"description":"Cutoff"}
                """;
        mockMvc.perform(post("/api/v1/admin/settings")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.configKey").value("delivery_cutoff"));

        mockMvc.perform(post("/api/v1/admin/settings")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isConflict());
        mockMvc.perform(get("/api/v1/admin/settings/key/not_configured")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/admin/settings").header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldRejectNegativeFees() throws Exception {
        JsonNode request = objectMapper.valueToTree(new UpdateSystemSettingsRequest(
                new BigDecimal("-1"), BigDecimal.ZERO, BigDecimal.TEN));
        mockMvc.perform(put("/api/v1/admin/system-settings")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.defaultShippingFee").exists());
    }
}
