package com.foodthunder.payment.client;

import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.payment.dto.client.RemoteOrderDto;
import com.foodthunder.payment.dto.client.RemoteUpdateOrderStatusRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "order-service", fallbackFactory = OrderClientFallbackFactory.class)
public interface OrderClient {

    @GetMapping("/api/v1/orders/{id}")
    ResponseEntity<ApiResponse<RemoteOrderDto>> getOrderDetail(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-User-Role", defaultValue = "SYSTEM") String role,
            @RequestHeader(value = "X-User-Id", defaultValue = "0") String userId);

    @PutMapping("/api/v1/orders/{id}/status")
    ResponseEntity<ApiResponse<RemoteOrderDto>> updateOrderStatus(
            @PathVariable("id") Long id,
            @RequestBody RemoteUpdateOrderStatusRequest request,
            @RequestHeader(value = "X-User-Role", defaultValue = "SYSTEM") String role,
            @RequestHeader(value = "X-User-Id", defaultValue = "0") String userId);
}

