package com.foodthunder.order.client;

import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.client.RemoteProductDto;
import com.foodthunder.order.dto.client.RemoteRestaurantDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "restaurant-service", fallbackFactory = RestaurantClientFallbackFactory.class)
public interface RestaurantClient {

    @GetMapping("/api/v1/products/{id}")
    ResponseEntity<ApiResponse<RemoteProductDto>> getProductDetail(@PathVariable("id") Integer id);

    @GetMapping("/api/v1/restaurants/{id}")
    ResponseEntity<ApiResponse<RemoteRestaurantDto>> getRestaurantDetail(@PathVariable("id") Integer id);
}
