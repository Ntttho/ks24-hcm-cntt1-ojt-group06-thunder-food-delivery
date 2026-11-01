package com.foodthunder.auth.controller;

import com.foodthunder.auth.dto.ApiResponse;
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

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;

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
