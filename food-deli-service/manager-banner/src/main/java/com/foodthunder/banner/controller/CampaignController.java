package com.foodthunder.banner.controller;

import com.foodthunder.banner.dto.ApiResponse;
import com.foodthunder.banner.dto.CampaignRequest;
import com.foodthunder.banner.dto.CampaignResponse;
import com.foodthunder.banner.security.AdminRoleGuard;
import com.foodthunder.banner.service.CampaignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/campaigns")
@RequiredArgsConstructor
public class CampaignController {
    private final CampaignService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CampaignResponse>>> findAll(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        AdminRoleGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách chiến dịch thành công", service.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CampaignResponse>> findById(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        AdminRoleGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success("Lấy chiến dịch thành công", service.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CampaignResponse>> create(
            @Valid @RequestBody CampaignRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        AdminRoleGuard.requireAdmin(role);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo chiến dịch thành công", service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CampaignResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CampaignRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        AdminRoleGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật chiến dịch thành công", service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        AdminRoleGuard.requireAdmin(role);
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa chiến dịch thành công", null));
    }
}
