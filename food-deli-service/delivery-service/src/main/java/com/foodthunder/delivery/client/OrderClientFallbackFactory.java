package com.foodthunder.delivery.client;

import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.common.dto.response.PageResponse;
import com.foodthunder.delivery.dto.client.RemoteOrderResponse;
import com.foodthunder.delivery.dto.client.RemoteUpdateOrderStatusRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
@Slf4j
public class OrderClientFallbackFactory implements FallbackFactory<OrderClient> {

    @Override
    public OrderClient create(Throwable cause) {
        return new OrderClient() {
            @Override
            public ResponseEntity<ApiResponse<Object>> updateOrderStatus(Long id, RemoteUpdateOrderStatusRequest request, Integer userId, String userRole) {
                log.error("Fallback triggered for updateOrderStatus orderId={}, status={}, cause: {}",
                        id, request.getStatusCode(), cause != null ? cause.getMessage() : "unknown");
                return ResponseEntity.internalServerError()
                        .body(ApiResponse.error(500, "Không thể kết nối đến order-service: " + (cause != null ? cause.getMessage() : "unknown")));
            }

            @Override
            public ResponseEntity<ApiResponse<PageResponse<RemoteOrderResponse>>> getOrders(Integer driverId, String status, int page, int size) {
                log.error("Fallback triggered for getOrders driverId={}, cause: {}", driverId, cause != null ? cause.getMessage() : "unknown");
                return ResponseEntity.ok(ApiResponse.success(PageResponse.of(Collections.emptyList(), 0, size, 0, 0, true)));
            }
        };
    }
}
