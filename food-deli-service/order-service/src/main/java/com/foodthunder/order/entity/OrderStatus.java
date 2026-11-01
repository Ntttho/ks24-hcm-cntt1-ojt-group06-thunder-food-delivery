package com.foodthunder.order.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_statuses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderStatus {

    public static final String PENDING = "PENDING";
    public static final String CONFIRMED = "CONFIRMED";
    public static final String DRIVER_ACCEPTED = "DRIVER_ACCEPTED";
    public static final String DRIVER_REJECTED = "DRIVER_REJECTED";
    public static final String PICKING_UP = "PICKING_UP";
    public static final String DELIVERING = "DELIVERING";
    public static final String COMPLETED = "COMPLETED";
    public static final String CANCELLED = "CANCELLED";
    public static final String TIMEOUT = "TIMEOUT";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "label", length = 100)
    private String label;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;
}
