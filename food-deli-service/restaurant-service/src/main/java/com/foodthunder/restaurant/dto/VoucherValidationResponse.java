package com.foodthunder.restaurant.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherValidationResponse {

    private Integer voucherId;
    private String code;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal discountAmount;
    private BigDecimal minOrderValue;
    private Boolean isValid;
    private String message;
}

