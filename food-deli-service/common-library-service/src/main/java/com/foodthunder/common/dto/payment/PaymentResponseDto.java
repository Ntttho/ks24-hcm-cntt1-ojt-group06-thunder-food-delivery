package com.foodthunder.common.dto.payment;

import com.foodthunder.common.enums.PaymentMethod;
import com.foodthunder.common.enums.PaymentStatus;
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
public class PaymentResponseDto {
    private Long id;
    private Long orderId;
    private String idempotencyKey;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private BigDecimal amount;
    private String paymentUrl;
    private String transactionRef;
    private Instant createdAt;
    private Instant updatedAt;
}
