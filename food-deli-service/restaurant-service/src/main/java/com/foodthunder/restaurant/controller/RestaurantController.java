package com.foodthunder.restaurant.controller;

import com.foodthunder.restaurant.dto.*;
import com.foodthunder.restaurant.exception.UnauthorizedException;
import com.foodthunder.restaurant.exception.ForbiddenException;
import com.foodthunder.restaurant.service.ProductService;
import com.foodthunder.restaurant.service.RestaurantService;
import com.foodthunder.restaurant.service.ToppingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@RestController
@RequestMapping({"/api/v1/restaurants", "/api/v1/shops", "/api/v1/restaurant"})
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;
    private final ProductService productService;
    private final ToppingService toppingService;

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
     * Lấy toàn bộ quán ăn không phân trang (dùng cho dropdown/tiện ích)
     * GET /api/v1/restaurants/all
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<RestaurantDto>>> getAllRestaurants() {
        PageResponse<RestaurantDto> response = restaurantService.getRestaurants(null, null, null, 0, 100);
        return ResponseEntity.ok(ApiResponse.success("Lấy tất cả quán ăn thành công", response.getContent()));
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
     * API 4.2: Danh sách quán ăn của chủ quán có phân trang & tìm kiếm (Merchant Multi-shops)
     * GET /api/v1/restaurants/mine?search=quan&page=0&size=10
     */
    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<PageResponse<RestaurantDto>>> getMyRestaurants(
            @RequestHeader(value = "X-User-Id", required = false) Integer headerOwnerId,
            @RequestParam(required = false) Integer ownerId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Integer effectiveOwnerId = (headerOwnerId != null) ? headerOwnerId : (ownerId != null ? ownerId : 3);
        PageResponse<RestaurantDto> restaurants = restaurantService.getRestaurantsByOwnerPaged(effectiveOwnerId, search, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách quán của bạn thành công", restaurants));
    }

    /**
     * Danh sách toàn bộ quán ăn của chủ quán không phân trang (dropdown chọn quán)
     * GET /api/v1/restaurants/mine/all
     */
    @GetMapping("/mine/all")
    public ResponseEntity<ApiResponse<List<RestaurantDto>>> getMyRestaurantsAll(
            @RequestHeader(value = "X-User-Id", required = false) Integer headerOwnerId,
            @RequestParam(required = false) Integer ownerId
    ) {
        Integer effectiveOwnerId = (headerOwnerId != null) ? headerOwnerId : (ownerId != null ? ownerId : 3);
        List<RestaurantDto> restaurants = restaurantService.getRestaurantsByOwner(effectiveOwnerId);
        return ResponseEntity.ok(ApiResponse.success("Lấy tất cả quán của bạn thành công", restaurants));
    }

    /**
     * API 4.3: Đăng ký quán ăn mới / Đăng ký đối tác quán ăn đầu tiên (Merchant Onboarding)
     * POST /api/v1/restaurants
     */
    @PostMapping
    public ResponseEntity<ApiResponse<RestaurantDto>> createRestaurant(
            @RequestHeader(value = "X-User-Id", required = false) Integer headerOwnerId,
            @RequestParam(required = false) Integer ownerId,
            @Valid @RequestBody CreateRestaurantRequest request
    ) {
        Integer effectiveOwnerId = (headerOwnerId != null) ? headerOwnerId : (ownerId != null ? ownerId : 3);
        RestaurantDto created = restaurantService.createRestaurant(request, effectiveOwnerId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Đăng ký quán ăn thành công", created));
    }

    /**
     * Endpoint theo yêu cầu của Nhóm trưởng Thọ:
     * POST/PUT /api/v1/restaurants/{id}/details
     * Lưu thông tin nhà hàng và lưu vào bảng restaurant_change_requests
     */
    @PostMapping("/{id}/details")
    public ResponseEntity<ApiResponse<RestaurantDto>> updateRestaurantDetailsPost(
            @PathVariable Integer id,
            @RequestHeader(value = "X-User-Id", required = false) Integer headerOwnerId,
            @RequestParam(required = false) Integer ownerId,
            @Valid @RequestBody CreateRestaurantRequest request
    ) {
        Integer effectiveOwnerId = (headerOwnerId != null) ? headerOwnerId : (ownerId != null ? ownerId : 3);
        RestaurantDto updated = restaurantService.updateRestaurantDetails(id, request, effectiveOwnerId);
        return ResponseEntity.ok(ApiResponse.success("Lưu thông tin nhà hàng vào bảng restaurant_change_requests thành công", updated));
    }

    @PutMapping("/{id}/details")
    public ResponseEntity<ApiResponse<RestaurantDto>> updateRestaurantDetailsPut(
            @PathVariable Integer id,
            @RequestHeader(value = "X-User-Id", required = false) Integer headerOwnerId,
            @RequestParam(required = false) Integer ownerId,
            @Valid @RequestBody CreateRestaurantRequest request
    ) {
        Integer effectiveOwnerId = (headerOwnerId != null) ? headerOwnerId : (ownerId != null ? ownerId : 3);
        RestaurantDto updated = restaurantService.updateRestaurantDetails(id, request, effectiveOwnerId);
        return ResponseEntity.ok(ApiResponse.success("Lưu thông tin nhà hàng vào bảng restaurant_change_requests thành công", updated));
    }

    /**
     * Lấy danh sách món ăn theo quán ăn (hỗ trợ phân trang và tìm kiếm theo tên)
     * GET /api/v1/restaurants/{id}/products?page=0&size=10&search=tra+sua&categoryId=1&isAvailable=true
     */
    @GetMapping("/{id}/products")
    public ResponseEntity<ApiResponse<PageResponse<ProductDto>>> getProductsByRestaurant(
            @PathVariable Integer id,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Boolean isAvailable,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<ProductDto> products = productService.getProductsByRestaurantPaged(id, search, categoryId, null, isAvailable, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách món của quán thành công", products));
    }

    @GetMapping("/{id}/products/all")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getProductsByRestaurantAll(@PathVariable Integer id) {
        List<ProductDto> products = productService.getProductsByRestaurant(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy tất cả món của quán thành công", products));
    }

    /**
     * Lấy danh sách topping theo quán ăn (hỗ trợ phân trang và tìm kiếm theo tên)
     * GET /api/v1/restaurants/{id}/toppings?page=0&size=10&search=pho+mai
     */
    @GetMapping("/{id}/toppings")
    public ResponseEntity<ApiResponse<PageResponse<ToppingDto>>> getRestaurantToppings(
            @PathVariable Integer id,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String groupName,
            @RequestParam(required = false) Boolean isAvailable,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<ToppingDto> paged = toppingService.getToppingsByRestaurantPaged(id, search, groupName, isAvailable, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách topping của quán thành công", paged));
    }

    @GetMapping("/{id}/toppings/all")
    public ResponseEntity<ApiResponse<List<ToppingDto>>> getRestaurantAllToppings(
            @PathVariable Integer id,
            @RequestParam(required = false) String groupName
    ) {
        List<ToppingDto> list = toppingService.getToppingsByRestaurant(id, groupName);
        return ResponseEntity.ok(ApiResponse.success("Lấy tất cả topping của quán thành công", list));
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

    @PutMapping("/{id}/rating")
    public ResponseEntity<ApiResponse<RestaurantDto>> updateRating(
            @PathVariable Integer id,
            @RequestParam BigDecimal ratingAvg,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader
    ) {
        if (roleHeader == null || roleHeader.isBlank()) {
            throw new UnauthorizedException("Thiếu thông tin phân quyền vai trò người dùng");
        }
        Set<String> roles = Arrays.stream(roleHeader.split("[,\\s]+"))
                .map(String::trim)
                .map(String::toUpperCase)
                .collect(Collectors.toSet());
        if (!roles.contains("ROLE_ADMIN") && !roles.contains("ADMIN")) {
            throw new ForbiddenException("Chỉ Admin mới được cập nhật điểm đánh giá");
        }
        RestaurantDto updated = restaurantService.updateRating(id, ratingAvg);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật điểm đánh giá nhà hàng thành công", updated));
    }
}
