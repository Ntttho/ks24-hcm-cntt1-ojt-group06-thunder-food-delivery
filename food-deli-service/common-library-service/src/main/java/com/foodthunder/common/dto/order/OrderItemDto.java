package com.foodthunder.common.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDto {
    private Long id;
    private Integer foodItemId;
    private String foodName;
    private BigDecimal priceAtOrder;
    private Integer quantity;
    private BigDecimal itemSubtotal;
    private String note;
    private List<OrderItemToppingDto> toppings;
}
