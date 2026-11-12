package com.foodthunder.auth.controller;

import com.foodthunder.auth.dto.ApiResponse;
import com.foodthunder.auth.dto.OrderCostConfigDto;
import com.foodthunder.auth.dto.SystemSettingsResponse;
import com.foodthunder.auth.dto.UpdateSystemSettingsRequest;
import com.foodthunder.auth.security.RoleGuard;
import com.foodthunder.auth.service.SystemSettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SystemSettingController {

    private final SystemSettingService systemSettingService;

    /**
     * GET /api/v1/admin/settings
     * Lấy cấu hình tham số toàn sàn & chi phí Order cho Admin Portal.
     */
    @GetMapping("/admin/settings")
    public ResponseEntity<ApiResponse<SystemSettingsResponse>> getAdminSettings(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader
    ) {
        RoleGuard.requireAdmin(roleHeader, "Chỉ quản trị viên mới được xem cấu hình hệ thống");
        return ResponseEntity.ok(ApiResponse.success("Lấy cấu hình hệ thống thành công", systemSettingService.getSystemSettings()));
    }

    /**
     * PUT /api/v1/admin/settings
     * Cập nhật biểu phí vận chuyển, chi phí Order, VAT và hoa hồng sàn.
     */
    @PutMapping("/admin/settings")
    public ResponseEntity<ApiResponse<SystemSettingsResponse>> updateAdminSettings(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @Valid @RequestBody UpdateSystemSettingsRequest request
    ) {
        RoleGuard.requireAdmin(roleHeader, "Chỉ quản trị viên mới được chỉnh sửa cấu hình hệ thống");
        SystemSettingsResponse updated = systemSettingService.updateSystemSettings(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cấu hình hệ thống thành công", updated));
    }

    /**
     * GET /api/v1/settings/order-fees (kèm alias /api/v1/settings/shipping)
     * Endpoint công khai cho Checkout Frontend và Order-Service lấy biểu phí Order hiện hành.
     */
    @GetMapping({"/settings/order-fees", "/settings/shipping"})
    public ResponseEntity<ApiResponse<OrderCostConfigDto>> getPublicOrderFeeConfig() {
        return ResponseEntity.ok(ApiResponse.success("Lấy cấu hình chi phí đơn hàng thành công", systemSettingService.getOrderCostConfig()));
    }
}

