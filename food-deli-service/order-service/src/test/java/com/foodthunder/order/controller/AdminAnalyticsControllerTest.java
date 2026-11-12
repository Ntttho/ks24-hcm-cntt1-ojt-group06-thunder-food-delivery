package com.foodthunder.order.controller;

import com.foodthunder.order.dto.analytics.AdminAnalyticsSummaryResponse;
import com.foodthunder.order.dto.analytics.MonthlyRevenuePointDto;
import com.foodthunder.order.service.analytics.AdminAnalyticsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminAnalyticsController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminAnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminAnalyticsService adminAnalyticsService;

    @Test
    @DisplayName("GET /api/v1/admin/analytics/summary trả về 200 với ROLE_ADMIN")
    void getSummary_asAdmin_returns200() throws Exception {
        AdminAnalyticsSummaryResponse resp = AdminAnalyticsSummaryResponse.builder()
                .year(2026)
                .totalUsers(50L)
                .totalMerchants(8L)
                .totalRestaurants(12L)
                .totalFoodItems(140L)
                .totalOrders(100L)
                .completedOrders(85L)
                .cancelledOrders(15L)
                .completionRate(85.0)
                .totalGmv(BigDecimal.valueOf(12500000))
                .monthlyRevenue(List.of(MonthlyRevenuePointDto.builder()
                        .month(1).label("T1").revenue(BigDecimal.valueOf(1000000)).orderCount(10L).build()))
                .topRestaurants(List.of())
                .build();

        when(adminAnalyticsService.getAnalyticsSummary(2026)).thenReturn(resp);

        mockMvc.perform(get("/api/v1/admin/analytics/summary")
                        .param("year", "2026")
                        .header("X-User-Role", "ROLE_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.totalGmv").value(12500000))
                .andExpect(jsonPath("$.data.completionRate").value(85.0));
    }

    @Test
    @DisplayName("GET /api/v1/admin/analytics/summary trả về 403 với ROLE_MERCHANT")
    void getSummary_asMerchant_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/analytics/summary")
                        .header("X-User-Role", "ROLE_MERCHANT"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/admin/analytics/summary trả về 401 khi thiếu header X-User-Role")
    void getSummary_withoutRole_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/analytics/summary"))
                .andExpect(status().isUnauthorized());
    }
}

