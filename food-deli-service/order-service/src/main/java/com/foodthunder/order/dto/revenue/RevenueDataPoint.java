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
public class RevenueDataPoint {
    private String label;
    private String date;
    @Builder.Default
    private BigDecimal revenue = BigDecimal.ZERO;
    @Builder.Default
    private Long orderCount = 0L;
    @Builder.Default
    private Long cancelledCount = 0L;
}

