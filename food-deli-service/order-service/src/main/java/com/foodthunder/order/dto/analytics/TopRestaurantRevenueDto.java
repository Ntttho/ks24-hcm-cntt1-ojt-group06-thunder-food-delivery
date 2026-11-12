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
public class TopRestaurantRevenueDto {
    private Integer restaurantId;
    private String restaurantName;
    private long completedOrders;
    private BigDecimal revenue;
}

