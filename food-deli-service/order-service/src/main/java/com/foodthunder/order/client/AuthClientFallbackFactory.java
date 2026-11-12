package com.foodthunder.order.client;

import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.client.RemoteOrderCostConfigDto;
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
                log.warn("Fallback triggered for getOrderFeeConfig, cause: {}", cause.getMessage());
                RemoteOrderCostConfigDto fallback = RemoteOrderCostConfigDto.builder()
                        .baseKm(2.0)
                        .baseFee(BigDecimal.valueOf(15000))
                        .extraPerKm(BigDecimal.valueOf(5000))
                        .priorityFee(BigDecimal.valueOf(5000))
                        .serviceFee(BigDecimal.ZERO)
                        .vatRate(0.08)
                        .vatIncluded(true)
                        .platformCommissionPercent(15.0)
                        .build();
                return ResponseEntity.ok(ApiResponse.success("Fallback order fee config", fallback));
            }

            @Override
            public ResponseEntity<ApiResponse<RemoteUserStatsDto>> getUserStatsSummary() {
                log.warn("Fallback triggered for getUserStatsSummary, cause: {}", cause.getMessage());
                RemoteUserStatsDto fallback = RemoteUserStatsDto.builder()
                        .totalUsers(0L)
                        .totalMerchants(0L)
                        .build();
                return ResponseEntity.ok(ApiResponse.success("Fallback user stats", fallback));
            }
        };
    }
}

