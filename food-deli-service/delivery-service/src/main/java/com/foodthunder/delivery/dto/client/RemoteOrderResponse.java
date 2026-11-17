package com.foodthunder.delivery.dto.client;

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
public class RemoteOrderResponse {

    private Long id;
    private String orderCode;
    private Integer customerId;
    private String customerName;
    private String customerPhone;
    private Integer restaurantId;
    private Integer driverId;
    private String receiverAddress;
    private Double distanceKm;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private String statusCode;
    private String statusLabel;
    private LocalDateTime createdAt;
}

