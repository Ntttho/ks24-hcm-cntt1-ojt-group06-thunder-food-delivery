package com.foodthunder.order.client;

import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.client.RemoteOrderCostConfigDto;
import com.foodthunder.order.dto.client.RemoteAddressDto;
import com.foodthunder.order.dto.client.RemoteUserAnalyticsCountsDto;
import com.foodthunder.order.dto.client.RemoteUserStatsDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AuthClientFallbackFactory implements FallbackFactory<AuthClient> {

    @Override
    public AuthClient create(Throwable cause) {
        return new AuthClient() {
            @Override
            public ResponseEntity<ApiResponse<RemoteOrderCostConfigDto>> getOrderFeeConfig() {
                log.warn("Fallback triggered for getOrderFeeConfig, cause: {}",
                        cause != null ? cause.getMessage() : "unknown");
                return ResponseEntity.status(503).body(ApiResponse.error(503, "Không thể tải cấu hình chi phí đơn hàng"));
            }

            @Override
            public ResponseEntity<ApiResponse<RemoteAddressDto>> getMyAddress(Long addressId, Long userId) {
                log.warn("Fallback triggered for getMyAddress id={}, cause: {}",
                        addressId, cause != null ? cause.getMessage() : "unknown");
                return ResponseEntity.status(503).body(ApiResponse.error(503, "Không thể xác minh địa chỉ giao hàng"));
            }

            @Override
            public ResponseEntity<ApiResponse<RemoteUserStatsDto>> getUserStatsSummary() {
                log.warn("Fallback triggered for getUserStatsSummary, cause: {}",
                        cause != null ? cause.getMessage() : "unknown");
                RemoteUserStatsDto fallback = RemoteUserStatsDto.builder()
                        .totalUsers(0L)
                        .totalMerchants(0L)
                        .build();
                return ResponseEntity.ok(ApiResponse.success("Fallback user stats", fallback));
            }

            @Override
            public ResponseEntity<ApiResponse<RemoteUserAnalyticsCountsDto>> getUserAnalyticsCounts() {
                log.warn("Fallback triggered for AuthClient.getUserAnalyticsCounts, cause: {}",
                        cause != null ? cause.getMessage() : "unknown");
                RemoteUserAnalyticsCountsDto fallbackData = RemoteUserAnalyticsCountsDto.builder()
                        .totalUsersCount(0L)
                        .totalMerchantsCount(0L)
                        .fallback(true)
                        .build();
                return ResponseEntity.ok(ApiResponse.success("Fallback auth-service analytics counts", fallbackData));
            }
        };
    }
}
