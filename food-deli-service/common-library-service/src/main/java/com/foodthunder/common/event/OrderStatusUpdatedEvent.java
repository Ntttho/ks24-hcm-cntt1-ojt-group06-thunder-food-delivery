package com.foodthunder.common.event;

import com.foodthunder.common.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusUpdatedEvent {
    private Long orderId;
    private OrderStatus previousStatus;
    private OrderStatus newStatus;
    private Long changedBy;
    private String reason;
    private Instant timestamp;
}
