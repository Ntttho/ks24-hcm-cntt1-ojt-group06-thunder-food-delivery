package com.foodthunder.order.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_code", nullable = false, length = 50)
    private String orderCode;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 100)
    private String idempotencyKey;

    @Column(name = "customer_id", nullable = false)
    private Integer customerId;

    @Column(name = "customer_name", length = 100)
    private String customerName;

    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    @Column(name = "restaurant_id", nullable = false)
    private Integer restaurantId;

    @Column(name = "driver_id")
    private Integer driverId;

    @Column(name = "voucher_id")
    private Integer voucherId;

    @Column(name = "receiver_address", columnDefinition = "TEXT")
    private String receiverAddress;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "receiver_lat")
    private Double receiverLat;

    @Column(name = "receiver_lng")
    private Double receiverLng;

    @Column(name = "distance_km")
    private Double distanceKm;

    @Column(name = "subtotal_amount", precision = 10, scale = 2)
    private BigDecimal subtotalAmount;

    @Column(name = "tax_amount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "shipping_fee", precision = 10, scale = 2)
    private BigDecimal shippingFee;

    @Column(name = "discount_amount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "payment_method", length = 30)
    @Builder.Default
    private String paymentMethod = "COD";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "status_id", nullable = false)
    private OrderStatus status;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 0;

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String cancelReason;

    @Column(name = "cancelled_by_role", length = 20)
    private String cancelledByRole;

    @Column(name = "cancelled_by_user_id")
    private Integer cancelledByUserId;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<OrderStatusLog> statusLogs = new ArrayList<>();

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public void addStatusLog(OrderStatusLog log) {
        statusLogs.add(log);
        log.setOrder(this);
    }
}
