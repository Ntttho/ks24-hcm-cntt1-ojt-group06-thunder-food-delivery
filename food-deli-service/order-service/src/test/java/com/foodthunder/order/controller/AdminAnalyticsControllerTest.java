package com.foodthunder.order.controller;

import com.foodthunder.order.dto.analytics.AdminAnalyticsSummaryResponse;
import com.foodthunder.order.dto.analytics.MonthlyRevenuePointDto;
import com.foodthunder.order.exception.BadRequestException;
import com.foodthunder.order.service.analytics.AdminAnalyticsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
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
    @DisplayName("GET /api/v1/admin/analytics/summary với ROLE_ADMIN trả về 200 OK và đủ chỉ số")
    void getPlatformAnalyticsSummary_asAdmin_returns200() throws Exception {
        List<MonthlyRevenuePointDto> monthlyPoints = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            monthlyPoints.add(MonthlyRevenuePointDto.builder()
                    .month(String.format("%02d/2026", m))
                    .label("T" + m)
                    .revenue(m == 3 ? new BigDecimal("15800000.00") : BigDecimal.ZERO)
                    .completedOrdersCount(m == 3 ? 12L : 0L)
                    .build());
        }

        AdminAnalyticsSummaryResponse response = AdminAnalyticsSummaryResponse.builder()
                .year(2026)
                .totalRevenue(new BigDecimal("158420000.00"))
                .yearlyRevenue(new BigDecimal("15800000.00"))
                .monthlyRevenue(monthlyPoints)
                .totalUsersCount(1250L)
                .totalRestaurantsCount(48L)
                .totalMerchantsCount(32L)
                .completedOrdersCount(890L)
                .totalOrdersCount(940L)
                .orderSuccessRate(94.68)
                .totalFoodItemsCount(420L)
                .partialData(false)
                .warnings(Collections.emptyList())
                .build();

        when(adminAnalyticsService.getPlatformAnalyticsSummary(eq(2026))).thenReturn(response);

        mockMvc.perform(get("/api/v1/admin/analytics/summary")
                        .param("year", "2026")
                        .header("X-User-Role", "ROLE_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.totalRevenue").value(158420000.00))
                .andExpect(jsonPath("$.data.monthlyRevenue.length()").value(12))
                .andExpect(jsonPath("$.data.totalUsersCount").value(1250))
                .andExpect(jsonPath("$.data.totalRestaurantsCount").value(48))
                .andExpect(jsonPath("$.data.totalMerchantsCount").value(32))
                .andExpect(jsonPath("$.data.completedOrdersCount").value(890))
                .andExpect(jsonPath("$.data.totalOrdersCount").value(940))
                .andExpect(jsonPath("$.data.orderSuccessRate").value(94.68))
                .andExpect(jsonPath("$.data.totalFoodItemsCount").value(420));
    }

    @Test
    @DisplayName("GET /api/v1/admin/analytics/summary với header ADMIN không truyền year mặc định vẫn trả 200")
    void getPlatformAnalyticsSummary_shortAdminRoleWithoutYear_returns200() throws Exception {
        AdminAnalyticsSummaryResponse response = AdminAnalyticsSummaryResponse.builder()
                .year(2026)
                .totalRevenue(BigDecimal.ZERO)
                .yearlyRevenue(BigDecimal.ZERO)
                .monthlyRevenue(Collections.emptyList())
                .orderSuccessRate(0.0)
                .warnings(Collections.emptyList())
                .build();

        when(adminAnalyticsService.getPlatformAnalyticsSummary(isNull())).thenReturn(response);

        mockMvc.perform(get("/api/v1/admin/analytics/summary")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200));
    }

    @Test
    @DisplayName("GET /api/v1/admin/analytics/summary với ROLE_CUSTOMER trả về 403 Forbidden")
    void getPlatformAnalyticsSummary_nonAdminRole_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/analytics/summary")
                        .header("X-User-Role", "ROLE_CUSTOMER"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("GET /api/v1/admin/analytics/summary thiếu header X-User-Role trả về 401 Unauthorized")
    void getPlatformAnalyticsSummary_missingRoleHeader_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/analytics/summary"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("GET /api/v1/admin/analytics/summary với year không hợp lệ trả về 400 Bad Request")
    void getPlatformAnalyticsSummary_invalidYear_returns400() throws Exception {
        when(adminAnalyticsService.getPlatformAnalyticsSummary(eq(1900)))
                .thenThrow(new BadRequestException("Năm thống kê phải nằm trong khoảng 2020 - 2100"));

        mockMvc.perform(get("/api/v1/admin/analytics/summary")
                        .param("year", "1900")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("GET /api/v1/admin/analytics/summary với year sai định dạng chuỗi trả về 400 Bad Request")
    void getPlatformAnalyticsSummary_nonNumericYear_returns400() throws Exception {
        mockMvc.perform(get("/api/v1/admin/analytics/summary")
                        .param("year", "abc")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}

