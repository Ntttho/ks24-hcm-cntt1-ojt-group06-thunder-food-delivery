package com.foodthunder.order.dto.settings;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingsResponse {
    private BigDecimal defaultShippingFee;
    private LocalDateTime defaultShippingFeeUpdatedAt;
    private BigDecimal shippingFeePerKilometer;
    private LocalDateTime shippingFeePerKilometerUpdatedAt;
    private BigDecimal platformCommissionRate;
    private LocalDateTime platformCommissionRateUpdatedAt;
}
