package com.foodthunder.delivery.client;

import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.delivery.dto.client.RemoteUpdateOrderStatusRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class OrderClientFallbackFactory implements FallbackFactory<OrderClient> {

    @Override
    public OrderClient create(Throwable cause) {
        return (id, request, userId, userRole) -> {
            log.error("Fallback triggered for updateOrderStatus orderId={}, status={}, cause: {}",
                    id, request.getStatusCode(), cause.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error(500, "Không thể kết nối đến order-service: " + cause.getMessage()));
        };
    }
}
