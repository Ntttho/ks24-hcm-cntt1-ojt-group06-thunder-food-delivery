package com.foodthunder.order.client;

import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.client.RemoteProductDto;
import com.foodthunder.order.dto.client.RemoteRestaurantDto;
import com.foodthunder.order.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class RestaurantClientFallbackFactory implements FallbackFactory<RestaurantClient> {

    @Override
    public RestaurantClient create(Throwable cause) {
        return new RestaurantClient() {
            @Override
            public ResponseEntity<ApiResponse<RemoteProductDto>> getProductDetail(Integer id) {
                log.error("Fallback triggered for getProductDetail with id: {}, cause: {}", id, cause.getMessage());
                throw new ResourceNotFoundException("Không thể lấy thông tin món ăn ID=" + id + " từ restaurant-service: " + cause.getMessage());
            }

            @Override
            public ResponseEntity<ApiResponse<RemoteRestaurantDto>> getRestaurantDetail(Integer id) {
                log.error("Fallback triggered for getRestaurantDetail with id: {}, cause: {}", id, cause.getMessage());
                throw new ResourceNotFoundException("Không thể lấy thông tin quán ăn ID=" + id + " từ restaurant-service: " + cause.getMessage());
            }
        };
    }
}
