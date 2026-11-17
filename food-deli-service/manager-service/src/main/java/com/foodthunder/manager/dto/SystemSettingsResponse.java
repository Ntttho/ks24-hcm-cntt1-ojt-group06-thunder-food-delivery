package com.foodthunder.manager.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SystemSettingsResponse(
        BigDecimal defaultShippingFee,
        LocalDateTime defaultShippingFeeUpdatedAt,
        BigDecimal shippingFeePerKilometer,
        LocalDateTime shippingFeePerKilometerUpdatedAt,
        BigDecimal platformCommissionRate,
        LocalDateTime platformCommissionRateUpdatedAt
) {
}
