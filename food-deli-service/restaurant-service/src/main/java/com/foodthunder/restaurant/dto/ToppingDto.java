package com.foodthunder.restaurant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToppingDto {
    private Integer id;
    private Integer restaurantId;
    private String name;
    private BigDecimal price;
    private Boolean isAvailable;
}
