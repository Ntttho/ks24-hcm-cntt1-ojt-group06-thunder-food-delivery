package com.foodthunder.restaurant.controller;

import com.foodthunder.restaurant.dto.*;
import com.foodthunder.restaurant.service.ToppingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
     * Lấy danh sách topping theo quán ăn (hỗ trợ lọc theo groupName)
     * GET /api/v1/toppings?restaurantId=1&groupName=Size+ly
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ToppingDto>>> getToppings(
            @RequestParam Integer restaurantId,
            @RequestParam(required = false) String groupName
    ) {
        List<ToppingDto> list = toppingService.getToppingsByRestaurant(restaurantId, groupName);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách topping thành công", list));
    }

    /**
     * Lấy danh sách topping được gom theo nhóm (Topping Groups) của quán
     * GET /api/v1/toppings/groups?restaurantId=1
     */
    @GetMapping("/groups")
    public ResponseEntity<ApiResponse<List<ToppingGroupDto>>> getToppingGroups(
            @RequestParam Integer restaurantId
    ) {
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

