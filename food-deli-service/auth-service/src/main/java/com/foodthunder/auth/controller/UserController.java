package com.foodthunder.auth.controller;

import com.foodthunder.auth.dto.*;
import com.foodthunder.auth.exception.UnauthorizedException;
import com.foodthunder.auth.security.RoleGuard;
import com.foodthunder.auth.security.UserPrincipal;
import com.foodthunder.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;

    /**
     * Lấy danh sách người dùng có phân trang và tìm kiếm theo tên / số điện thoại / vai trò / trạng thái
     * GET /api/v1/users?search=Nguyen&role=CUSTOMER&status=ACTIVE&page=0&size=10
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<UserDto>>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<UserDto> response = authService.getUsers(search, role, status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách người dùng thành công", response));
    }

    /**
     * Lấy toàn bộ người dùng không phân trang
     * GET /api/v1/users/all
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        List<UserDto> users = authService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success("Lấy tất cả người dùng thành công", users));
    }

    /**
     * Thêm người dùng mới (Dành cho Admin Portal)
     * POST /api/v1/users
     */
    @PostMapping
    public ResponseEntity<ApiResponse<UserDto>> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserDto created = authService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo tài khoản người dùng thành công", created));
    }

    /**
     * Lấy chi tiết thông tin người dùng theo ID
     * GET /api/v1/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable Long id) {
        UserDto userDto = authService.getProfile(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin người dùng thành công", userDto));
    }

    @GetMapping("/stats/summary")
    public ResponseEntity<ApiResponse<UserStatsSummaryDto>> getUserStatsSummary() {
        return ResponseEntity.ok(ApiResponse.success("Lấy thống kê người dùng thành công", authService.getUserStatsSummary()));
    }

    /**
     * SP3-ADM-05: Lấy thống kê số lượng người dùng và đối tác kinh doanh (Merchants) cho Admin Analytics
     * GET /api/v1/users/admin/analytics-counts
     */
    @GetMapping("/admin/analytics-counts")
    public ResponseEntity<ApiResponse<UserAnalyticsCountsDto>> getAnalyticsCounts(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader
    ) {
        RoleGuard.requireAdmin(roleHeader, "Chỉ Admin mới được truy cập số liệu thống kê người dùng");
        UserAnalyticsCountsDto counts = authService.getAnalyticsCounts();
        return ResponseEntity.ok(ApiResponse.success("Lấy thống kê người dùng thành công", counts));
    }

    @PutMapping("/{id}/rating")
    public ResponseEntity<ApiResponse<UserDto>> updateRating(
            @PathVariable Long id,
            @RequestParam BigDecimal ratingAvg,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader
    ) {
        RoleGuard.requireAdmin(roleHeader, "Chỉ Admin mới được cập nhật điểm đánh giá");
        UserDto updatedUser = authService.updateRating(id, ratingAvg);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật điểm đánh giá tài xế thành công", updatedUser));
    }

    /**
     * Cập nhật thông tin và vai trò người dùng (Dành cho Admin Portal)
     * PUT /api/v1/users/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        UserDto updated = authService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin người dùng thành công", updated));
    }

    /**
     * Khóa / Mở khóa tài khoản người dùng (Dành cho Admin Portal)
     * PUT /api/v1/users/{id}/status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<UserDto>> updateUserStatus(
            @PathVariable Long id,
            @RequestBody(required = false) UpdateUserStatusRequest request
    ) {
        UpdateUserStatusRequest req = request != null ? request : new UpdateUserStatusRequest(null, null);
        UserDto updated = authService.updateUserStatus(id, req);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái tài khoản thành công", updated));
    }

    /**
     * Xóa tài khoản người dùng (Soft Delete / Vô hiệu hóa)
     * DELETE /api/v1/users/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        authService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa tài khoản người dùng thành công", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getMe(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId
    ) {
        Long userId = resolveUserId(principal, headerUserId);
        UserDto userDto = authService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(userDto));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> updateMe(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        Long userId = resolveUserId(principal, headerUserId);
        UserDto userDto = authService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", userDto));
    }

    private Long resolveUserId(UserPrincipal principal, Long headerUserId) {
        if (principal != null && principal.getId() != null) {
            return principal.getId();
        }
        if (headerUserId != null) {
            return headerUserId;
        }
        throw new UnauthorizedException("User is not authenticated");
    }
}
