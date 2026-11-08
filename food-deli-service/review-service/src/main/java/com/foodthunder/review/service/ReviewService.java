package com.foodthunder.review.service;

import com.foodthunder.common.dto.response.PageResponse;
import com.foodthunder.review.dto.request.AdminReviewRequest;
import com.foodthunder.review.dto.request.SubmitOrderReviewRequest;
import com.foodthunder.review.dto.response.OrderReviewEligibilityDto;
import com.foodthunder.review.dto.response.ReviewResponseDto;
import com.foodthunder.review.dto.response.ReviewSummaryDto;

import java.time.LocalDate;
import java.util.List;

public interface ReviewService {

    // Customer - Combined & Separate Reviews
    List<ReviewResponseDto> submitOrderReview(SubmitOrderReviewRequest request, Long customerId);

    ReviewResponseDto submitRestaurantReview(com.foodthunder.review.dto.request.SubmitRestaurantReviewRequest request, Long customerId);

    ReviewResponseDto submitDriverReview(com.foodthunder.review.dto.request.SubmitDriverReviewRequest request, Long customerId);

    com.foodthunder.review.dto.response.OrderReviewStatusDto getOrderReviewStatus(Long orderId, Long customerId);

    OrderReviewEligibilityDto checkEligibility(Long orderId, Long customerId);

    PageResponse<ReviewResponseDto> getRestaurantReviews(Long restaurantId, Long foodItemId, Integer rating, String keyword, int page, int size);

    ReviewSummaryDto getRestaurantSummary(Long restaurantId);

    // Driver / Shipper
    PageResponse<ReviewResponseDto> getDriverReviews(Long driverId, LocalDate fromDate, LocalDate toDate, Integer rating, int page, int size);

    ReviewSummaryDto getDriverSummary(Long driverId);

    // Admin (CRD)
    PageResponse<ReviewResponseDto> getAdminReviews(String targetType, Long targetId, Integer rating, String keyword, int page, int size);

    ReviewResponseDto getReviewById(Long id);

    ReviewResponseDto createAdminReview(AdminReviewRequest request);

    void deleteReview(Long id);
}

