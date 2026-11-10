package com.foodthunder.review.client;

import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.review.dto.client.OrderClientDto;
import com.foodthunder.review.dto.client.ReviewOrderContextDto;
import com.foodthunder.review.dto.client.ReviewOrderContextRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

@FeignClient(name = "order-service")
public interface OrderClient {

    @GetMapping("/api/v1/orders/{id}")
    ApiResponse<OrderClientDto> getOrderById(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    );

    @PostMapping("/api/v1/orders/review-contexts")
    ApiResponse<List<ReviewOrderContextDto>> getReviewOrderContexts(
            @RequestBody ReviewOrderContextRequest request,
            @RequestHeader("X-User-Role") String userRoleHeader
    );
}
