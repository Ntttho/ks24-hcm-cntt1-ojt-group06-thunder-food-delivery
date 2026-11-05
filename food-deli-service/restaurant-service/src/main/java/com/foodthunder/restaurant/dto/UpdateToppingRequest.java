package com.foodthunder.restaurant.dto;

import jakarta.validation.constraints.DecimalMin;
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
public class UpdateToppingRequest {

    @Size(max = 100, message = "Tên nhóm topping tối đa 100 ký tự")
    private String groupName;

    @Size(max = 100, message = "Tên topping tối đa 100 ký tự")
    private String name;

    @DecimalMin(value = "0.0", inclusive = true, message = "Giá topping không được âm")
    private BigDecimal price;

    private Boolean isAvailable;
}

