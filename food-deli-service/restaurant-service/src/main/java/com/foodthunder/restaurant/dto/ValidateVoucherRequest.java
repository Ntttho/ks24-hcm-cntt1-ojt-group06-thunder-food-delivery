package com.foodthunder.restaurant.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidateVoucherRequest {

    @NotBlank(message = "Mã voucher không được để trống")
    private String code;

    private Integer restaurantId;

    @NotNull(message = "Tổng tiền đơn hàng không được để trống")
    @DecimalMin(value = "0.00", message = "Tổng tiền đơn hàng không được âm")
    private BigDecimal orderAmount;
}

