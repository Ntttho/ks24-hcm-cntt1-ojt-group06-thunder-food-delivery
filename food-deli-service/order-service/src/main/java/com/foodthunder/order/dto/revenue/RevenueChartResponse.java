package com.foodthunder.order.dto.revenue;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueChartResponse {
    private Integer restaurantId;
    private String period;
    @Builder.Default
    private BigDecimal totalPeriodRevenue = BigDecimal.ZERO;
    @Builder.Default
    private Long totalPeriodOrders = 0L;
    @Builder.Default
    private List<RevenueDataPoint> points = new ArrayList<>();
}

