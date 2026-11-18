package com.foodthunder.order.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderVoucherResponse {
    private Integer voucherId;
    private String voucherCode;
    private String voucherCategory;
    private Boolean isSystemVoucher;
    private BigDecimal discountAmount;
}

