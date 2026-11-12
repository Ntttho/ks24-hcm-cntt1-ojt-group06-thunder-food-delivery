package com.foodthunder.order.client;

import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.client.RemoteUserAnalyticsCountsDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "auth-service", fallbackFactory = AuthClientFallbackFactory.class)
public interface AuthClient {

    @GetMapping("/api/v1/users/admin/analytics-counts")
    ResponseEntity<ApiResponse<RemoteUserAnalyticsCountsDto>> getUserAnalyticsCounts();
}

