package com.foodthunder.order.controller;

import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.analytics.AdminAnalyticsSummaryResponse;
import com.foodthunder.order.exception.ForbiddenException;
import com.foodthunder.order.exception.UnauthorizedException;
import com.foodthunder.order.service.analytics.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/analytics")
@RequiredArgsConstructor
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    /**
     * SP3-ADM-05: Tổng hợp doanh thu toàn sàn (12 tháng) và 5 thẻ chỉ số hệ thống realtime.
     * GET /api/v1/admin/analytics/summary?year=2026
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AdminAnalyticsSummaryResponse>> getPlatformAnalyticsSummary(
            @RequestParam(required = false) Integer year,
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    ) {
        requireAdminRole(userRoleHeader);
        log.info("Admin analytics summary requested for year={}", year);
        AdminAnalyticsSummaryResponse response = adminAnalyticsService.getPlatformAnalyticsSummary(year);
        return ResponseEntity.ok(ApiResponse.success("Lấy số liệu thống kê hệ thống thành công", response));
    }

    private void requireAdminRole(String userRoleHeader) {
        if (userRoleHeader == null || userRoleHeader.isBlank()) {
            throw new UnauthorizedException("Thiếu thông tin phân quyền vai trò người dùng");
        }
        boolean isAdmin = Arrays.stream(userRoleHeader.split("[,\\s]+"))
                .anyMatch(role -> "ROLE_ADMIN".equalsIgnoreCase(role.trim()) || "ADMIN".equalsIgnoreCase(role.trim()));
        if (!isAdmin) {
            throw new ForbiddenException("Chỉ quản trị viên mới được truy cập bảng thống kê toàn sàn");
        }
    }
}

