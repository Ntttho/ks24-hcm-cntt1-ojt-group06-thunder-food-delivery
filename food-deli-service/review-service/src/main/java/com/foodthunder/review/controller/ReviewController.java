package com.foodthunder.review.controller;

import com.foodthunder.common.constant.HeaderConstants;
import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.common.dto.response.PageResponse;
import com.foodthunder.review.dto.request.AdminReviewRequest;
import com.foodthunder.review.dto.request.SubmitDriverReviewRequest;
import com.foodthunder.review.dto.request.SubmitOrderReviewRequest;
import com.foodthunder.review.dto.request.SubmitRestaurantReviewRequest;
import com.foodthunder.review.dto.response.OrderReviewEligibilityDto;
import com.foodthunder.review.dto.response.OrderReviewStatusDto;
import com.foodthunder.review.dto.response.ReviewResponseDto;
import com.foodthunder.review.dto.response.ReviewSummaryDto;
import com.foodthunder.review.exception.BadRequestException;
import com.foodthunder.review.exception.ForbiddenException;
import com.foodthunder.review.exception.UnauthorizedException;
import com.foodthunder.review.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // ==========================================
    // 1. CUSTOMER APIS
    // ==========================================

    /**
     * Khách hàng gửi đánh giá đơn hàng (Nhà hàng + Món ăn + Tài xế).
     * Ràng buộc: Phải trong vòng 24h sau khi hoàn tất đơn hàng và mỗi đơn chỉ được đánh giá 1 lần.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<List<ReviewResponseDto>>> submitReview(
            @Valid @RequestBody SubmitOrderReviewRequest request,
            @RequestHeader(value = HeaderConstants.X_USER_ID, required = false) String userIdHeader,
            @RequestHeader(value = HeaderConstants.X_USER_ROLE, required = false) String roleHeader
    ) {
        Long customerId = requireUserId(userIdHeader);
        List<ReviewResponseDto> result = reviewService.submitOrderReview(request, customerId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Đánh giá đơn hàng thành công", result));
    }

    /**
     * Khách hàng đánh giá RIÊNG cho Nhà hàng / Món ăn (1-5 sao, gắn món, ảnh).
     */
    @PostMapping("/restaurant")
    public ResponseEntity<ApiResponse<ReviewResponseDto>> submitRestaurantReview(
            @Valid @RequestBody SubmitRestaurantReviewRequest request,
            @RequestHeader(value = HeaderConstants.X_USER_ID, required = false) String userIdHeader
    ) {
        Long customerId = requireUserId(userIdHeader);
        ReviewResponseDto result = reviewService.submitRestaurantReview(request, customerId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Đánh giá nhà hàng thành công", result));
    }

    /**
     * Khách hàng đánh giá RIÊNG cho Tài xế / Shipper (1-5 sao, quick tags, nhận xét).
     */
    @PostMapping("/driver")
    public ResponseEntity<ApiResponse<ReviewResponseDto>> submitDriverReview(
            @Valid @RequestBody SubmitDriverReviewRequest request,
            @RequestHeader(value = HeaderConstants.X_USER_ID, required = false) String userIdHeader
    ) {
        Long customerId = requireUserId(userIdHeader);
        ReviewResponseDto result = reviewService.submitDriverReview(request, customerId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Đánh giá tài xế thành công", result));
    }

    /**
     * Kiểm tra trạng thái đánh giá chi tiết (Quán đã review chưa, Tài xế đã review chưa, thời gian 24h còn lại).
     */
    @GetMapping("/orders/{orderId}/status")
    public ResponseEntity<ApiResponse<OrderReviewStatusDto>> getOrderReviewStatus(
            @PathVariable Long orderId,
            @RequestHeader(value = HeaderConstants.X_USER_ID, required = false) String userIdHeader
    ) {
        Long customerId = requireUserId(userIdHeader);
        OrderReviewStatusDto result = reviewService.getOrderReviewStatus(orderId, customerId);
        return ResponseEntity.ok(ApiResponse.success("Kiểm tra trạng thái đánh giá đơn hàng thành công", result));
    }

    /**
     * Kiểm tra trạng thái đủ điều kiện đánh giá của đơn hàng (thời gian 24h, đã đánh giá chưa).
     */
    @GetMapping("/orders/{orderId}/eligibility")
    public ResponseEntity<ApiResponse<OrderReviewEligibilityDto>> checkEligibility(
            @PathVariable Long orderId,
            @RequestHeader(value = HeaderConstants.X_USER_ID, required = false) String userIdHeader
    ) {
        Long customerId = requireUserId(userIdHeader);
        OrderReviewEligibilityDto result = reviewService.checkEligibility(orderId, customerId);
        return ResponseEntity.ok(ApiResponse.success("Kiểm tra điều kiện đánh giá thành công", result));
    }

    /**
     * Xem danh sách đánh giá của nhà hàng (Public cho khách hàng khi xem chi tiết quán).
     */
    @GetMapping("/restaurants/{restaurantId}")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponseDto>>> getRestaurantReviews(
            @PathVariable Long restaurantId,
            @RequestParam(required = false) Long foodItemId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<ReviewResponseDto> result = reviewService.getRestaurantReviews(restaurantId, foodItemId, rating, keyword, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đánh giá thành công", result));
    }

    /**
     * Xem thống kê tổng quan số sao của quán.
     */
    @GetMapping("/restaurants/{restaurantId}/summary")
    public ResponseEntity<ApiResponse<ReviewSummaryDto>> getRestaurantSummary(@PathVariable Long restaurantId) {
        ReviewSummaryDto result = reviewService.getRestaurantSummary(restaurantId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thống kê đánh giá thành công", result));
    }

    // ==========================================
    // 2. MERCHANT APIS (READ-ONLY)
    // ==========================================

    /**
     * Quản lý đánh giá dành cho Merchant:
     * Xem danh sách, tìm kiếm, lọc theo món ăn. Tuyệt đối không cho sửa/xóa.
     */
    @GetMapping("/merchant/mine")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponseDto>>> getMerchantReviews(
            @RequestParam Long restaurantId,
            @RequestParam(required = false) Long foodItemId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader(value = HeaderConstants.X_USER_ID, required = false) String userIdHeader,
            @RequestHeader(value = HeaderConstants.X_USER_ROLE, required = false) String roleHeader
    ) {
        requireRole(roleHeader, "ROLE_MERCHANT", "ROLE_ADMIN");
        PageResponse<ReviewResponseDto> result = reviewService.getRestaurantReviews(restaurantId, foodItemId, rating, keyword, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đánh giá quán thành công", result));
    }

    // ==========================================
    // 3. DRIVER / SHIPPER APIS (READ-ONLY)
    // ==========================================

    /**
     * Xem đánh giá về tài xế:
     * Lọc theo ngày input (fromDate - toDate), tìm kiếm. Tuyệt đối không cho sửa/xóa.
     */
    @GetMapping("/driver/mine")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponseDto>>> getDriverReviews(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader(value = HeaderConstants.X_USER_ID, required = false) String userIdHeader,
            @RequestHeader(value = HeaderConstants.X_USER_ROLE, required = false) String roleHeader
    ) {
        requireRole(roleHeader, "ROLE_DRIVER", "ROLE_ADMIN");
        Long driverId = requireUserId(userIdHeader);
        PageResponse<ReviewResponseDto> result = reviewService.getDriverReviews(driverId, fromDate, toDate, rating, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đánh giá tài xế thành công", result));
    }

    @GetMapping("/driver/summary")
    public ResponseEntity<ApiResponse<ReviewSummaryDto>> getDriverSummary(
            @RequestHeader(value = HeaderConstants.X_USER_ID, required = false) String userIdHeader,
            @RequestHeader(value = HeaderConstants.X_USER_ROLE, required = false) String roleHeader
    ) {
        requireRole(roleHeader, "ROLE_DRIVER", "ROLE_ADMIN");
        Long driverId = requireUserId(userIdHeader);
        ReviewSummaryDto result = reviewService.getDriverSummary(driverId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thống kê đánh giá tài xế thành công", result));
    }

    // ==========================================
    // 4. ADMIN APIS (CRD TOÀN QUYỀN)
    // ==========================================

    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponseDto>>> getAdminReviews(
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Long targetId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader(value = HeaderConstants.X_USER_ROLE, required = false) String roleHeader
    ) {
        requireRole(roleHeader, "ROLE_ADMIN");
        PageResponse<ReviewResponseDto> result = reviewService.getAdminReviews(targetType, targetId, rating, keyword, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy toàn bộ đánh giá hệ thống thành công", result));
    }

    @GetMapping("/admin/{id}")
    public ResponseEntity<ApiResponse<ReviewResponseDto>> getAdminReviewDetail(
            @PathVariable Long id,
            @RequestHeader(value = HeaderConstants.X_USER_ROLE, required = false) String roleHeader
    ) {
        requireRole(roleHeader, "ROLE_ADMIN");
        ReviewResponseDto result = reviewService.getReviewById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết đánh giá thành công", result));
    }

    @PostMapping("/admin")
    public ResponseEntity<ApiResponse<ReviewResponseDto>> createAdminReview(
            @Valid @RequestBody AdminReviewRequest request,
            @RequestHeader(value = HeaderConstants.X_USER_ROLE, required = false) String roleHeader
    ) {
        requireRole(roleHeader, "ROLE_ADMIN");
        ReviewResponseDto result = reviewService.createAdminReview(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo đánh giá quản trị thành công", result));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAdminReview(
            @PathVariable Long id,
            @RequestHeader(value = HeaderConstants.X_USER_ROLE, required = false) String roleHeader
    ) {
        requireRole(roleHeader, "ROLE_ADMIN");
        reviewService.deleteReview(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa đánh giá thành công", null));
    }

    // Helper RBAC check
    private Long requireUserId(String header) {
        if (header == null || header.isBlank()) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện thao tác");
        }
        try {
            return Long.parseLong(header.trim());
        } catch (NumberFormatException e) {
            throw new BadRequestException("X-User-Id không hợp lệ: " + header);
        }
    }

    private void requireRole(String roleHeader, String... allowedRoles) {
        if (roleHeader == null || roleHeader.isBlank()) {
            throw new UnauthorizedException("Thiếu thông tin phân quyền vai trò người dùng");
        }
        for (String allowed : allowedRoles) {
            if (roleHeader.contains(allowed)) {
                return;
            }
        }
        throw new ForbiddenException("Bạn không có quyền thực hiện hành động này");
    }
}

