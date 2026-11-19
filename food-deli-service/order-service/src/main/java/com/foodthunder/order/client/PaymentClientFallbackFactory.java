package com.foodthunder.order.client;

import com.foodthunder.order.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class PaymentClientFallbackFactory implements FallbackFactory<PaymentClient> {

    @Override
    public PaymentClient create(Throwable cause) {
        return (orderId, reason) -> {
            log.warn("Fallback triggered for cancelPayment orderId={}, cause: {}",
                    orderId, cause != null ? cause.getMessage() : "unknown");
            return ResponseEntity.ok(ApiResponse.error(503, "Payment service unavailable for cancelPayment"));
        };
    }
}
