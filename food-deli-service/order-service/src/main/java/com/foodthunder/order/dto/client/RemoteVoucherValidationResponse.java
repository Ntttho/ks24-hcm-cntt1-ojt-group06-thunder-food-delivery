package com.foodthunder.order.dto.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class RemoteVoucherValidationResponse {
    private Integer id;
    private Integer voucherId;
    private Integer restaurantId;
    private Boolean isSystemVoucher;
    private String voucherCategory;
    private String code;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal discountAmount;
    private BigDecimal shippingDiscountAmount;
    private BigDecimal minOrderValue;
    private Boolean isValid;
    private String message;

    public Integer getVoucherId() {
        return voucherId != null ? voucherId : id;
    }
}

