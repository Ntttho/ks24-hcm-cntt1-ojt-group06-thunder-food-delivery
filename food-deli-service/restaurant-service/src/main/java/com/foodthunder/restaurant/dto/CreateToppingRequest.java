package com.foodthunder.restaurant.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateToppingRequest {

    @NotNull(message = "Mã quán ăn không được để trống")
    private Integer restaurantId;

    @Size(max = 100, message = "Tên nhóm topping tối đa 100 ký tự")
    @Builder.Default
    private String groupName = "Topping thêm";

    @NotBlank(message = "Tên topping không được để trống")
    @Size(max = 100, message = "Tên topping tối đa 100 ký tự")
    private String name;

    @NotNull(message = "Giá tiền không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá topping không được âm")
    private BigDecimal price;

    @Builder.Default
    private Boolean isAvailable = true;
}

