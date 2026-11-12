package com.foodthunder.order.client;

import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.client.RemoteUserAnalyticsCountsDto;
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

