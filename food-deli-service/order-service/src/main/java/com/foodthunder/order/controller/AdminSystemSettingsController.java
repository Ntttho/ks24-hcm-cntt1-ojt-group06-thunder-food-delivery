package com.foodthunder.order.controller;

import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.settings.SystemSettingsResponse;
import com.foodthunder.order.dto.settings.UpdateSystemSettingsRequest;
import com.foodthunder.order.exception.ForbiddenException;
import com.foodthunder.order.exception.UnauthorizedException;
import com.foodthunder.order.service.SystemSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/v1/admin/system-settings")
@RequiredArgsConstructor
public class AdminSystemSettingsController {
    private final SystemSettingsService systemSettingsService;

    @GetMapping
    public ResponseEntity<ApiResponse<SystemSettingsResponse>> getSettings(
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    ) {
        requireAdminRole(userRoleHeader);
        return ResponseEntity.ok(ApiResponse.success("Lấy cấu hình hệ thống thành công", systemSettingsService.getSettings()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<SystemSettingsResponse>> updateSettings(
            @Valid @RequestBody UpdateSystemSettingsRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    ) {
        requireAdminRole(userRoleHeader);
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật cấu hình hệ thống thành công",
                systemSettingsService.updateSettings(request)
        ));
    }

    private void requireAdminRole(String userRoleHeader) {
        if (userRoleHeader == null || userRoleHeader.isBlank()) {
            throw new UnauthorizedException("Thiếu thông tin phân quyền vai trò người dùng");
        }
        boolean isAdmin = Arrays.stream(userRoleHeader.split("[,\\s]+"))
                .anyMatch(role -> "ROLE_ADMIN".equalsIgnoreCase(role.trim()) || "ADMIN".equalsIgnoreCase(role.trim()));
        if (!isAdmin) {
            throw new ForbiddenException("Chỉ quản trị viên mới được quản lý cấu hình hệ thống");
        }
    }
}
