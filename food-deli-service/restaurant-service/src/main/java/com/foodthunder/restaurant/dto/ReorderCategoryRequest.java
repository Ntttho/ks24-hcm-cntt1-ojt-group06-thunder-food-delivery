package com.foodthunder.restaurant.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReorderCategoryRequest {

    @NotNull(message = "restaurantId không được để trống")
    private Integer restaurantId;

    @NotEmpty(message = "Danh sách categoryIds không được để trống")
    private List<Integer> categoryIds;
}
