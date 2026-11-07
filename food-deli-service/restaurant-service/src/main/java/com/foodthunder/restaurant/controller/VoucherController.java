package com.foodthunder.restaurant.controller;

import com.foodthunder.restaurant.dto.ApiResponse;
import com.foodthunder.restaurant.dto.CreateVoucherRequest;
import com.foodthunder.restaurant.dto.UpdateVoucherRequest;
import com.foodthunder.restaurant.dto.ValidateVoucherRequest;
import com.foodthunder.restaurant.dto.VoucherDto;
import com.foodthunder.restaurant.dto.VoucherValidationResponse;
import com.foodthunder.restaurant.service.VoucherService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vouchers")
public class VoucherController {

    private final VoucherService voucherService;

    public VoucherController(VoucherService voucherService) {
        this.voucherService = voucherService;
    }

    /**
     * Tạo mã giảm giá riêng của quán hoặc toàn sàn (CRUD Merchant/Admin)
     * POST /api/v1/vouchers
     */
    @PostMapping
    public ResponseEntity<ApiResponse<VoucherDto>> createVoucher(
            @Valid @RequestBody CreateVoucherRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        VoucherDto created = voucherService.createVoucher(request, userId, userRole);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo mã voucher thành công", created));
    }

    /**
     * Kiểm tra tính hợp lệ của mã voucher và tính tiền chiết khấu chính xác
     * POST /api/v1/vouchers/validate
     */
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<VoucherValidationResponse>> validateVoucher(
            @Valid @RequestBody ValidateVoucherRequest request
    ) {
        VoucherValidationResponse response = voucherService.validateVoucher(request);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    /**
     * Lấy danh sách voucher (có thể lọc theo quán)
     * GET /api/v1/vouchers?restaurantId=1
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<VoucherDto>>> getVouchers(
            @RequestParam(required = false) Integer restaurantId
    ) {
        List<VoucherDto> vouchers = voucherService.getVouchers(restaurantId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách voucher thành công", vouchers));
    }

    /**
     * Xem chi tiết voucher theo ID
     * GET /api/v1/vouchers/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VoucherDto>> getVoucherById(@PathVariable Integer id) {
        VoucherDto voucher = voucherService.getVoucherById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin voucher thành công", voucher));
    }

    /**
     * Chỉnh sửa voucher (CRUD Merchant/Admin)
     * PUT /api/v1/vouchers/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VoucherDto>> updateVoucher(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateVoucherRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        VoucherDto updated = voucherService.updateVoucher(id, request, userId, userRole);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật mã voucher thành công", updated));
    }

    /**
     * Xóa voucher (CRUD Merchant/Admin)
     * DELETE /api/v1/vouchers/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVoucher(
            @PathVariable Integer id,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        voucherService.deleteVoucher(id, userId, userRole);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa mã voucher thành công", null));
    }

    /**
     * Bật / Tắt trạng thái hoạt động của voucher
     * PATCH /api/v1/vouchers/{id}/toggle
     */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<VoucherDto>> toggleVoucher(
            @PathVariable Integer id,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        VoucherDto updated = voucherService.toggleVoucherStatus(id, userId, userRole);
        return ResponseEntity.ok(ApiResponse.success("Đã thay đổi trạng thái voucher", updated));
    }
}
