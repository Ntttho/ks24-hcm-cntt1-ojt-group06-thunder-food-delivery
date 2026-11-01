package com.foodthunder.order.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemToppingResponse {
    private Long id;
    private Integer toppingId;
    private Integer quantity;
    private BigDecimal price;
}
