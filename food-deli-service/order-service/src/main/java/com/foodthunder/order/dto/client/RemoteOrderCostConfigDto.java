package com.foodthunder.order.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemoteOrderCostConfigDto {
    private Double baseKm;
    private BigDecimal baseFee;
    private BigDecimal extraPerKm;
    private BigDecimal priorityFee;
    private BigDecimal serviceFee;
    private Double vatRate;
    private Boolean vatIncluded;
    private Double platformCommissionPercent;
}

