package com.foodthunder.manager.controller;

import com.foodthunder.manager.dto.ApiResponse;
import com.foodthunder.manager.dto.BannerPageResponse;
import com.foodthunder.manager.dto.BannerRequest;
import com.foodthunder.manager.dto.BannerResponse;
import com.foodthunder.manager.dto.BannerStatusRequest;
import com.foodthunder.manager.security.AdminRoleGuard;
import com.foodthunder.manager.service.BannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BannerController {
    private final BannerService service;

    @GetMapping({"/banners", "/banners/active"})
    public ResponseEntity<ApiResponse<List<BannerResponse>>> findActive() {
        return ResponseEntity.ok(ApiResponse.success("Lấy banner đang hiển thị thành công",
                service.findCurrentlyVisible()));
    }

    @GetMapping("/banners/{id}")
    public ResponseEntity<ApiResponse<BannerResponse>> findPublicById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy banner thành công", service.findPublicById(id)));
    }

    @GetMapping("/admin/banners")
    public ResponseEntity<ApiResponse<BannerPageResponse>> search(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(required = false) Long campaignId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        AdminRoleGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách banner thành công",
                service.search(search, status, campaignId, page, size)));
    }

    @GetMapping("/admin/banners/{id}")
    public ResponseEntity<ApiResponse<BannerResponse>> findById(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        AdminRoleGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success("Lấy banner thành công", service.findById(id)));
    }

    @PostMapping("/admin/banners")
    public ResponseEntity<ApiResponse<BannerResponse>> create(
            @Valid @RequestBody BannerRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        AdminRoleGuard.requireAdmin(role);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo banner thành công", service.create(request)));
    }

    @PutMapping("/admin/banners/{id}")
    public ResponseEntity<ApiResponse<BannerResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody BannerRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        AdminRoleGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật banner thành công", service.update(id, request)));
    }

    @PatchMapping("/admin/banners/{id}/status")
    public ResponseEntity<ApiResponse<BannerResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody BannerStatusRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        AdminRoleGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái banner thành công",
                service.updateStatus(id, request.isActive())));
    }

    @DeleteMapping("/admin/banners/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        AdminRoleGuard.requireAdmin(role);
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa banner thành công", null));
    }
}
