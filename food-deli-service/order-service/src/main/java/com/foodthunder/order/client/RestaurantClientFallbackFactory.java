package com.foodthunder.order.client;

import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.client.RemoteProductDto;
import com.foodthunder.order.dto.client.RemoteRestaurantAnalyticsCountsDto;
import com.foodthunder.order.dto.client.RemoteRestaurantDto;
import com.foodthunder.order.dto.client.RemoteRestaurantStatsDto;
import com.foodthunder.order.dto.client.RemoteValidateVoucherRequest;
import com.foodthunder.order.dto.client.RemoteVoucherValidationResponse;
import com.foodthunder.order.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

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

            @Override
            public ResponseEntity<ApiResponse<List<RemoteRestaurantDto>>> getAllRestaurants() {
                log.warn("Fallback triggered for getAllRestaurants, cause: {}", cause.getMessage());
                return ResponseEntity.ok(ApiResponse.success("Fallback empty restaurant list", Collections.emptyList()));
            }

            @Override
            public ResponseEntity<ApiResponse<RemoteRestaurantStatsDto>> getRestaurantStatsSummary() {
                log.warn("Fallback triggered for getRestaurantStatsSummary, cause: {}", cause.getMessage());
                RemoteRestaurantStatsDto fallback = RemoteRestaurantStatsDto.builder()
                        .totalRestaurants(0L)
                        .totalFoodItems(0L)
                        .build();
                return ResponseEntity.ok(ApiResponse.success("Fallback restaurant stats", fallback));
            }

            @Override
            public ResponseEntity<ApiResponse<RemoteVoucherValidationResponse>> validateVoucher(RemoteValidateVoucherRequest request) {
                log.error("Fallback triggered for validateVoucher with code: {}, cause: {}", request.getCode(), cause.getMessage());
                RemoteVoucherValidationResponse fallbackData = RemoteVoucherValidationResponse.builder()
                        .code(request.getCode())
                        .isValid(false)
                        .message("Không thể kết nối tới restaurant-service để xác thực voucher")
                        .build();
                return ResponseEntity.ok(ApiResponse.success("Fallback: " + fallbackData.getMessage(), fallbackData));
            }

            @Override
            public ResponseEntity<ApiResponse<RemoteVoucherValidationResponse>> getVoucherById(Integer id) {
                log.error("Fallback triggered for getVoucherById with id: {}, cause: {}", id, cause.getMessage());
                throw new ResourceNotFoundException("Không thể lấy thông tin voucher ID=" + id + " từ restaurant-service: " + cause.getMessage());
            }

            @Override
            public ResponseEntity<ApiResponse<RemoteRestaurantAnalyticsCountsDto>> getRestaurantAnalyticsCounts() {
                log.warn("Fallback triggered for getRestaurantAnalyticsCounts, cause: {}",
                        cause != null ? cause.getMessage() : "unknown");
                RemoteRestaurantAnalyticsCountsDto fallbackData = RemoteRestaurantAnalyticsCountsDto.builder()
                        .totalRestaurantsCount(0L)
                        .totalFoodItemsCount(0L)
                        .fallback(true)
                        .build();
                return ResponseEntity.ok(ApiResponse.success("Fallback restaurant-service analytics counts", fallbackData));
            }

            @Override
            public ResponseEntity<ApiResponse<Void>> deductStock(com.foodthunder.order.dto.client.RemoteDeductStockBatchRequest request) {
                log.error("Fallback triggered for deductStock, cause: {}", cause != null ? cause.getMessage() : "unknown");
                throw new com.foodthunder.order.exception.BadRequestException("Không thể kết nối đến kho món ăn để trừ số lượng: " + (cause != null ? cause.getMessage() : ""));
            }

            @Override
            public ResponseEntity<ApiResponse<Void>> restoreStock(com.foodthunder.order.dto.client.RemoteDeductStockBatchRequest request) {
                log.warn("Fallback triggered for restoreStock, cause: {}", cause != null ? cause.getMessage() : "unknown");
                return ResponseEntity.ok(ApiResponse.success("Fallback restoreStock", null));
            }
        };
    }
}
