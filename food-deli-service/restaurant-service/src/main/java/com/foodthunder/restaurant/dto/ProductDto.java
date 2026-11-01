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
public class ProductDto {
    private Integer id;
    private Integer categoryId;
    private String categoryName;
    private String name;
    private BigDecimal price;
    private Boolean isAvailable;
    private Integer defaultQuantity;
    private Integer currentQuantity;
    private String imageUrl;
}
