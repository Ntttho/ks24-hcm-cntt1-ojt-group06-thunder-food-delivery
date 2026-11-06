package com.foodthunder.restaurant.controller;

import com.foodthunder.restaurant.dto.ApiResponse;
import com.foodthunder.restaurant.dto.CategoryDto;
import com.foodthunder.restaurant.dto.CategoryRequestDto;
import com.foodthunder.restaurant.dto.ReorderCategoryRequest;
import com.foodthunder.restaurant.entity.MenuCategory;
import com.foodthunder.restaurant.entity.Shop;
import com.foodthunder.restaurant.exception.BadRequestException;
import com.foodthunder.restaurant.exception.ConflictException;
import com.foodthunder.restaurant.exception.ForbiddenException;
import com.foodthunder.restaurant.exception.ResourceNotFoundException;
import com.foodthunder.restaurant.repository.MenuCategoryRepository;
import com.foodthunder.restaurant.repository.ProductRepository;
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
    private final ProductRepository productRepository;

    public CategoryController(
            MenuCategoryRepository menuCategoryRepository,
            ShopRepository shopRepository,
            ProductRepository productRepository
    ) {
        this.menuCategoryRepository = menuCategoryRepository;
        this.shopRepository = shopRepository;
        this.productRepository = productRepository;
    }

    /**
     * Lấy danh sách danh mục thực đơn theo quán ăn (có thứ tự hiển thị)
     * GET /api/v1/restaurants/{id}/categories
     */
    @GetMapping("/api/v1/restaurants/{id}/categories")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getCategoriesByRestaurant(@PathVariable("id") Integer id) {
        if (!shopRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy quán với ID: " + id);
        }

        List<CategoryDto> result = menuCategoryRepository.findByRestaurantIdOrderByDisplayOrderAscIdAsc(id).stream()
                .map(this::mapCategoryToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục của quán thành công", result));
    }

    /**
     * Lấy danh sách danh mục (hỗ trợ query param restaurantId, sắp xếp theo displayOrder)
     * GET /api/v1/categories?restaurantId=1
     */
    @GetMapping("/api/v1/categories")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getCategories(
            @RequestParam(required = false) Integer restaurantId
    ) {
        List<MenuCategory> categories;
        if (restaurantId != null) {
            categories = menuCategoryRepository.findByRestaurantIdOrderByDisplayOrderAscIdAsc(restaurantId);
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
        if (restaurantId == null) {
            throw new BadRequestException("restaurantId không được để trống khi tạo mới danh mục");
        }
        String name = request.getName().trim();

        Shop shop = shopRepository.findByIdAndDeletedAtIsNull(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quán với ID: " + restaurantId));

        // RBAC check: merchant must own this shop
        checkShopOwnership(shop, userId, userRole);

        // Duplicate name check
        if (menuCategoryRepository.existsByRestaurantIdAndNameIgnoreCase(restaurantId, name)) {
            throw new ConflictException("Danh mục '" + name + "' đã tồn tại trong quán ăn này");
        }

        Integer displayOrder = request.getDisplayOrder();
        if (displayOrder == null) {
            // Assign to the end of list
            List<MenuCategory> existing = menuCategoryRepository.findByRestaurantId(restaurantId);
            displayOrder = existing.size();
        }

        MenuCategory category = MenuCategory.builder()
                .restaurant(shop)
                .name(name)
                .displayOrder(displayOrder)
                .build();
        MenuCategory saved = menuCategoryRepository.save(category);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo danh mục thành công", mapCategoryToDto(saved)));
    }

    /**
     * Cập nhật danh mục thực đơn (Đổi tên, cập nhật thứ tự hiển thị)
     * PUT /api/v1/categories/{id}
     */
    @PutMapping("/api/v1/categories/{id}")
    public ResponseEntity<ApiResponse<CategoryDto>> updateCategory(
            @PathVariable Integer id,
            @Valid @RequestBody CategoryRequestDto request,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        MenuCategory category = menuCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));

        Shop shop = category.getRestaurant();
        checkShopOwnership(shop, userId, userRole);

        String newName = request.getName().trim();
        // Check duplicate name excluding current category
        if (menuCategoryRepository.existsByRestaurantIdAndNameIgnoreCaseAndIdNot(shop.getId(), newName, id)) {
            throw new ConflictException("Tên danh mục '" + newName + "' đã tồn tại trong quán ăn này");
        }

        category.setName(newName);
        if (request.getDisplayOrder() != null) {
            category.setDisplayOrder(request.getDisplayOrder());
        }

        MenuCategory updated = menuCategoryRepository.save(category);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật danh mục thành công", mapCategoryToDto(updated)));
    }

    /**
     * Xóa danh mục thực đơn
     * DELETE /api/v1/categories/{id}
     */
    @DeleteMapping("/api/v1/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @PathVariable Integer id,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        MenuCategory category = menuCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));

        Shop shop = category.getRestaurant();
        checkShopOwnership(shop, userId, userRole);

        // Check if there are active products inside this category
        long productCount = productRepository.countByCategoryIdAndDeletedAtIsNull(id);
        if (productCount > 0) {
            throw new BadRequestException("Không thể xoá! Danh mục đang chứa " + productCount
                    + " món ăn. Vui lòng chuyển hoặc xoá các món này trước khi xoá danh mục.");
        }

        menuCategoryRepository.delete(category);
        return ResponseEntity.ok(ApiResponse.success("Xóa danh mục thành công", null));
    }

    /**
     * Sắp xếp lại thứ tự hiển thị danh mục
     * PUT /api/v1/categories/reorder
     */
    @PutMapping("/api/v1/categories/reorder")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> reorderCategories(
            @Valid @RequestBody ReorderCategoryRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        Integer restaurantId = request.getRestaurantId();
        Shop shop = shopRepository.findByIdAndDeletedAtIsNull(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quán với ID: " + restaurantId));

        checkShopOwnership(shop, userId, userRole);

        List<Integer> categoryIds = request.getCategoryIds();
        for (int i = 0; i < categoryIds.size(); i++) {
            Integer catId = categoryIds.get(i);
            menuCategoryRepository.findByIdAndRestaurantId(catId, restaurantId).ifPresent(cat -> {
                cat.setDisplayOrder(categoryIds.indexOf(cat.getId()));
                menuCategoryRepository.save(cat);
            });
        }

        List<CategoryDto> updatedList = menuCategoryRepository.findByRestaurantIdOrderByDisplayOrderAscIdAsc(restaurantId)
                .stream()
                .map(this::mapCategoryToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Cập nhật thứ tự danh mục thành công", updatedList));
    }

    private void checkShopOwnership(Shop shop, Integer userId, String userRole) {
        if (userRole != null && userRole.contains("MERCHANT") && userId != null) {
            if (!shop.getOwnerId().equals(userId)) {
                throw new ForbiddenException("Bạn không có quyền thao tác trên quán của chủ sở hữu khác (Chủ quán: " + shop.getOwnerId() + ")");
            }
        }
    }

    private CategoryDto mapCategoryToDto(MenuCategory c) {
        long count = productRepository.countByCategoryIdAndDeletedAtIsNull(c.getId());
        return CategoryDto.builder()
                .id(c.getId())
                .restaurantId(c.getRestaurant() != null ? c.getRestaurant().getId() : null)
                .name(c.getName())
                .displayOrder(c.getDisplayOrder() != null ? c.getDisplayOrder() : 0)
                .productCount((int) count)
                .build();
    }
}
