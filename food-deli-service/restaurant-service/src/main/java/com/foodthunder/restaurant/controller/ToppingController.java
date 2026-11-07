package com.foodthunder.restaurant.controller;

import com.foodthunder.restaurant.dto.*;
import com.foodthunder.restaurant.service.ToppingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/toppings")
@RequiredArgsConstructor
public class ToppingController {

    private final ToppingService toppingService;

    /**
     * Lấy danh sách topping theo quán ăn (hỗ trợ phân trang và tìm kiếm theo tên/nhóm)
     * GET /api/v1/toppings?restaurantId=1&page=0&size=10&search=pho+mai&groupName=Vien+banh
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ToppingDto>>> getToppings(
            @RequestParam(required = false) Integer restaurantId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String groupName,
            @RequestParam(required = false) Boolean isAvailable,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        if (restaurantId == null) {
            return ResponseEntity.ok(ApiResponse.success("Danh sách topping", PageResponse.of(Page.empty())));
        }
        PageResponse<ToppingDto> paged = toppingService.getToppingsByRestaurantPaged(restaurantId, search, groupName, isAvailable, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách topping thành công", paged));
    }

    /**
     * Lấy toàn bộ topping của quán không phân trang (phục vụ modal gán topping hoặc dropdown)
     * GET /api/v1/toppings/all?restaurantId=1
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<ToppingDto>>> getAllToppings(
            @RequestParam(required = false) Integer restaurantId,
            @RequestParam(required = false) String groupName
    ) {
        if (restaurantId == null) {
            return ResponseEntity.ok(ApiResponse.success("Danh sách topping", List.of()));
        }
        List<ToppingDto> list = toppingService.getToppingsByRestaurant(restaurantId, groupName);
        return ResponseEntity.ok(ApiResponse.success("Lấy tất cả topping thành công", list));
    }

    @GetMapping({"/restaurants/{restaurantId}", "/restaurant/{restaurantId}"})
    public ResponseEntity<ApiResponse<PageResponse<ToppingDto>>> getToppingsByRestaurantPath(
            @PathVariable Integer restaurantId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String groupName,
            @RequestParam(required = false) Boolean isAvailable,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<ToppingDto> paged = toppingService.getToppingsByRestaurantPaged(restaurantId, search, groupName, isAvailable, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách topping thành công", paged));
    }

    /**
     * Lấy danh sách topping được gom theo nhóm (Topping Groups) của quán
     * GET /api/v1/toppings/groups?restaurantId=1
     */
    @GetMapping("/groups")
    public ResponseEntity<ApiResponse<List<ToppingGroupDto>>> getToppingGroups(
            @RequestParam(required = false) Integer restaurantId
    ) {
        if (restaurantId == null) {
            return ResponseEntity.ok(ApiResponse.success("Danh sách nhóm topping", List.of()));
        }
        List<ToppingGroupDto> groups = toppingService.getToppingGroupsByRestaurant(restaurantId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách nhóm topping thành công", groups));
    }

    /**
     * Xem chi tiết topping theo ID
     * GET /api/v1/toppings/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ToppingDto>> getToppingById(@PathVariable Integer id) {
        ToppingDto dto = toppingService.getToppingById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin topping thành công", dto));
    }

    /**
     * Tạo mới topping cho quán ăn
     * POST /api/v1/toppings
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ToppingDto>> createTopping(
            @Valid @RequestBody CreateToppingRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        ToppingDto created = toppingService.createTopping(request, userId, userRole);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo mới topping thành công", created));
    }

    /**
     * Cập nhật thông tin topping (tên, nhóm, giá tiền, trạng thái)
     * PUT /api/v1/toppings/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ToppingDto>> updateTopping(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateToppingRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        ToppingDto updated = toppingService.updateTopping(id, request, userId, userRole);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật topping thành công", updated));
    }

    /**
     * Bật/Tắt trạng thái còn hàng của topping
     * PATCH /api/v1/toppings/{id}/status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ToppingDto>> updateToppingStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        Boolean isAvailable = payload.containsKey("isAvailable")
                ? (Boolean) payload.get("isAvailable")
                : true;
        ToppingDto updated = toppingService.updateToppingStatus(id, isAvailable, userId, userRole);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái topping thành công", updated));
    }

    /**
     * Xóa topping khỏi quán ăn
     * DELETE /api/v1/toppings/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTopping(
            @PathVariable Integer id,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        toppingService.deleteTopping(id, userId, userRole);
        return ResponseEntity.ok(ApiResponse.success("Xóa topping thành công", null));
    }
}

