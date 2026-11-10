package com.foodthunder.delivery.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "driver_offers", indexes = {
    @Index(name = "idx_driver_offers_order_id", columnList = "order_id"),
    @Index(name = "idx_driver_offers_driver_id", columnList = "driver_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "driver_id", nullable = false)
    private Integer driverId;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "algorithm", length = 50)
    private String algorithm;

    @Column(name = "search_radius_km")
    private Double searchRadiusKm;

    @Column(name = "distance_km")
    private Double distanceKm;

    @Column(name = "pickup_eta_minutes")
    private Double pickupEtaMinutes;

    @Column(name = "dispatch_score")
    private Double dispatchScore;

    @Column(name = "offered_at", nullable = false)
    private LocalDateTime offeredAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "response_reason", columnDefinition = "TEXT")
    private String responseReason;

    @Column(name = "cancellation_chargeable", nullable = false)
    @Builder.Default
    private Boolean cancellationChargeable = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

