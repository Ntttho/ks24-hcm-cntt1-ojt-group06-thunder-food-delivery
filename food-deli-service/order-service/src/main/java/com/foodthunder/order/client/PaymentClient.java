package com.foodthunder.order.client;

import com.foodthunder.order.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "payment-service", fallbackFactory = PaymentClientFallbackFactory.class)
public interface PaymentClient {

    @PutMapping("/api/v1/payments/orders/{orderId}/cancel")
    ResponseEntity<ApiResponse<Object>> cancelPayment(
            @PathVariable("orderId") Long orderId,
            @RequestParam(value = "reason", required = false) String reason
    );
}
