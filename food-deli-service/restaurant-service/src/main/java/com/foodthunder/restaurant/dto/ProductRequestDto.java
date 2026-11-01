package com.foodthunder.restaurant.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequestDto {

    @NotBlank(message = "Tên món ăn không được để trống")
    private String name;

    @NotNull(message = "Danh mục không được để trống")
    private Integer categoryId;

    @NotNull(message = "Giá món ăn không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá món ăn phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    private String imageUrl;

    @Builder.Default
    private Boolean isAvailable = true;

    @Builder.Default
    private Integer defaultQuantity = 50;

    private List<Integer> toppingIds;
}
