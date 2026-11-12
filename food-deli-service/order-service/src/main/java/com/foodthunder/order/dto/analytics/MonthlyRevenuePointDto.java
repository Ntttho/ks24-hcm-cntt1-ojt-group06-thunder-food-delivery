package com.foodthunder.order.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyRevenuePointDto {
    private int month;
    private String label;
    private BigDecimal revenue;
    private long orderCount;
}

