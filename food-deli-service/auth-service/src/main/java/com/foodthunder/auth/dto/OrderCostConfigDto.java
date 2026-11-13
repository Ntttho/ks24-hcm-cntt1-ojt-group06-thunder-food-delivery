package com.foodthunder.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Cấu hình chi phí Order dùng chung cho Checkout Frontend và Order-Service.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCostConfigDto {
    private Double baseKm;
    private BigDecimal baseFee;
    private BigDecimal extraPerKm;
    private BigDecimal priorityFee;
    private BigDecimal serviceFee;
    private BigDecimal vatRate;
    private Boolean vatIncluded;
}

