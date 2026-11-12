package com.foodthunder.order.dto.client;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO nhận số lượng thống kê Restaurants và Food Items từ restaurant-service qua OpenFeign.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemoteRestaurantAnalyticsCountsDto {
    private long totalRestaurantsCount;
    private long totalFoodItemsCount;

    @JsonIgnore
    @Builder.Default
    private boolean fallback = false;
}

