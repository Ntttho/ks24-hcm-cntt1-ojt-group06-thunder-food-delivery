package com.foodthunder.order.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response tổng hợp toàn sàn cho màn hình Admin Analytics Dashboard (/admin/analytics).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnalyticsSummaryResponse {
    private int year;
    private BigDecimal totalRevenue;
    private BigDecimal yearlyRevenue;
    private List<MonthlyRevenuePointDto> monthlyRevenue;
    private long totalUsersCount;
    private long totalRestaurantsCount;
    private long totalMerchantsCount;
    private long completedOrdersCount;
    private long totalOrdersCount;
    private double orderSuccessRate;
    private long totalFoodItemsCount;
    private boolean partialData;
    private List<String> warnings;
}

