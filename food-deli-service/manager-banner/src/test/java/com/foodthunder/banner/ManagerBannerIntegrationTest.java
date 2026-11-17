package com.foodthunder.banner;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:banner;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.cloud.config.enabled=false",
        "eureka.client.enabled=false"
})
@AutoConfigureMockMvc
class ManagerBannerIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void shouldPersistCampaignAndServeOnlyActiveCampaignBanners() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        String campaign = objectMapper.writeValueAsString(java.util.Map.of(
                "name", "Summer sale",
                "description", "Seasonal promotion",
                "startDate", now.minusHours(1).toString(),
                "endDate", now.plusHours(1).toString(),
                "status", "ACTIVE"));
        String response = mockMvc.perform(post("/api/v1/admin/campaigns")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(campaign))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode campaignNode = objectMapper.readTree(response).path("data");
        long campaignId = campaignNode.path("id").asLong();

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

        String futureCampaign = objectMapper.writeValueAsString(java.util.Map.of(
                "name", "Upcoming sale",
                "startDate", now.plusDays(1).toString(),
                "endDate", now.plusDays(2).toString(),
                "status", "ACTIVE"));
        String futureResponse = mockMvc.perform(post("/api/v1/admin/campaigns")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(futureCampaign))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long futureCampaignId = objectMapper.readTree(futureResponse).path("data").path("id").asLong();
        String futureBanner = objectMapper.writeValueAsString(java.util.Map.of(
                "title", "Upcoming banner",
                "imageUrl", "https://cdn.example.com/upcoming.jpg",
                "campaignId", futureCampaignId,
                "isActive", true,
                "displayOrder", 2));
        mockMvc.perform(post("/api/v1/admin/banners")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(futureBanner))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/banners/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));

        String updatedBanner = objectMapper.writeValueAsString(java.util.Map.of(
                "title", "Updated summer banner",
                "imageUrl", "https://cdn.example.com/banner.jpg",
                "campaignId", campaignId,
                "isActive", true,
                "displayOrder", 1));
        mockMvc.perform(put("/api/v1/admin/banners/{id}", bannerId)
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatedBanner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Updated summer banner"));

        mockMvc.perform(delete("/api/v1/admin/campaigns/{id}", campaignId)
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/banners/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].campaignId").value(org.hamcrest.Matchers.nullValue()));
        mockMvc.perform(delete("/api/v1/admin/banners/{id}", bannerId)
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/admin/banners/{id}", bannerId)
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/v1/admin/banners")
                        .header("X-User-Role", "ADMIN")
                        .param("search", "upcoming")
                        .param("status", "ACTIVE")
                        .param("page", "0")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    void shouldRejectInvalidImageDateRangeAndNonAdminOperations() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        String invalidCampaign = objectMapper.writeValueAsString(java.util.Map.of(
                "name", "Invalid range",
                "startDate", now.plusDays(2).toString(),
                "endDate", now.toString(),
                "status", "ACTIVE"));
        mockMvc.perform(post("/api/v1/admin/campaigns")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidCampaign))
                .andExpect(status().isBadRequest());

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

        String invalidTarget = objectMapper.writeValueAsString(java.util.Map.of(
                "title", "Bad target",
                "imageUrl", "https://cdn.example.com/valid.jpg",
                "targetUrl", "javascript:alert(1)",
                "isActive", true,
                "displayOrder", 1));
        mockMvc.perform(post("/api/v1/admin/banners")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidTarget))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/v1/admin/campaigns").header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isForbidden());
    }
}
