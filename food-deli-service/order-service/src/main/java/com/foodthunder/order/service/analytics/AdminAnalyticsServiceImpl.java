package com.foodthunder.order.service.analytics;

import com.foodthunder.order.client.AuthClient;
import com.foodthunder.order.client.RestaurantClient;
import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.analytics.AdminAnalyticsSummaryResponse;
import com.foodthunder.order.dto.analytics.MonthlyRevenuePointDto;
import com.foodthunder.order.dto.client.RemoteRestaurantAnalyticsCountsDto;
import com.foodthunder.order.dto.client.RemoteUserAnalyticsCountsDto;
import com.foodthunder.order.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAnalyticsServiceImpl implements AdminAnalyticsService {

    private static final int MIN_SUPPORTED_YEAR = 2020;
    private static final int MAX_SUPPORTED_YEAR = 2100;

    private final OrderAnalyticsQueryHelper orderAnalyticsQueryHelper;
    private final AuthClient authClient;
    private final RestaurantClient restaurantClient;

    @Override
    public AdminAnalyticsSummaryResponse getPlatformAnalyticsSummary(Integer year) {
        int targetYear = (year != null) ? year : Year.now().getValue();
        if (targetYear < MIN_SUPPORTED_YEAR || targetYear > MAX_SUPPORTED_YEAR) {
            throw new BadRequestException("Năm thống kê phải nằm trong khoảng " + MIN_SUPPORTED_YEAR + " - " + MAX_SUPPORTED_YEAR);
        }

        LocalDateTime startOfYear = LocalDateTime.of(targetYear, 1, 1, 0, 0, 0);
        LocalDateTime startOfNextYear = LocalDateTime.of(targetYear + 1, 1, 1, 0, 0, 0);
        OrderAnalyticsQueryHelper.LocalOrderMetrics localMetrics =
                orderAnalyticsQueryHelper.loadLocalMetrics(startOfYear, startOfNextYear);

        BigDecimal totalRevenue = defaultZero(localMetrics.totalRevenue());
        long totalOrdersCount = localMetrics.totalOrdersCount();
        long completedOrdersCount = localMetrics.completedOrdersCount();
        double orderSuccessRate = totalOrdersCount > 0
                ? Math.round((completedOrdersCount * 100.0 / totalOrdersCount) * 100.0) / 100.0
                : 0.0;

        List<Object[]> monthlyRows = localMetrics.monthlyRows();

        Map<Integer, BigDecimal> revenueByMonth = new HashMap<>();
        Map<Integer, Long> completedCountByMonth = new HashMap<>();
        if (monthlyRows != null) {
            for (Object[] row : monthlyRows) {
                if (row == null || row.length < 3 || row[0] == null) {
                    continue;
                }
                int monthNum = ((Number) row[0]).intValue();
                BigDecimal monthRevenue = toBigDecimal(row[1]);
                long monthCount = ((Number) row[2]).longValue();
                revenueByMonth.put(monthNum, monthRevenue);
                completedCountByMonth.put(monthNum, monthCount);
            }
        }

        List<MonthlyRevenuePointDto> monthlyRevenue = new ArrayList<>(12);
        BigDecimal yearlyRevenue = BigDecimal.ZERO;
        for (int month = 1; month <= 12; month++) {
            BigDecimal monthRev = revenueByMonth.getOrDefault(month, BigDecimal.ZERO);
            long monthCompleted = completedCountByMonth.getOrDefault(month, 0L);
            yearlyRevenue = yearlyRevenue.add(monthRev);

            monthlyRevenue.add(MonthlyRevenuePointDto.builder()
                    .month(String.format("%02d/%d", month, targetYear))
                    .label("T" + month)
                    .revenue(monthRev)
                    .completedOrdersCount(monthCompleted)
                    .build());
        }

        List<String> warnings = new ArrayList<>();
        RemoteUserAnalyticsCountsDto userCounts = fetchUserCounts(warnings);
        RemoteRestaurantAnalyticsCountsDto restaurantCounts = fetchRestaurantCounts(warnings);

        return AdminAnalyticsSummaryResponse.builder()
                .year(targetYear)
                .totalRevenue(totalRevenue)
                .yearlyRevenue(yearlyRevenue)
                .monthlyRevenue(monthlyRevenue)
                .totalUsersCount(userCounts.getTotalUsersCount())
                .totalRestaurantsCount(restaurantCounts.getTotalRestaurantsCount())
                .totalMerchantsCount(userCounts.getTotalMerchantsCount())
                .completedOrdersCount(completedOrdersCount)
                .totalOrdersCount(totalOrdersCount)
                .orderSuccessRate(orderSuccessRate)
                .totalFoodItemsCount(restaurantCounts.getTotalFoodItemsCount())
                .partialData(!warnings.isEmpty())
                .warnings(warnings)
                .build();
    }

    private RemoteUserAnalyticsCountsDto fetchUserCounts(List<String> warnings) {
        try {
            ResponseEntity<ApiResponse<RemoteUserAnalyticsCountsDto>> response = authClient.getUserAnalyticsCounts();
            RemoteUserAnalyticsCountsDto data = (response != null && response.getBody() != null)
                    ? response.getBody().getData()
                    : null;
            if (data == null || data.isFallback()) {
                warnings.add("Không thể đồng bộ đầy đủ số liệu người dùng & đối tác từ auth-service");
                return RemoteUserAnalyticsCountsDto.builder()
                        .totalUsersCount(0L)
                        .totalMerchantsCount(0L)
                        .fallback(true)
                        .build();
            }
            return data;
        } catch (Exception ex) {
            log.warn("Error fetching analytics counts from auth-service: {}", ex.getMessage());
            warnings.add("Không thể kết nối auth-service để lấy số liệu người dùng & đối tác");
            return RemoteUserAnalyticsCountsDto.builder()
                    .totalUsersCount(0L)
                    .totalMerchantsCount(0L)
                    .fallback(true)
                    .build();
        }
    }

    private RemoteRestaurantAnalyticsCountsDto fetchRestaurantCounts(List<String> warnings) {
        try {
            ResponseEntity<ApiResponse<RemoteRestaurantAnalyticsCountsDto>> response = restaurantClient.getRestaurantAnalyticsCounts();
            RemoteRestaurantAnalyticsCountsDto data = (response != null && response.getBody() != null)
                    ? response.getBody().getData()
                    : null;
            if (data == null || data.isFallback()) {
                warnings.add("Không thể đồng bộ đầy đủ số liệu nhà hàng & món ăn từ restaurant-service");
                return RemoteRestaurantAnalyticsCountsDto.builder()
                        .totalRestaurantsCount(0L)
                        .totalFoodItemsCount(0L)
                        .fallback(true)
                        .build();
            }
            return data;
        } catch (Exception ex) {
            log.warn("Error fetching analytics counts from restaurant-service: {}", ex.getMessage());
            warnings.add("Không thể kết nối restaurant-service để lấy số liệu nhà hàng & món ăn");
            return RemoteRestaurantAnalyticsCountsDto.builder()
                    .totalRestaurantsCount(0L)
                    .totalFoodItemsCount(0L)
                    .fallback(true)
                    .build();
        }
    }

    private BigDecimal defaultZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val == null) {
            return BigDecimal.ZERO;
        }
        if (val instanceof BigDecimal bd) {
            return bd;
        }
        if (val instanceof Number num) {
            return BigDecimal.valueOf(num.doubleValue());
        }
        return new BigDecimal(val.toString());
    }
}

