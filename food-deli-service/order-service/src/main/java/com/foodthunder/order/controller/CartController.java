package com.foodthunder.order.controller;

import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.cart.*;
import com.foodthunder.order.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    /**
     * Lấy dữ liệu giỏ hàng của người dùng hiện tại từ Redis
     * GET /api/v1/cart
     */
    @GetMapping
    public ResponseEntity<ApiResponse<CartDto>> getCart(
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestParam(required = false) Long userId
    ) {
        Long effectiveUserId = resolveUserId(headerUserId, userId);
        CartDto cart = cartService.getCart(effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success("Lấy giỏ hàng thành công", cart));
    }

    /**
     * Thêm món ăn vào giỏ hàng (Áp dụng Single-Shop Constraint)
     * POST /api/v1/cart/items
     */
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartDto>> addItem(
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestParam(required = false) Long userId,
            @Valid @RequestBody AddCartItemRequest request
    ) {
        Long effectiveUserId = resolveUserId(headerUserId, userId);
        CartDto cart = cartService.addItem(effectiveUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Đã thêm món vào giỏ hàng", cart));
    }

    /**
     * Cập nhật số lượng của món ăn trong giỏ
     * PUT /api/v1/cart/items/{itemId}
     */
    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartDto>> updateItemQuantity(
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestParam(required = false) Long userId,
            @PathVariable String itemId,
            @Valid @RequestBody UpdateCartItemRequest request
    ) {
        Long effectiveUserId = resolveUserId(headerUserId, userId);
        CartDto cart = cartService.updateItemQuantity(effectiveUserId, itemId, request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật số lượng món thành công", cart));
    }

    /**
     * Xóa một món ăn khỏi giỏ hàng
     * DELETE /api/v1/cart/items/{itemId}
     */
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartDto>> removeItem(
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestParam(required = false) Long userId,
            @PathVariable String itemId
    ) {
        Long effectiveUserId = resolveUserId(headerUserId, userId);
        CartDto cart = cartService.removeItem(effectiveUserId, itemId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa món khỏi giỏ hàng", cart));
    }

    /**
     * Xóa toàn bộ giỏ hàng
     * DELETE /api/v1/cart
     */
    @DeleteMapping
    public ResponseEntity<ApiResponse<CartDto>> clearCart(
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestParam(required = false) Long userId
    ) {
        Long effectiveUserId = resolveUserId(headerUserId, userId);
        CartDto cart = cartService.clearCart(effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa toàn bộ giỏ hàng", cart));
    }

    /**
     * Đồng bộ toàn bộ giỏ hàng Redux Client lên Redis
     * POST /api/v1/cart/sync
     */
    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<CartDto>> syncCart(
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestParam(required = false) Long userId,
            @RequestBody SyncCartRequest request
    ) {
        Long effectiveUserId = resolveUserId(headerUserId, userId);
        CartDto cart = cartService.syncCart(effectiveUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Đồng bộ giỏ hàng với Redis thành công", cart));
    }

    private Long resolveUserId(Long headerUserId, Long queryUserId) {
        if (headerUserId != null) {
            return headerUserId;
        }
        if (queryUserId != null) {
            return queryUserId;
        }
        return 1L; // Fallback customer ID mặc định
    }
}

