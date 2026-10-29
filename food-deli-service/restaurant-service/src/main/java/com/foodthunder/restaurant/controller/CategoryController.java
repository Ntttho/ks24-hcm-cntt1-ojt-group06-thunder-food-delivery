package com.foodthunder.restaurant.controller;

import com.foodthunder.restaurant.dto.ApiResponse;
import com.foodthunder.restaurant.entity.MenuCategory;
import com.foodthunder.restaurant.entity.Shop;
import com.foodthunder.restaurant.exception.ResourceNotFoundException;
import com.foodthunder.restaurant.repository.MenuCategoryRepository;
import com.foodthunder.restaurant.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final MenuCategoryRepository menuCategoryRepository;
    private final ShopRepository shopRepository;

    /**
     * Lấy danh sách danh mục thực đơn theo quán ăn
     * GET /api/v1/categories?restaurantId=1
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCategories(
            @RequestParam(required = false) Integer restaurantId
    ) {
        List<MenuCategory> categories;
        if (restaurantId != null) {
            categories = menuCategoryRepository.findByRestaurantId(restaurantId);
        } else {
            categories = menuCategoryRepository.findAll();
        }

        List<Map<String, Object>> response = categories.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("name", c.getName());
            map.put("restaurantId", c.getRestaurant() != null ? c.getRestaurant().getId() : null);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục thành công", response));
    }

    /**
     * Tạo mới danh mục thực đơn
     * POST /api/v1/categories
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createCategory(
            @RequestBody Map<String, Object> body
    ) {
        Integer restaurantId = (Integer) body.get("restaurantId");
        String name = (String) body.get("name");

        if (restaurantId == null || name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("restaurantId và name không được để trống");
        }

        Shop shop = shopRepository.findByIdAndDeletedAtIsNull(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quán với ID: " + restaurantId));

        MenuCategory category = MenuCategory.builder()
                .restaurant(shop)
                .name(name.trim())
                .build();
        MenuCategory saved = menuCategoryRepository.save(category);

        Map<String, Object> result = new HashMap<>();
        result.put("id", saved.getId());
        result.put("name", saved.getName());
        result.put("restaurantId", shop.getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo danh mục thành công", result));
    }
}
