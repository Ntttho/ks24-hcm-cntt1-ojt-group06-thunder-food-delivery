package com.foodthunder.order.controller;

import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.revenue.*;
import com.foodthunder.order.service.revenue.MerchantRevenueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/orders/revenue")
@RequiredArgsConstructor
public class MerchantRevenueController {

    private final MerchantRevenueService revenueService;

    /**
     * GET /api/v1/orders/revenue/summary
     * Lấy chỉ số KPI tổng hợp: Tổng doanh thu, số đơn hoàn thành, AOV, tỷ lệ hoàn tất.
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<MerchantRevenueSummaryResponse>> getRevenueSummary(
            @RequestParam(required = false) Integer restaurantId,
            @RequestParam(required = false) List<Integer> restaurantIds,
            @RequestParam(defaultValue = "MONTH") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    ) {
        Integer userId = parseUserId(userIdHeader);
        log.info("Merchant revenue summary requested: restaurantId={}, period={}, userId={}",
                restaurantId, period, userId);

        MerchantRevenueSummaryResponse response = revenueService.getRevenueSummary(
                restaurantId, restaurantIds, period, startDate, endDate, userId, userRoleHeader
        );
        return ResponseEntity.ok(ApiResponse.success("Lấy báo cáo doanh thu thành công", response));
    }

    /**
     * GET /api/v1/orders/revenue/chart
     * Lấy dữ liệu biểu đồ doanh thu theo thời gian (DAY, WEEK, MONTH, YEAR, CUSTOM).
     */
    @GetMapping("/chart")
    public ResponseEntity<ApiResponse<RevenueChartResponse>> getRevenueChart(
            @RequestParam(required = false) Integer restaurantId,
            @RequestParam(required = false) List<Integer> restaurantIds,
            @RequestParam(defaultValue = "WEEK") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    ) {
        Integer userId = parseUserId(userIdHeader);
        log.info("Merchant revenue chart requested: restaurantId={}, period={}, userId={}",
                restaurantId, period, userId);

        RevenueChartResponse response = revenueService.getRevenueChart(
                restaurantId, restaurantIds, period, startDate, endDate, userId, userRoleHeader
        );
        return ResponseEntity.ok(ApiResponse.success("Lấy biểu đồ doanh thu thành công", response));
    }

    /**
     * GET /api/v1/orders/revenue/top-foods
     * Lấy danh sách món ăn bán chạy nhất mang lại doanh thu cao nhất cho quán.
     */
    @GetMapping("/top-foods")
    public ResponseEntity<ApiResponse<List<TopSellingFoodDto>>> getTopSellingFoods(
            @RequestParam(required = false) Integer restaurantId,
            @RequestParam(required = false) List<Integer> restaurantIds,
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    ) {
        Integer userId = parseUserId(userIdHeader);
        List<TopSellingFoodDto> response = revenueService.getTopSellingFoods(
                restaurantId, restaurantIds, limit, startDate, endDate, userId, userRoleHeader
        );
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách món bán chạy thành công", response));
    }

    /**
     * GET /api/v1/orders/revenue/branches
     * So sánh tỷ trọng doanh thu giữa các chi nhánh đa quán của merchant.
     */
    @GetMapping("/branches")
    public ResponseEntity<ApiResponse<List<MultiBranchRevenueDto>>> getMultiBranchComparison(
            @RequestParam List<Integer> restaurantIds,
            @RequestParam(defaultValue = "MONTH") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String userRoleHeader
    ) {
        Integer userId = parseUserId(userIdHeader);
        List<MultiBranchRevenueDto> response = revenueService.getMultiBranchComparison(
                restaurantIds, period, startDate, endDate, userId, userRoleHeader
        );
        return ResponseEntity.ok(ApiResponse.success("Lấy so sánh doanh thu đa quán thành công", response));
    }

    private Integer parseUserId(String userIdHeader) {
        if (userIdHeader != null && !userIdHeader.isBlank()) {
            try {
                return Integer.parseInt(userIdHeader.trim());
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }
}

