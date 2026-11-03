package com.foodthunder.common.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemToppingDto {
    private Long id;
    private Integer toppingId;
    private String toppingName;
    private BigDecimal priceAtOrder;
}
