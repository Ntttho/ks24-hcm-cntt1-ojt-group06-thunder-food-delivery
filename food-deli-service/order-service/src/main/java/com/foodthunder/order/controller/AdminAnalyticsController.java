package com.foodthunder.order.controller;

import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.analytics.AdminAnalyticsSummaryResponse;
import com.foodthunder.order.exception.ForbiddenException;
import com.foodthunder.order.exception.UnauthorizedException;
import com.foodthunder.order.service.analytics.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/analytics")
@RequiredArgsConstructor
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AdminAnalyticsSummaryResponse>> getAnalyticsSummary(
            @RequestParam(required = false) Integer year,
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    ) {
        requireAdminRole(userRoleHeader);
        AdminAnalyticsSummaryResponse response = adminAnalyticsService.getAnalyticsSummary(year);
        return ResponseEntity.ok(ApiResponse.success("Lấy thống kê phân tích nền tảng thành công", response));
    }

    private void requireAdminRole(String roleHeader) {
        if (roleHeader == null || roleHeader.isBlank()) {
            throw new UnauthorizedException("Thiếu thông tin xác thực vai trò người dùng");
        }
        Set<String> roles = Arrays.stream(roleHeader.split("[,\\s]+"))
                .map(String::trim)
                .map(String::toUpperCase)
                .collect(Collectors.toSet());
        if (!roles.contains("ROLE_ADMIN") && !roles.contains("ADMIN")) {
            throw new ForbiddenException("Chỉ Admin mới có quyền xem phân tích hệ thống");
        }
    }
}

