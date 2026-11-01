package com.foodthunder.auth.controller;

import com.foodthunder.auth.dto.AddressRequest;
import com.foodthunder.auth.dto.AddressResponse;
import com.foodthunder.auth.dto.ApiResponse;
import com.foodthunder.auth.exception.UnauthorizedException;
import com.foodthunder.auth.security.UserPrincipal;
import com.foodthunder.auth.service.UserAddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
public class UserAddressController {

    private final UserAddressService addressService;

    @GetMapping({"/api/v1/users/addresses", "/api/v1/addresses/mine"})
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getMyAddresses(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId
    ) {
        Long userId = resolveUserId(principal, headerUserId);
        List<AddressResponse> addresses = addressService.getUserAddresses(userId);
        return ResponseEntity.ok(ApiResponse.success(addresses));
    }

    @PostMapping({"/api/v1/users/addresses", "/api/v1/addresses/mine"})
    public ResponseEntity<ApiResponse<AddressResponse>> createAddress(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @Valid @RequestBody AddressRequest request
    ) {
        Long userId = resolveUserId(principal, headerUserId);
        AddressResponse address = addressService.createAddress(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created("Address created successfully", address));
    }

    @PutMapping({"/api/v1/users/addresses/{id}", "/api/v1/addresses/mine/{id}"})
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @Valid @RequestBody AddressRequest request
    ) {
        Long userId = resolveUserId(principal, headerUserId);
        AddressResponse address = addressService.updateAddress(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Address updated successfully", address));
    }

    @PatchMapping({"/api/v1/users/addresses/{id}/default", "/api/v1/addresses/mine/{id}/default"})
    public ResponseEntity<ApiResponse<AddressResponse>> setDefaultAddress(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId
    ) {
        Long userId = resolveUserId(principal, headerUserId);
        AddressResponse address = addressService.setDefaultAddress(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Default address updated successfully", address));
    }

    @DeleteMapping({"/api/v1/users/addresses/{id}", "/api/v1/addresses/mine/{id}"})
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId
    ) {
        Long userId = resolveUserId(principal, headerUserId);
        addressService.deleteAddress(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Address deleted successfully", null));
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
