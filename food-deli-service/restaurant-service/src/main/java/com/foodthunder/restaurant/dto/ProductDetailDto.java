package com.foodthunder.restaurant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailDto {
    private Integer id;
    private Integer categoryId;
    private String categoryName;
    private Integer restaurantId;
    private String restaurantName;
    private String name;
    private BigDecimal price;
    private Boolean isAvailable;
    private Integer defaultQuantity;
    private Integer currentQuantity;
    private String imageUrl;

    @Builder.Default
    private List<ToppingGroupDto> toppingGroups = new ArrayList<>();

    @Builder.Default
    private List<ToppingDto> toppings = new ArrayList<>();
}
