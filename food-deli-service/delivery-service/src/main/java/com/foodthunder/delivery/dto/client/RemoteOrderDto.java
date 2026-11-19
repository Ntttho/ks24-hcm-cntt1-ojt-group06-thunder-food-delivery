package com.foodthunder.delivery.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemoteOrderDto {
    private Long id;
    private String orderCode;
    private Integer customerId;
    private String customerName;
    private String customerPhone;
    private Integer restaurantId;
    private String restaurantName;
    private String restaurantAddress;
    private String restaurantPhone;
    private Integer driverId;
    private String driverName;
    private String driverPhone;
    private String receiverAddress;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private String statusCode;
    private Double distanceKm;
}
