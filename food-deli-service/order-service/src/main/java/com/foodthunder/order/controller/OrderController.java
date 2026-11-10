package com.foodthunder.order.controller;

import com.foodthunder.order.dto.*;
import com.foodthunder.order.exception.BadRequestException;
import com.foodthunder.order.exception.ForbiddenException;
import com.foodthunder.order.exception.UnauthorizedException;
import com.foodthunder.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * API Checklist 2 & 3: POST /api/v1/orders
     * Tạo đơn hàng mới trong ACID Transaction:
     * 1. Kiểm tra tính hợp lệ và trạng thái mở cửa của quán qua OpenFeign restaurant-service.
     * 2. Kiểm tra sản phẩm tồn tại và thuộc cùng 1 quán.
     * 3. Tính toán tổng tiền món + tổng tiền topping + phí giao hàng.
     * 4. Lưu đơn với trạng thái ban đầu: PENDING (nếu COD) hoặc AWAITING_PAYMENT (nếu VNPay).
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader
    ) {
        Integer customerId = requireUserId(userIdHeader);
        log.info("Received create order request from customer: {}, restaurantId: {}, paymentMethod: {}",
                customerId, request.getRestaurantId(), request.getPaymentMethod());
        OrderResponse response = orderService.createOrder(request, customerId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Đơn hàng đã được tạo thành công", response));
    }

    /**
     * API Checklist 4: GET /api/v1/orders/my-orders
     * Lấy lịch sử đơn hàng của khách hàng đang đăng nhập theo X-User-Id.
     */
    @GetMapping("/my-orders")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getMyOrders(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Integer customerId = requireUserId(userIdHeader);
        PageResponse<OrderResponse> response = orderService.getMyOrders(customerId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng thành công", response));
    }

    /**
     * GET /api/v1/orders/{id}
     * Xem chi tiết đơn hàng và toàn bộ lịch sử tiến trình (State logs).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderDetail(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    ) {
        Integer userId = parseUserId(userIdHeader, null);
        OrderResponse response = orderService.getOrderById(id, userId, userRoleHeader);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết đơn hàng thành công", response));
    }

    @PostMapping("/review-contexts")
    public ResponseEntity<ApiResponse<List<ReviewOrderContextResponse>>> getReviewOrderContexts(
            @Valid @RequestBody ReviewOrderContextRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    ) {
        requireAdminRole(userRoleHeader);
        List<ReviewOrderContextResponse> response = orderService.getReviewOrderContexts(request.getOrderIds());
        return ResponseEntity.ok(ApiResponse.success("Lấy ngữ cảnh đơn hàng cho đánh giá thành công", response));
    }

    /**
     * API Checklist 5: PUT /api/v1/orders/{id}/status
     * Cập nhật trạng thái đơn hàng (Kiểm tra nghiêm ngặt điều kiện State Machine & RBAC).
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    ) {
        Integer userId = parseUserId(userIdHeader, null);
        OrderResponse response = orderService.updateOrderStatus(id, request, userId, userRoleHeader);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái đơn hàng thành công", response));
    }

    /**
     * GET /api/v1/orders
     * Danh sách đơn hàng có bộ lọc (cho Quán ăn, Tài xế, Quản trị viên).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getOrders(
            @RequestParam(required = false) Integer restaurantId,
            @RequestParam(required = false) Integer driverId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String searchTerm = keyword != null && !keyword.isBlank() ? keyword : search;
        PageResponse<OrderResponse> response = orderService.getOrders(restaurantId, driverId, status, searchTerm, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng thành công", response));
    }

    /**
     * PUT /api/v1/orders/{id}/payment-success
     * Kích hoạt khi SePay Webhook / Polling xác nhận biến động số dư thành công:
     * Chuyển trạng thái từ AWAITING_PAYMENT -> PENDING và bắn WebSocket chuông cho quán.
     */
    @PutMapping("/{id}/payment-success")
    public ResponseEntity<ApiResponse<OrderResponse>> confirmPaymentSuccess(
            @PathVariable Long id,
            @RequestParam(required = false) String transactionNo
    ) {
        log.info("Received confirm payment success for order ID: {}, transactionNo: {}", id, transactionNo);
        OrderResponse response = orderService.confirmPaymentSuccess(id, transactionNo);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận thanh toán đơn hàng thành công", response));
    }

    /**
     * PUT /api/v1/orders/{id}/cancel & POST /api/v1/orders/{id}/cancel
     * Hủy đơn hàng (khi khách hủy trong 8 phút hoặc quá thời hạn thanh toán).
     */
    @RequestMapping(value = "/{id}/cancel", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    ) {
        Integer userId = parseUserId(userIdHeader, null);
        log.info("Received cancel order request for order ID: {}, reason: {}, userId: {}", id, reason, userId);
        OrderResponse response = orderService.cancelOrder(id, reason, userId, userRoleHeader);
        return ResponseEntity.ok(ApiResponse.success("Hủy đơn hàng thành công", response));
    }

    private Integer requireUserId(String userIdHeader) {
        if (userIdHeader == null || userIdHeader.isBlank()) {
            throw new UnauthorizedException("Yêu cầu thông tin định danh khách hàng (X-User-Id không hợp lệ hoặc thiếu)");
        }
        try {
            return Integer.parseInt(userIdHeader.trim());
        } catch (NumberFormatException e) {
            throw new BadRequestException("Định dạng X-User-Id không hợp lệ: " + userIdHeader);
        }
    }

    private Integer parseUserId(String userIdHeader, Integer fallback) {
        if (userIdHeader != null && !userIdHeader.isBlank()) {
            try {
                return Integer.parseInt(userIdHeader.trim());
            } catch (NumberFormatException ignored) {
            }
        }
        return fallback;
    }

    private void requireAdminRole(String userRoleHeader) {
        if (userRoleHeader == null || userRoleHeader.isBlank()) {
            throw new UnauthorizedException("Thiếu thông tin phân quyền vai trò người dùng");
        }
        boolean isAdmin = Arrays.stream(userRoleHeader.split("[,\\s]+"))
                .anyMatch(role -> "ROLE_ADMIN".equalsIgnoreCase(role.trim()));
        if (!isAdmin) {
            throw new ForbiddenException("Chỉ quản trị viên mới được truy xuất ngữ cảnh đánh giá");
        }
    }
}
