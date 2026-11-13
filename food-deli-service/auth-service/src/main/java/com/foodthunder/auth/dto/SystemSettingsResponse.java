package com.foodthunder.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Phản hồi đầy đủ cấu hình tham số toàn sàn cho Admin Portal (/admin/settings).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingsResponse {
    private Double baseKm;
    private BigDecimal baseFee;
    private BigDecimal extraPerKm;
    private BigDecimal priorityFee;
    private BigDecimal serviceFee;
    private BigDecimal vatRate;
    private Boolean vatIncluded;
    private BigDecimal platformCommissionPercent;
}

