package com.foodthunder.order.dto.client;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemoteToppingDto {
    private Integer id;
    private Integer restaurantId;
    private String name;
    private BigDecimal price;
    private Boolean isAvailable;
}
