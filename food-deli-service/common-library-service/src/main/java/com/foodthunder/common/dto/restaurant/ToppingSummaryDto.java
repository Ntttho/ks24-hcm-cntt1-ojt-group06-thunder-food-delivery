package com.foodthunder.common.dto.restaurant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToppingSummaryDto {
    private Integer id;
    private Integer restaurantId;
    private String name;
    private BigDecimal price;
    private Boolean isAvailable;
}

