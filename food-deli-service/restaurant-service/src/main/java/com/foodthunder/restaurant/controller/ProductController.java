package com.foodthunder.restaurant.controller;

import com.foodthunder.restaurant.dto.*;
import com.foodthunder.restaurant.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/products", "/api/v1/foods"})
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * API 1.4: Lấy chi tiết món ăn kèm các nhóm Topping (bắt buộc / tùy chọn)
     * GET /api/v1/products/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDetailDto>> getProductDetail(@PathVariable Integer id) {
        ProductDetailDto detail = productService.getProductDetail(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin món ăn thành công", detail));
    }

    /**
     * Thêm mới món ăn vào thực đơn (CRUD Merchant)
     * POST /api/v1/products
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ProductDto>> createProduct(@Valid @RequestBody ProductRequestDto request) {
        ProductDto created = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Thêm món ăn mới thành công", created));
    }

    /**
     * Cập nhật thông tin món ăn (CRUD Merchant)
     * PUT /api/v1/products/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDto>> updateProduct(
            @PathVariable Integer id,
            @Valid @RequestBody ProductRequestDto request
    ) {
        ProductDto updated = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật món ăn thành công", updated));
    }

    /**
     * Xóa món ăn khỏi thực đơn (Soft-delete)
     * DELETE /api/v1/products/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Integer id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa món ăn thành công", null));
    }

    /**
     * Bật/Tắt trạng thái còn hàng của món ăn
     * PATCH /api/v1/products/{id}/status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ProductDto>> updateProductStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> payload
    ) {
        Boolean isAvailable = payload.containsKey("isAvailable")
                ? (Boolean) payload.get("isAvailable")
                : true;
        ProductDto updated = productService.updateProductStatus(id, isAvailable);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái món ăn thành công", updated));
    }

    /**
     * Gán danh sách topping áp dụng cho món ăn vào bảng food_toppings (CRUD Merchant)
     * POST /api/v1/products/{id}/toppings
     */
    @PostMapping("/{id}/toppings")
    public ResponseEntity<ApiResponse<List<ToppingDto>>> assignToppings(
            @PathVariable Integer id,
            @Valid @RequestBody AssignToppingsRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        List<ToppingDto> result = productService.assignToppingsToProduct(id, request.getToppingIds(), userId, userRole);
        return ResponseEntity.ok(ApiResponse.success("Gán danh sách topping cho món ăn thành công", result));
    }

    /**
     * Lấy chi tiết các topping kèm theo món ăn để render modal chọn món
     * GET /api/v1/products/{id}/toppings
     */
    @GetMapping("/{id}/toppings")
    public ResponseEntity<ApiResponse<List<ToppingDto>>> getProductToppings(@PathVariable Integer id) {
        List<ToppingDto> toppings = productService.getProductToppings(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách topping của món ăn thành công", toppings));
    }
}
