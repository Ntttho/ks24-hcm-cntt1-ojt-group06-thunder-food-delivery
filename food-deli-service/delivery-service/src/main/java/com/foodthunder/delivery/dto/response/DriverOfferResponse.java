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
    private Integer driverId;
    private String status;
    private Double distanceKm;
    private Double pickupEtaMinutes;
    private Double dispatchScore;
    private LocalDateTime offeredAt;
    private LocalDateTime expiresAt;
}

