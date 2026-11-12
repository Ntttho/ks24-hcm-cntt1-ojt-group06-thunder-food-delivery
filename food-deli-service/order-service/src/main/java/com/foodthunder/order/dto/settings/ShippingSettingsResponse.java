package com.foodthunder.order.dto.settings;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingSettingsResponse {
    private BigDecimal defaultShippingFee;
    private BigDecimal shippingFeePerKilometer;
}
