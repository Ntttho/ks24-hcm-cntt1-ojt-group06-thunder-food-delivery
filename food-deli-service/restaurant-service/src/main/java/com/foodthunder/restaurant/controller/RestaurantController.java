package com.foodthunder.restaurant.controller;

import com.foodthunder.restaurant.dto.ApiResponse;
import com.foodthunder.restaurant.dto.PageResponse;
import com.foodthunder.restaurant.dto.ProductDto;
import com.foodthunder.restaurant.dto.RestaurantDetailDto;
import com.foodthunder.restaurant.dto.RestaurantDto;
import com.foodthunder.restaurant.service.ProductService;
import com.foodthunder.restaurant.service.RestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/restaurants", "/api/v1/shops"})
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;
    private final ProductService productService;

    /**
     * API 1.2: Lấy danh sách quán ăn (hỗ trợ phân trang, tìm kiếm theo tên, lọc theo danh mục)
     * GET /api/v1/restaurants?page=0&size=10&search=tra+sua&categoryId=1&isOpen=true
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<RestaurantDto>>> getRestaurants(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Boolean isOpen,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<RestaurantDto> response = restaurantService.getRestaurants(search, categoryId, isOpen, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách quán ăn thành công", response));
    }

    /**
     * API 1.3: Xem chi tiết quán kèm toàn bộ thực đơn đã được nhóm theo danh mục
     * GET /api/v1/restaurants/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RestaurantDetailDto>> getRestaurantDetail(@PathVariable Integer id) {
        RestaurantDetailDto detail = restaurantService.getRestaurantDetail(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết quán ăn thành công", detail));
    }

    /**
     * Danh sách quán ăn của chủ quán (Merchant Multi-shops)
     * GET /api/v1/restaurants/mine
     */
    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<List<RestaurantDto>>> getMyRestaurants(
            @RequestHeader(value = "X-User-Id", required = false) Integer headerOwnerId,
            @RequestParam(required = false) Integer ownerId
    ) {
        Integer effectiveOwnerId = (headerOwnerId != null) ? headerOwnerId : (ownerId != null ? ownerId : 3);
        List<RestaurantDto> restaurants = restaurantService.getRestaurantsByOwner(effectiveOwnerId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách quán của bạn thành công", restaurants));
    }

    /**
     * Lấy danh sách món ăn theo quán ăn
     * GET /api/v1/restaurants/{id}/products
     */
    @GetMapping("/{id}/products")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getProductsByRestaurant(@PathVariable Integer id) {
        List<ProductDto> products = productService.getProductsByRestaurant(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách món của quán thành công", products));
    }

    /**
     * Cập nhật trạng thái mở/đóng cửa của quán
     * PATCH /api/v1/restaurants/{id}/status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<RestaurantDto>> updateShopStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> payload
    ) {
        Boolean isOpen = payload.containsKey("isOpen") ? (Boolean) payload.get("isOpen") : null;
        String reason = payload.containsKey("temporaryClosedReason") ? (String) payload.get("temporaryClosedReason") : null;
        RestaurantDto updated = restaurantService.updateShopStatus(id, isOpen, reason);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái quán thành công", updated));
    }
}
