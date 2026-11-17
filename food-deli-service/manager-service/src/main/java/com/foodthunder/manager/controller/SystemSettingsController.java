package com.foodthunder.manager.controller;

import com.foodthunder.manager.dto.ApiResponse;
import com.foodthunder.manager.dto.SystemSettingsResponse;
import com.foodthunder.manager.dto.UpdateSystemSettingsRequest;
import com.foodthunder.manager.security.AdminRoleGuard;
import com.foodthunder.manager.service.SystemSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/admin/system-settings", "/api/v1/admin/settings/system"})
@RequiredArgsConstructor
public class SystemSettingsController {
    private final SystemSettingsService service;

    @GetMapping
    public ResponseEntity<ApiResponse<SystemSettingsResponse>> get(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        AdminRoleGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success("Lấy cấu hình hệ thống thành công", service.getAdminSettings()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<SystemSettingsResponse>> update(
            @Valid @RequestBody UpdateSystemSettingsRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        AdminRoleGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cấu hình hệ thống thành công",
                service.updateAdminSettings(request)));
    }
}
