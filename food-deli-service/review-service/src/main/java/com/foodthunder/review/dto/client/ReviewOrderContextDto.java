package com.foodthunder.review.dto.client;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewOrderContextDto {
    private Long orderId;
    private Integer restaurantId;
    private String restaurantName;
    private String customerName;
    private String driverName;
    private List<ItemDto> items;

    public ReviewOrderContextDto(Long orderId, Integer restaurantId, List<ItemDto> items) {
        this.orderId = orderId;
        this.restaurantId = restaurantId;
        this.items = items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemDto {
        private Integer foodId;
        private String foodName;
        private Integer quantity;
    }
}
