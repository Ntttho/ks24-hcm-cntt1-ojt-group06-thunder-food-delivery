package com.foodthunder.order.controller;

import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.settings.ShippingSettingsResponse;
import com.foodthunder.order.service.SystemSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system-settings/shipping")
@RequiredArgsConstructor
public class ShippingSettingsController {
    private final SystemSettingsService systemSettingsService;

    @GetMapping
    public ResponseEntity<ApiResponse<ShippingSettingsResponse>> getShippingSettings() {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy cấu hình phí giao hàng thành công",
                systemSettingsService.getShippingSettings()
        ));
    }
}
