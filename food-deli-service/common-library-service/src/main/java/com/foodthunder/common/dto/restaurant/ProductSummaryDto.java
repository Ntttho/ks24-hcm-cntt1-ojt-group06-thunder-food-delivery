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
public class ProductSummaryDto {
    private Integer id;
    private Integer restaurantId;
    private Integer categoryId;
    private String name;
    private BigDecimal price;
    private String imageUrl;
    private Boolean isAvailable;
}

