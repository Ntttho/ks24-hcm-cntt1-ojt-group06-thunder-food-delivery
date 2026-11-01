package com.foodthunder.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "restaurants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "owner_id", nullable = false)
    private Integer ownerId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "latitude", nullable = false)
    @Builder.Default
    private Double latitude = 0.0;

    @Column(name = "longitude", nullable = false)
    @Builder.Default
    private Double longitude = 0.0;

    @Column(name = "opening_time")
    private LocalTime openingTime;

    @Column(name = "closing_time")
    private LocalTime closingTime;

    @Column(name = "is_open")
    @Builder.Default
    private Boolean isOpen = true;

    @Column(name = "is_open_today", nullable = false)
    @Builder.Default
    private Boolean isOpenToday = true;

    @Column(name = "temporary_closed_reason", columnDefinition = "TEXT")
    private String temporaryClosedReason;

    @Column(name = "temporary_closed_until")
    private LocalDateTime temporaryClosedUntil;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(name = "rating_avg", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal ratingAvg = BigDecimal.valueOf(5.00);

    @Column(name = "approval_status", length = 20)
    @Builder.Default
    private String approvalStatus = "APPROVED";

    @Column(name = "approved_by")
    private Integer approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<MenuCategory> categories = new ArrayList<>();
}
