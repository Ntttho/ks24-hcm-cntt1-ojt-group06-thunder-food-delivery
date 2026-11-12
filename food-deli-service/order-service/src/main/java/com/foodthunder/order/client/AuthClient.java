package com.foodthunder.order.client;

import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.client.RemoteOrderCostConfigDto;
import com.foodthunder.order.dto.client.RemoteUserAnalyticsCountsDto;
import com.foodthunder.order.dto.client.RemoteUserStatsDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "auth-service", fallbackFactory = AuthClientFallbackFactory.class)
public interface AuthClient {

    @GetMapping("/api/v1/settings/order-fees")
    ResponseEntity<ApiResponse<RemoteOrderCostConfigDto>> getOrderFeeConfig();

    @GetMapping("/api/v1/users/stats/summary")
    ResponseEntity<ApiResponse<RemoteUserStatsDto>> getUserStatsSummary();

    @GetMapping("/api/v1/users/admin/analytics-counts")
    ResponseEntity<ApiResponse<RemoteUserAnalyticsCountsDto>> getUserAnalyticsCounts();
}
