package com.foodthunder.auth.controller;

import com.foodthunder.auth.dto.*;
import com.foodthunder.auth.security.UserPrincipal;
import com.foodthunder.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Logged in", response));
    }

    @PostMapping("/login/customer")
    public ResponseEntity<ApiResponse<AuthResponse>> loginCustomer(@Valid @RequestBody LoginRequest request) {
        LoginRequest reqWithRole = new LoginRequest(request.phone(), request.password(), "CUSTOMER");
        AuthResponse response = authService.login(reqWithRole);
        return ResponseEntity.ok(ApiResponse.success("Customer logged in", response));
    }

    @PostMapping("/login/merchant")
    public ResponseEntity<ApiResponse<AuthResponse>> loginMerchant(@Valid @RequestBody LoginRequest request) {
        LoginRequest reqWithRole = new LoginRequest(request.phone(), request.password(), "MERCHANT");
        AuthResponse response = authService.login(reqWithRole);
        return ResponseEntity.ok(ApiResponse.success("Merchant logged in", response));
    }

    @PostMapping({"/login/driver", "/login/shipper"})
    public ResponseEntity<ApiResponse<AuthResponse>> loginDriver(@Valid @RequestBody LoginRequest request) {
        LoginRequest reqWithRole = new LoginRequest(request.phone(), request.password(), "DRIVER");
        AuthResponse response = authService.login(reqWithRole);
        return ResponseEntity.ok(ApiResponse.success("Driver/Shipper logged in", response));
    }

    @PostMapping("/login/admin")
    public ResponseEntity<ApiResponse<AuthResponse>> loginAdmin(@Valid @RequestBody LoginRequest request) {
        LoginRequest reqWithRole = new LoginRequest(request.phone(), request.password(), "ADMIN");
        AuthResponse response = authService.login(reqWithRole);
        return ResponseEntity.ok(ApiResponse.success("Admin logged in", response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created("Registered", response));
    }

    @PostMapping("/register/customer")
    public ResponseEntity<ApiResponse<AuthResponse>> registerCustomer(@Valid @RequestBody RegisterRequest request) {
        RegisterRequest reqWithRole = new RegisterRequest(request.phone(), request.password(), request.fullName(), "CUSTOMER");
        AuthResponse response = authService.register(reqWithRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created("Customer registered", response));
    }

    @PostMapping("/register/merchant")
    public ResponseEntity<ApiResponse<AuthResponse>> registerMerchant(@Valid @RequestBody RegisterRequest request) {
        RegisterRequest reqWithRole = new RegisterRequest(request.phone(), request.password(), request.fullName(), "MERCHANT");
        AuthResponse response = authService.register(reqWithRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created("Merchant registered", response));
    }

    @PostMapping({"/register/driver", "/register/shipper"})
    public ResponseEntity<ApiResponse<AuthResponse>> registerDriver(@Valid @RequestBody RegisterRequest request) {
        RegisterRequest reqWithRole = new RegisterRequest(request.phone(), request.password(), request.fullName(), "DRIVER");
        AuthResponse response = authService.register(reqWithRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created("Driver registered", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId
    ) {
        Long userId = resolveUserId(principal, headerUserId);
        UserDto userDto = authService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(userDto));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
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
        throw new com.foodthunder.auth.exception.UnauthorizedException("User is not authenticated");
    }
}
