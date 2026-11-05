package com.foodthunder.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_change_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantChangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "restaurant_id", nullable = false)
    private Integer restaurantId;

    @Column(name = "requested_by", nullable = false)
    private Integer requestedBy;

    @Column(name = "payload", columnDefinition = "json", nullable = false)
    private String payload;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "reviewed_by")
    private Integer reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

