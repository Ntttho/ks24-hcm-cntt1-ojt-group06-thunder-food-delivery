package com.foodthunder.order.client;

import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.client.RemoteProductDto;
import com.foodthunder.order.dto.client.RemoteRestaurantAnalyticsCountsDto;
import com.foodthunder.order.dto.client.RemoteRestaurantDto;
import com.foodthunder.order.dto.client.RemoteRestaurantStatsDto;
import com.foodthunder.order.dto.client.RemoteValidateVoucherRequest;
import com.foodthunder.order.dto.client.RemoteVoucherValidationResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(name = "restaurant-service", fallbackFactory = RestaurantClientFallbackFactory.class)
public interface RestaurantClient {

    @GetMapping("/api/v1/products/{id}")
    ResponseEntity<ApiResponse<RemoteProductDto>> getProductDetail(@PathVariable("id") Integer id);

    @GetMapping("/api/v1/restaurants/{id}")
    ResponseEntity<ApiResponse<RemoteRestaurantDto>> getRestaurantDetail(@PathVariable("id") Integer id);

    @GetMapping("/api/v1/restaurants/all")
    ResponseEntity<ApiResponse<List<RemoteRestaurantDto>>> getAllRestaurants();

    @GetMapping("/api/v1/restaurants/stats/summary")
    ResponseEntity<ApiResponse<RemoteRestaurantStatsDto>> getRestaurantStatsSummary();

    @PostMapping("/api/v1/vouchers/validate")
    ResponseEntity<ApiResponse<RemoteVoucherValidationResponse>> validateVoucher(@RequestBody RemoteValidateVoucherRequest request);

    @GetMapping("/api/v1/vouchers/{id}")
    ResponseEntity<ApiResponse<RemoteVoucherValidationResponse>> getVoucherById(@PathVariable("id") Integer id);

    @GetMapping("/api/v1/restaurants/admin/analytics-counts")
    ResponseEntity<ApiResponse<RemoteRestaurantAnalyticsCountsDto>> getRestaurantAnalyticsCounts();

    @PostMapping("/api/v1/products/deduct-stock")
    ResponseEntity<ApiResponse<Void>> deductStock(@RequestBody com.foodthunder.order.dto.client.RemoteDeductStockBatchRequest request);

    @PostMapping("/api/v1/products/restore-stock")
    ResponseEntity<ApiResponse<Void>> restoreStock(@RequestBody com.foodthunder.order.dto.client.RemoteDeductStockBatchRequest request);
}
