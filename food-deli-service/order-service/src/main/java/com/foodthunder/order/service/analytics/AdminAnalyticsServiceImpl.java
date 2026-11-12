package com.foodthunder.order.service.analytics;

import com.foodthunder.order.client.AuthClient;
import com.foodthunder.order.client.RestaurantClient;
import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.analytics.AdminAnalyticsSummaryResponse;
import com.foodthunder.order.dto.analytics.MonthlyRevenuePointDto;
import com.foodthunder.order.dto.analytics.TopRestaurantRevenueDto;
import com.foodthunder.order.dto.client.RemoteRestaurantDto;
import com.foodthunder.order.dto.client.RemoteRestaurantStatsDto;
import com.foodthunder.order.dto.client.RemoteUserStatsDto;
import com.foodthunder.order.entity.Order;
import com.foodthunder.order.entity.OrderStatus;
import com.foodthunder.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAnalyticsServiceImpl implements AdminAnalyticsService {

    private final OrderRepository orderRepository;
    private final AuthClient authClient;
    private final RestaurantClient restaurantClient;

    @Override
    @Transactional(readOnly = true)
    public AdminAnalyticsSummaryResponse getAnalyticsSummary(Integer yearParam) {
        int year = (yearParam != null && yearParam >= 2000 && yearParam <= 2100)
                ? yearParam : LocalDate.now().getYear();

        LocalDateTime start = LocalDate.of(year, 1, 1).atStartOfDay();
        LocalDateTime end = LocalDate.of(year, 12, 31).atTime(LocalTime.MAX);

        List<Order> orders = orderRepository.findByCreatedAtBetween(start, end);

        BigDecimal[] monthRevenues = new BigDecimal[12];
        long[] monthCounts = new long[12];
        Arrays.fill(monthRevenues, BigDecimal.ZERO);

        long totalOrders = orders.size();
        long completedOrders = 0L;
        long cancelledOrders = 0L;
        BigDecimal totalGmv = BigDecimal.ZERO;

        Map<Integer, BigDecimal> revenueByRestaurant = new HashMap<>();
        Map<Integer, Long> countByRestaurant = new HashMap<>();

        for (Order order : orders) {
            String statusCode = order.getStatus() != null ? order.getStatus().getCode() : null;
            if (OrderStatus.COMPLETED.equalsIgnoreCase(statusCode)) {
                completedOrders++;
                BigDecimal amount = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
                totalGmv = totalGmv.add(amount);

                if (order.getCreatedAt() != null) {
                    int monthIdx = order.getCreatedAt().getMonthValue() - 1;
                    if (monthIdx >= 0 && monthIdx < 12) {
                        monthRevenues[monthIdx] = monthRevenues[monthIdx].add(amount);
                        monthCounts[monthIdx]++;
                    }
                }

                if (order.getRestaurantId() != null) {
                    revenueByRestaurant.merge(order.getRestaurantId(), amount, BigDecimal::add);
                    countByRestaurant.merge(order.getRestaurantId(), 1L, Long::sum);
                }
            } else if (OrderStatus.CANCELLED.equalsIgnoreCase(statusCode)) {
                cancelledOrders++;
            }
        }

        double completionRate = totalOrders > 0
                ? Math.round((completedOrders * 10000.0) / totalOrders) / 100.0
                : 0.0;

        List<MonthlyRevenuePointDto> monthlyRevenue = new ArrayList<>(12);
        for (int i = 0; i < 12; i++) {
            int month = i + 1;
            monthlyRevenue.add(MonthlyRevenuePointDto.builder()
                    .month(month)
                    .label("T" + month)
                    .revenue(monthRevenues[i])
                    .orderCount(monthCounts[i])
                    .build());
        }

        RemoteUserStatsDto userStats = fetchUserStats();
        RemoteRestaurantStatsDto restaurantStats = fetchRestaurantStats();
        Map<Integer, String> restaurantNames = fetchRestaurantNameMap();

        List<TopRestaurantRevenueDto> topRestaurants = revenueByRestaurant.entrySet().stream()
                .sorted(Map.Entry.<Integer, BigDecimal>comparingByValue().reversed())
                .limit(5)
                .map(entry -> TopRestaurantRevenueDto.builder()
                        .restaurantId(entry.getKey())
                        .restaurantName(restaurantNames.getOrDefault(entry.getKey(), "Quán #" + entry.getKey()))
                        .completedOrders(countByRestaurant.getOrDefault(entry.getKey(), 0L))
                        .revenue(entry.getValue())
                        .build())
                .collect(Collectors.toList());

        return AdminAnalyticsSummaryResponse.builder()
                .year(year)
                .totalUsers(userStats.getTotalUsers())
                .totalMerchants(userStats.getTotalMerchants())
                .totalRestaurants(restaurantStats.getTotalRestaurants())
                .totalFoodItems(restaurantStats.getTotalFoodItems())
                .totalOrders(totalOrders)
                .completedOrders(completedOrders)
                .cancelledOrders(cancelledOrders)
                .completionRate(completionRate)
                .totalGmv(totalGmv)
                .monthlyRevenue(monthlyRevenue)
                .topRestaurants(topRestaurants)
                .build();
    }

    private RemoteUserStatsDto fetchUserStats() {
        try {
            ResponseEntity<ApiResponse<RemoteUserStatsDto>> res = authClient.getUserStatsSummary();
            if (res != null && res.getBody() != null && res.getBody().getData() != null) {
                return res.getBody().getData();
            }
        } catch (Exception ex) {
            log.warn("Could not fetch user stats from auth-service: {}", ex.getMessage());
        }
        return RemoteUserStatsDto.builder().totalUsers(0L).totalMerchants(0L).build();
    }

    private RemoteRestaurantStatsDto fetchRestaurantStats() {
        try {
            ResponseEntity<ApiResponse<RemoteRestaurantStatsDto>> res = restaurantClient.getRestaurantStatsSummary();
            if (res != null && res.getBody() != null && res.getBody().getData() != null) {
                return res.getBody().getData();
            }
        } catch (Exception ex) {
            log.warn("Could not fetch restaurant stats from restaurant-service: {}", ex.getMessage());
        }
        return RemoteRestaurantStatsDto.builder().totalRestaurants(0L).totalFoodItems(0L).build();
    }

    private Map<Integer, String> fetchRestaurantNameMap() {
        try {
            ResponseEntity<ApiResponse<List<RemoteRestaurantDto>>> res = restaurantClient.getAllRestaurants();
            if (res != null && res.getBody() != null && res.getBody().getData() != null) {
                Map<Integer, String> map = new HashMap<>();
                for (RemoteRestaurantDto r : res.getBody().getData()) {
                    if (r.getId() != null && r.getName() != null) {
                        map.put(r.getId(), r.getName());
                    }
                }
                return map;
            }
        } catch (Exception ex) {
            log.warn("Could not fetch restaurant list from restaurant-service: {}", ex.getMessage());
        }
        return Collections.emptyMap();
    }
}

