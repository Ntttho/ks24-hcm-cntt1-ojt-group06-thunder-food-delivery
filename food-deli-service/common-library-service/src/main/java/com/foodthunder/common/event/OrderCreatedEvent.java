package com.foodthunder.common.event;

import com.foodthunder.common.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreatedEvent {
    private Long orderId;
    private Long customerId;
    private Integer restaurantId;
    private BigDecimal totalAmount;
    private PaymentMethod paymentMethod;
    private Instant createdAt;
}
