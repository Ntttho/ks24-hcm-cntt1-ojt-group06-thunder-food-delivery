package com.foodthunder.delivery.client;

import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.common.dto.response.PageResponse;
import com.foodthunder.delivery.dto.client.RemoteOrderResponse;
import com.foodthunder.delivery.dto.client.RemoteUpdateOrderStatusRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "order-service", fallbackFactory = OrderClientFallbackFactory.class)
public interface OrderClient {

    @PutMapping("/api/v1/orders/{id}/status")
    ResponseEntity<ApiResponse<Object>> updateOrderStatus(
            @PathVariable("id") Long id,
            @RequestBody RemoteUpdateOrderStatusRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    );

    @GetMapping("/api/v1/orders")
    ResponseEntity<ApiResponse<PageResponse<RemoteOrderResponse>>> getOrders(
            @RequestParam(value = "driverId", required = false) Integer driverId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "100") int size
    );
}
