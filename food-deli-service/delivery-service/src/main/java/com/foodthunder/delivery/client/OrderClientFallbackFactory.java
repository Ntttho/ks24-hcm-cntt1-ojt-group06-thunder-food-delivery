package com.foodthunder.delivery.client;

import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.delivery.dto.client.RemoteOrderDto;
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
        return new OrderClient() {
            @Override
            public ResponseEntity<ApiResponse<Object>> updateOrderStatus(Long id, RemoteUpdateOrderStatusRequest request, Integer userId, String userRole) {
                log.error("Fallback triggered for updateOrderStatus orderId={}, status={}, cause: {}",
                        id, request.getStatusCode(), cause.getMessage());
                return ResponseEntity.internalServerError()
                        .body(ApiResponse.error(500, "Không thể kết nối đến order-service: " + cause.getMessage()));
            }

            @Override
            public ResponseEntity<ApiResponse<RemoteOrderDto>> getOrderById(Long id) {
                log.error("Fallback triggered for getOrderById orderId={}, cause: {}", id, cause.getMessage());
                return ResponseEntity.ok(ApiResponse.success(RemoteOrderDto.builder()
                        .id(id)
                        .orderCode("ORD-" + id)
                        .restaurantName("Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi")
                        .restaurantAddress("123 Nguyễn Trãi, Phường 2, Quận 5, TP.HCM")
                        .customerName("Khách hàng")
                        .customerPhone("0987654321")
                        .receiverAddress("Địa chỉ người nhận")
                        .build()));
            }
        };
    }
}

