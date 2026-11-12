package com.foodthunder.order.dto.revenue;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantRevenueSummaryResponse {
    private Integer restaurantId;
    private String restaurantName;
    private String period;
    private LocalDate startDate;
    private LocalDate endDate;

    @Builder.Default
    private BigDecimal totalRevenue = BigDecimal.ZERO;

    @Builder.Default
    private Long successfulOrders = 0L;

    @Builder.Default
    private Long totalOrders = 0L;

    @Builder.Default
    private Long cancelledOrders = 0L;

    @Builder.Default
    private BigDecimal averageOrderValue = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal totalDiscount = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal platformCommission = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal restaurantPayout = BigDecimal.ZERO;

    @Builder.Default
    private Double completionRate = 0.0;
}
