package com.foodthunder.restaurant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Thống kê số lượng nhà hàng đang hoạt động và tổng món ăn toàn sàn phục vụ Admin Analytics Dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantAnalyticsCountsDto {
    private long totalRestaurantsCount;
    private long totalFoodItemsCount;
}

