package com.foodthunder.restaurant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Thống kê tóm tắt số lượng nhà hàng và món ăn toàn sàn cho Admin Analytics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantStatsSummaryDto {
    private long totalRestaurants;
    private long totalFoodItems;
}

