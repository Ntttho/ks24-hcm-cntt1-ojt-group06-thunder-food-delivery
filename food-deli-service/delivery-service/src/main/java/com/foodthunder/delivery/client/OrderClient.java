package com.foodthunder.delivery.client;

import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.delivery.dto.client.RemoteUpdateOrderStatusRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "order-service", fallbackFactory = OrderClientFallbackFactory.class)
public interface OrderClient {

    @PutMapping("/api/v1/orders/{id}/status")
    ResponseEntity<ApiResponse<Object>> updateOrderStatus(
            @PathVariable("id") Long id,
            @RequestBody RemoteUpdateOrderStatusRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    );
}

