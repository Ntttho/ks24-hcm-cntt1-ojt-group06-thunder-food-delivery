package com.foodthunder.order.controller;

import com.foodthunder.order.dto.*;
import com.foodthunder.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * API Checklist 2: POST /api/v1/orders
     * Tạo đơn hàng mới trong ACID Transaction:
     * 1. Kiểm tra sản phẩm tồn tại và thuộc cùng 1 quán qua OpenFeign restaurant-service.
     * 2. Tính toán tổng tiền món + tổng tiền topping + phí giao hàng.
     * 3. Lưu đơn với trạng thái khởi tạo PENDING.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader
    ) {
        Integer customerId = parseUserId(userIdHeader, 1);
        log.info("Received create order request from customer: {}, restaurantId: {}", customerId, request.getRestaurantId());
        OrderResponse response = orderService.createOrder(request, customerId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Đơn hàng đã được tạo thành công", response));
    }

    /**
     * API Checklist 3: GET /api/v1/orders/my-orders
     * Lấy lịch sử đơn hàng của khách hàng đang đăng nhập.
     */
    @GetMapping("/my-orders")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getMyOrders(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Integer customerId = parseUserId(userIdHeader, 1);
        PageResponse<OrderResponse> response = orderService.getMyOrders(customerId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng thành công", response));
    }

    /**
     * API Checklist 4: GET /api/v1/orders/{id}
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

    /**
     * API Checklist 5: PUT /api/v1/orders/{id}/status
     * Cập nhật trạng thái đơn hàng (Kiểm tra nghiêm ngặt điều kiện State Machine).
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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<OrderResponse> response = orderService.getOrders(restaurantId, driverId, status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng thành công", response));
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
}
