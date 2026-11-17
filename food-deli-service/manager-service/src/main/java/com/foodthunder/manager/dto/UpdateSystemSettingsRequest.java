package com.foodthunder.manager.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdateSystemSettingsRequest(
        @NotNull @DecimalMin(value = "0") BigDecimal defaultShippingFee,
        @NotNull @DecimalMin(value = "0") BigDecimal shippingFeePerKilometer,
        @NotNull @DecimalMin(value = "0") @DecimalMax(value = "100") BigDecimal platformCommissionRate
) {
}
