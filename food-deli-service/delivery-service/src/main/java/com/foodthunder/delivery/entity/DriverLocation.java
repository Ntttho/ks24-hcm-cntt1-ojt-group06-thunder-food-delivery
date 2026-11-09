package com.foodthunder.delivery.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "driver_locations", indexes = {
    @Index(name = "idx_driver_locations_driver_id", columnList = "driver_id"),
    @Index(name = "idx_driver_locations_order_id", columnList = "order_id"),
    @Index(name = "idx_driver_locations_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "driver_id", nullable = false)
    private Integer driverId;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "heading", nullable = false)
    @Builder.Default
    private Double heading = 0.0;

    @Column(name = "speed_kmh", nullable = false)
    @Builder.Default
    private Double speedKmh = 24.0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
