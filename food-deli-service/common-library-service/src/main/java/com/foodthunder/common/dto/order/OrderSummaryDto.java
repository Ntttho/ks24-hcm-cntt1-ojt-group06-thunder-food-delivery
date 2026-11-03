package com.foodthunder.common.dto.order;

import com.foodthunder.common.enums.OrderStatus;
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
public class OrderSummaryDto {
    private Long id;
    private Long customerId;
    private Long restaurantId;
    private Long driverId;
    private OrderStatus status;
    private PaymentMethod paymentMethod;
    private BigDecimal subtotal;
    private BigDecimal deliveryFee;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String receiverAddress;
    private String receiverPhone;
    private Instant createdAt;
}
