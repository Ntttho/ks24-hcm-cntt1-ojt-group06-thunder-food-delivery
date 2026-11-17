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
import java.time.LocalDateTime;

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

    @Test
    void shouldManageBannerAndCampaignLifecycle() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        String campaign = objectMapper.writeValueAsString(java.util.Map.of(
                "name", "Summer sale",
                "description", "Seasonal promotion",
                "startDate", now.minusHours(1).toString(),
                "endDate", now.plusHours(1).toString(),
                "status", "ACTIVE"));
        String campaignResponse = mockMvc.perform(post("/api/v1/admin/campaigns")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(campaign))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long campaignId = objectMapper.readTree(campaignResponse).path("data").path("id").asLong();

        String banner = objectMapper.writeValueAsString(java.util.Map.of(
                "title", "Summer banner",
                "description", "Limited time",
                "imageUrl", "https://cdn.example.com/banner.jpg",
                "targetUrl", "/restaurants",
                "campaignId", campaignId,
                "isActive", true,
                "displayOrder", 1));
        String bannerResponse = mockMvc.perform(post("/api/v1/admin/banners")
                        .header("X-User-Role", "ROLE_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(banner))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.campaignId").value(campaignId))
                .andReturn().getResponse().getContentAsString();
        long bannerId = objectMapper.readTree(bannerResponse).path("data").path("id").asLong();

        mockMvc.perform(get("/api/v1/banners/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].title").value("Summer banner"));

        String invalidBanner = objectMapper.writeValueAsString(java.util.Map.of(
                "title", "Bad image",
                "imageUrl", "javascript:alert(1)",
                "targetUrl", "javascript:alert(1)",
                "isActive", true,
                "displayOrder", 1));
        mockMvc.perform(post("/api/v1/admin/banners")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidBanner))
                .andExpect(status().isBadRequest());

        mockMvc.perform(delete("/api/v1/admin/campaigns/{id}", campaignId)
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/banners/active"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/admin/banners/{id}", bannerId)
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/admin/banners/{id}", bannerId)
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/v1/admin/banners")
                        .header("X-User-Role", "ADMIN")
                        .param("search", "summer")
                        .param("status", "ACTIVE")
                        .param("page", "0")
                        .param("size", "5"))
                .andExpect(status().isOk());
    }
}
