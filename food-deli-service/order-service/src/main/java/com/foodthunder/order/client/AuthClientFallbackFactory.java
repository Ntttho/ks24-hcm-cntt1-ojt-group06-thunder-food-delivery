package com.foodthunder.order.client;

import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.client.RemoteOrderCostConfigDto;
import com.foodthunder.order.dto.client.RemoteUserAnalyticsCountsDto;
import com.foodthunder.order.dto.client.RemoteUserStatsDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

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
                RemoteOrderCostConfigDto fallback = RemoteOrderCostConfigDto.builder()
                        .baseKm(2.0)
                        .baseFee(BigDecimal.valueOf(15000))
                        .extraPerKm(BigDecimal.valueOf(5000))
                        .priorityFee(BigDecimal.valueOf(5000))
                        .serviceFee(BigDecimal.ZERO)
                        .vatRate(0.08)
                        .vatIncluded(true)
                        .platformCommissionPercent(15.0)
                        .fallback(true)
                        .build();
                return ResponseEntity.ok(ApiResponse.success("Fallback order fee config", fallback));
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
