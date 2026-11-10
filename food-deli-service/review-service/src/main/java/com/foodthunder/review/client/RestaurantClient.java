package com.foodthunder.review.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;

@FeignClient(name = "restaurant-service")
public interface RestaurantClient {

    @PutMapping("/api/v1/restaurants/{id}/rating")
    Object updateRating(
            @PathVariable("id") Integer id,
            @RequestParam("ratingAvg") BigDecimal ratingAvg,
            @RequestHeader("X-User-Role") String roleHeader
    );
}
