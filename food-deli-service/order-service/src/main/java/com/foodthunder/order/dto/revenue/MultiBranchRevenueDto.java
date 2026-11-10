package com.foodthunder.order.dto.revenue;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MultiBranchRevenueDto {
    private Integer restaurantId;
    private String restaurantName;
    @Builder.Default
    private BigDecimal totalRevenue = BigDecimal.ZERO;
    @Builder.Default
    private Long completedOrders = 0L;
    @Builder.Default
    private Long cancelledOrders = 0L;
    @Builder.Default
    private Double contributionPercentage = 0.0;
}

