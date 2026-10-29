package com.foodthunder.restaurant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryMenuDto {
    private Integer id;
    private String name;

    @Builder.Default
    private List<ProductDto> products = new ArrayList<>();
}
