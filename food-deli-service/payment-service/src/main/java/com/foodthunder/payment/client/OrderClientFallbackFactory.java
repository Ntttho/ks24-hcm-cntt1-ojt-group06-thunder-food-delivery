package com.foodthunder.payment.client;

import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.payment.dto.client.RemoteOrderDto;
import com.foodthunder.payment.dto.client.RemoteUpdateOrderStatusRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class OrderClientFallbackFactory implements FallbackFactory<OrderClient> {

    @Override
    public OrderClient create(Throwable cause) {
        log.error("Fallback triggered for OrderClient due to: {}", cause.getMessage());
        return new OrderClient() {
            @Override
            public ResponseEntity<ApiResponse<RemoteOrderDto>> getOrderDetail(Long id, String role, String userId) {
                log.warn("Fallback getOrderDetail invoked for orderId={}", id);
                return ResponseEntity.ok(ApiResponse.error(503, "order-service unavailable: " + cause.getMessage()));
            }

            @Override
            public ResponseEntity<ApiResponse<RemoteOrderDto>> updateOrderStatus(Long id,
                    RemoteUpdateOrderStatusRequest request, String role, String userId) {
                log.warn("Fallback updateOrderStatus invoked for orderId={}", id);
                return ResponseEntity.ok(ApiResponse.error(503, "order-service unavailable: " + cause.getMessage()));
            }
        };
    }
}
