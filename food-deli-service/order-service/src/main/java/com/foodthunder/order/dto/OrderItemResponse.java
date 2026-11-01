package com.foodthunder.order.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {
    private Long id;
    private Integer foodId;
    private String foodName;
    private Integer quantity;
    private BigDecimal priceAtOrder;

    @Builder.Default
    private List<OrderItemToppingResponse> toppings = new ArrayList<>();
}
