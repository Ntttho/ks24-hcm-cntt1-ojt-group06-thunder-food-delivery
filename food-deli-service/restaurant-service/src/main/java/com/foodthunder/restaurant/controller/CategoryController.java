package com.foodthunder.restaurant.controller;

import com.foodthunder.restaurant.dto.ApiResponse;
import com.foodthunder.restaurant.dto.CategoryDto;
import com.foodthunder.restaurant.dto.CategoryRequestDto;
import com.foodthunder.restaurant.entity.MenuCategory;
import com.foodthunder.restaurant.entity.Shop;
import com.foodthunder.restaurant.exception.ConflictException;
import com.foodthunder.restaurant.exception.ForbiddenException;
import com.foodthunder.restaurant.exception.ResourceNotFoundException;
import com.foodthunder.restaurant.repository.MenuCategoryRepository;
import com.foodthunder.restaurant.repository.ShopRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
public class CategoryController {

    private final MenuCategoryRepository menuCategoryRepository;
    private final ShopRepository shopRepository;

    public CategoryController(MenuCategoryRepository menuCategoryRepository, ShopRepository shopRepository) {
        this.menuCategoryRepository = menuCategoryRepository;
        this.shopRepository = shopRepository;
    }

    /**
     * Lấy danh sách danh mục thực đơn theo quán ăn
     * GET /api/v1/restaurants/{id}/categories
     */
    @GetMapping("/api/v1/restaurants/{id}/categories")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getCategoriesByRestaurant(@PathVariable("id") Integer id) {
        if (!shopRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy quán với ID: " + id);
        }

        List<CategoryDto> result = menuCategoryRepository.findByRestaurantId(id).stream()
                .map(this::mapCategoryToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục của quán thành công", result));
    }

    /**
     * Lấy danh sách danh mục (hỗ trợ query param restaurantId)
     * GET /api/v1/categories?restaurantId=1
     */
    @GetMapping("/api/v1/categories")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getCategories(
            @RequestParam(required = false) Integer restaurantId
    ) {
        List<MenuCategory> categories;
        if (restaurantId != null) {
            categories = menuCategoryRepository.findByRestaurantId(restaurantId);
        } else {
            categories = menuCategoryRepository.findAll();
        }

        List<CategoryDto> response = categories.stream()
                .map(this::mapCategoryToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục thành công", response));
    }

    /**
     * Tạo mới danh mục thực đơn (CRUD Merchant)
     * POST /api/v1/categories
     */
    @PostMapping("/api/v1/categories")
    public ResponseEntity<ApiResponse<CategoryDto>> createCategory(
            @Valid @RequestBody CategoryRequestDto request,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        Integer restaurantId = request.getRestaurantId();
        String name = request.getName().trim();

        Shop shop = shopRepository.findByIdAndDeletedAtIsNull(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quán với ID: " + restaurantId));

        // RBAC check: merchant must own this shop
        if (userRole != null && userRole.contains("MERCHANT") && userId != null) {
            if (!shop.getOwnerId().equals(userId)) {
                throw new ForbiddenException("Bạn không có quyền thêm danh mục cho quán của chủ sở hữu khác (Chủ quán: " + shop.getOwnerId() + ")");
            }
        }

        // Duplicate name check
        if (menuCategoryRepository.existsByRestaurantIdAndNameIgnoreCase(restaurantId, name)) {
            throw new ConflictException("Danh mục '" + name + "' đã tồn tại trong quán ăn này");
        }

        MenuCategory category = MenuCategory.builder()
                .restaurant(shop)
                .name(name)
                .build();
        MenuCategory saved = menuCategoryRepository.save(category);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo danh mục thành công", mapCategoryToDto(saved)));
    }

    private CategoryDto mapCategoryToDto(MenuCategory c) {
        return CategoryDto.builder()
                .id(c.getId())
                .restaurantId(c.getRestaurant() != null ? c.getRestaurant().getId() : null)
                .name(c.getName())
                .build();
    }
}
