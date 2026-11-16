package com.foodthunder.restaurant.controller;

import com.foodthunder.restaurant.dto.ApiResponse;
import com.foodthunder.restaurant.dto.CreateVoucherCategoryRequest;
import com.foodthunder.restaurant.dto.UpdateVoucherCategoryRequest;
import com.foodthunder.restaurant.dto.VoucherCategoryDto;
import com.foodthunder.restaurant.service.VoucherCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/voucher-categories")
@RequiredArgsConstructor
public class VoucherCategoryController {

    private final VoucherCategoryService voucherCategoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<VoucherCategoryDto>>> getCategories(
            @RequestParam(required = false) Boolean activeOnly
    ) {
        List<VoucherCategoryDto> list = voucherCategoryService.getCategories(activeOnly);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách danh mục voucher thành công", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VoucherCategoryDto>> getCategoryById(@PathVariable Integer id) {
        VoucherCategoryDto category = voucherCategoryService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết danh mục voucher thành công", category));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VoucherCategoryDto>> createCategory(
            @Valid @RequestBody CreateVoucherCategoryRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        VoucherCategoryDto created = voucherCategoryService.createCategory(request, userRole);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo danh mục voucher thành công", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VoucherCategoryDto>> updateCategory(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateVoucherCategoryRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        VoucherCategoryDto updated = voucherCategoryService.updateCategory(id, request, userRole);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật danh mục voucher thành công", updated));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<VoucherCategoryDto>> toggleCategoryStatus(
            @PathVariable Integer id,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        VoucherCategoryDto updated = voucherCategoryService.toggleCategoryStatus(id, userRole);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái danh mục voucher", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @PathVariable Integer id,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        voucherCategoryService.deleteCategory(id, userRole);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa danh mục voucher thành công", null));
    }
}

