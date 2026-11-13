package com.foodthunder.order.dto.settings;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateSystemSettingsRequest {
    @NotNull(message = "Phí ship mặc định là bắt buộc")
    @DecimalMin(value = "0", message = "Phí ship mặc định không được âm")
    private BigDecimal defaultShippingFee;

    @NotNull(message = "Phí ship/km là bắt buộc")
    @DecimalMin(value = "0", message = "Phí ship/km không được âm")
    private BigDecimal shippingFeePerKilometer;

    @NotNull(message = "Tỷ lệ hoa hồng là bắt buộc")
    @DecimalMin(value = "0", message = "Tỷ lệ hoa hồng tối thiểu là 0%")
    @DecimalMax(value = "100", message = "Tỷ lệ hoa hồng tối đa là 100%")
    private BigDecimal platformCommissionRate;
}
