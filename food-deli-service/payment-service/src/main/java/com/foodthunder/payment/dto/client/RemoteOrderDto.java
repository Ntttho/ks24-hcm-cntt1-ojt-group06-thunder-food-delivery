package com.foodthunder.payment.dto.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RemoteOrderDto {

    private Long id;
    private String orderCode;
    private Integer customerId;
    private Integer restaurantId;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private String statusCode;
    private String statusLabel;
}
