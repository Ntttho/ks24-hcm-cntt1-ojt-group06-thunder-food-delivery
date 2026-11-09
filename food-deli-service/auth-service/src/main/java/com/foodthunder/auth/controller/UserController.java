package com.foodthunder.auth.controller;

import com.foodthunder.auth.dto.ApiResponse;
import com.foodthunder.auth.dto.PageResponse;
import com.foodthunder.auth.dto.UpdateProfileRequest;
import com.foodthunder.auth.dto.UserDto;
import com.foodthunder.auth.exception.UnauthorizedException;
import com.foodthunder.auth.security.UserPrincipal;
import com.foodthunder.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;

    /**
     * Lấy danh sách người dùng có phân trang và tìm kiếm theo tên / số điện thoại / vai trò
     * GET /api/v1/users?search=Nguyen&role=CUSTOMER&page=0&size=10
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<UserDto>>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<UserDto> response = authService.getUsers(search, role, page, size);
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
     * Lấy chi tiết thông tin người dùng theo ID
     * GET /api/v1/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable Long id) {
        UserDto userDto = authService.getProfile(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin người dùng thành công", userDto));
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
