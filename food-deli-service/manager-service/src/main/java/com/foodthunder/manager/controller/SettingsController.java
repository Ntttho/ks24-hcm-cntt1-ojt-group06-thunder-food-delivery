package com.foodthunder.manager.controller;

import com.foodthunder.manager.dto.ApiResponse;
import com.foodthunder.manager.dto.SettingRequest;
import com.foodthunder.manager.dto.SettingResponse;
import com.foodthunder.manager.security.AdminRoleGuard;
import com.foodthunder.manager.service.SystemSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/settings")
@RequiredArgsConstructor
public class SettingsController {
    private final SystemSettingsService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SettingResponse>>> findAll(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        AdminRoleGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cấu hình thành công", service.findAll()));
    }

    @GetMapping("/key/{key}")
    public ResponseEntity<ApiResponse<SettingResponse>> findByKey(
            @PathVariable String key,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        AdminRoleGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success("Lấy cấu hình thành công", service.findByKey(key)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SettingResponse>> findById(
            @PathVariable Integer id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        AdminRoleGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success("Lấy cấu hình thành công", service.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SettingResponse>> create(
            @Valid @RequestBody SettingRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        AdminRoleGuard.requireAdmin(role);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo cấu hình thành công", service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SettingResponse>> update(
            @PathVariable Integer id,
            @Valid @RequestBody SettingRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        AdminRoleGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cấu hình thành công", service.update(id, request)));
    }
}
