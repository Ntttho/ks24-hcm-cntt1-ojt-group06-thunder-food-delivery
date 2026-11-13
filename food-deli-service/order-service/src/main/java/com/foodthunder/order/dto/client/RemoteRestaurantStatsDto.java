package com.foodthunder.order.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemoteRestaurantStatsDto {
    private long totalRestaurants;
    private long totalFoodItems;
}

