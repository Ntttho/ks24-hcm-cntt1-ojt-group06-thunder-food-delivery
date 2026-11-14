package com.foodthunder.order.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String orderCode;
    private String idempotencyKey;
    private Integer customerId;
    private String customerName;
    private String customerPhone;
    private Integer restaurantId;
    private Integer driverId;
    private Integer voucherId;
    private String receiverAddress;
    private String note;
    private Double receiverLat;
    private Double receiverLng;
    private Double distanceKm;
    private BigDecimal subtotalAmount;
    private BigDecimal taxAmount;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private String statusCode;
    private String statusLabel;
    private Integer version;
    private String cancelReason;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime createdAt;

    @Builder.Default
    private List<OrderItemResponse> items = new ArrayList<>();

    @Builder.Default
    private List<OrderStatusLogResponse> statusLogs = new ArrayList<>();
}
