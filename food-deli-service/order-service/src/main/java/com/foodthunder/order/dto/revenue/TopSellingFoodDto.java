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
public class TopSellingFoodDto {
    private Integer foodId;
    private String foodName;
    @Builder.Default
    private Long totalQuantitySold = 0L;
    @Builder.Default
    private BigDecimal totalRevenue = BigDecimal.ZERO;
}

