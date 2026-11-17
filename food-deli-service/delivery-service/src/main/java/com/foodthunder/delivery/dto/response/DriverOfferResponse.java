package com.foodthunder.delivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverOfferResponse {
    private Long id;
    private Long orderId;
    private String orderCode;
    private Integer driverId;
    private String status;
    private String restaurantName;
    private String restaurantAddress;
    private String restaurantPhone;
    private String customerName;
    private String customerPhone;
    private String receiverAddress;
    private java.math.BigDecimal totalAmount;
    private String paymentMethod;
    private Double distanceKm;
    private Double pickupEtaMinutes;
    private Double dispatchScore;
    private LocalDateTime offeredAt;
    private LocalDateTime expiresAt;
}

