package com.foodthunder.order.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.order.dto.revenue.*;
import com.foodthunder.order.service.revenue.MerchantRevenueService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MerchantRevenueController.class)
@AutoConfigureMockMvc(addFilters = false)
class MerchantRevenueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MerchantRevenueService revenueService;

    @Test
    @DisplayName("GET /api/v1/orders/revenue/summary trả về 200 OK và KPI doanh thu")
    void getRevenueSummary_shouldReturn200() throws Exception {
        MerchantRevenueSummaryResponse response = MerchantRevenueSummaryResponse.builder()
                .restaurantId(1)
                .restaurantName("Cơm Tấm Đêm Sài Gòn")
                .period("MONTH")
                .startDate(LocalDate.now().minusDays(29))
                .endDate(LocalDate.now())
                .totalRevenue(new BigDecimal("15000000"))
                .successfulOrders(120L)
                .totalOrders(130L)
                .cancelledOrders(10L)
                .averageOrderValue(new BigDecimal("125000"))
                .completionRate(92.3)
                .build();

        when(revenueService.getRevenueSummary(eq(1), any(), anyString(), any(), any(), any(), any()))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/orders/revenue/summary")
                        .param("restaurantId", "1")
                        .param("period", "MONTH")
                        .header("X-User-Id", "100")
                        .header("X-User-Role", "ROLE_MERCHANT")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.restaurantId").value(1))
                .andExpect(jsonPath("$.data.restaurantName").value("Cơm Tấm Đêm Sài Gòn"))
                .andExpect(jsonPath("$.data.totalRevenue").value(15000000))
                .andExpect(jsonPath("$.data.successfulOrders").value(120));
    }

    @Test
    @DisplayName("GET /api/v1/orders/revenue/chart trả về 200 OK và danh sách điểm dữ liệu biểu đồ")
    void getRevenueChart_shouldReturn200() throws Exception {
        RevenueChartResponse response = RevenueChartResponse.builder()
                .restaurantId(1)
                .period("WEEK")
                .totalPeriodRevenue(new BigDecimal("3500000"))
                .totalPeriodOrders(35L)
                .points(List.of(
                        RevenueDataPoint.builder().label("10/11").revenue(new BigDecimal("500000")).orderCount(5L).build()
                ))
                .build();

        when(revenueService.getRevenueChart(eq(1), any(), anyString(), any(), any(), any(), any()))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/orders/revenue/chart")
                        .param("restaurantId", "1")
                        .param("period", "WEEK")
                        .header("X-User-Id", "100")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.points[0].label").value("10/11"))
                .andExpect(jsonPath("$.data.points[0].revenue").value(500000));
    }

    @Test
    @DisplayName("GET /api/v1/orders/revenue/top-foods trả về 200 OK")
    void getTopFoods_shouldReturn200() throws Exception {
        List<TopSellingFoodDto> response = List.of(
                TopSellingFoodDto.builder().foodId(10).foodName("Bún Bò Huế").totalQuantitySold(80L).totalRevenue(new BigDecimal("4000000")).build()
        );

        when(revenueService.getTopSellingFoods(eq(1), any(), anyInt(), any(), any(), any(), any()))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/orders/revenue/top-foods")
                        .param("restaurantId", "1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].foodName").value("Bún Bò Huế"));
    }

    @Test
    @DisplayName("GET /api/v1/orders/revenue/branches trả về 200 OK")
    void getBranches_shouldReturn200() throws Exception {
        List<MultiBranchRevenueDto> response = List.of(
                MultiBranchRevenueDto.builder().restaurantId(1).restaurantName("Quán 1").totalRevenue(new BigDecimal("2000000")).contributionPercentage(100.0).build()
        );

        when(revenueService.getMultiBranchComparison(anyList(), anyString(), any(), any(), any(), any()))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/orders/revenue/branches")
                        .param("restaurantIds", "1,2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].contributionPercentage").value(100.0));
    }
}

