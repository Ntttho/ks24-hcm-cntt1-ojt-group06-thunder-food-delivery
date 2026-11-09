package com.foodthunder.restaurant.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDto {
    private Integer id;
    private Integer restaurantId;
    private String name;
    private Integer displayOrder;
    private Integer productCount;
    private Long itemCount;
}
