package com.foodthunder.order.dto.client;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RemoteValidateVoucherRequest {
    private String code;
    private Integer restaurantId;
    private BigDecimal orderAmount;
}

