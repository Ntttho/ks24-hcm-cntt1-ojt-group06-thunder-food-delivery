package com.foodthunder.order.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnalyticsSummaryResponse {
    private int year;
    private long totalUsers;
    private long totalMerchants;
    private long totalRestaurants;
    private long totalFoodItems;
    private long totalOrders;
    private long completedOrders;
    private long cancelledOrders;
    private double completionRate;
    private BigDecimal totalGmv;
    private List<MonthlyRevenuePointDto> monthlyRevenue;
    private List<TopRestaurantRevenueDto> topRestaurants;
}

