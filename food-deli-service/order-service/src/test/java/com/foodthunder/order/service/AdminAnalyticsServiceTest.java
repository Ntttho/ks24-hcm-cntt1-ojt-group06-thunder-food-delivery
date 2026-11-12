package com.foodthunder.order.service;

import com.foodthunder.order.client.AuthClient;
import com.foodthunder.order.client.RestaurantClient;
import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.analytics.AdminAnalyticsSummaryResponse;
import com.foodthunder.order.dto.client.RemoteRestaurantAnalyticsCountsDto;
import com.foodthunder.order.dto.client.RemoteUserAnalyticsCountsDto;
import com.foodthunder.order.entity.OrderStatus;
import com.foodthunder.order.exception.BadRequestException;
import com.foodthunder.order.repository.OrderRepository;
import com.foodthunder.order.service.analytics.AdminAnalyticsServiceImpl;
import com.foodthunder.order.service.analytics.OrderAnalyticsQueryHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAnalyticsServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private AuthClient authClient;

    @Mock
    private RestaurantClient restaurantClient;

    private AdminAnalyticsServiceImpl adminAnalyticsService;

    @BeforeEach
    void setUp() {
        OrderAnalyticsQueryHelper queryHelper = new OrderAnalyticsQueryHelper(orderRepository);
        adminAnalyticsService = new AdminAnalyticsServiceImpl(queryHelper, authClient, restaurantClient);
    }

    @Test
    @DisplayName("Tổng hợp thành công 12 tháng doanh thu (zero-fill), tỷ lệ đơn và counts từ auth/restaurant")
    void getPlatformAnalyticsSummary_happyPath_returnsCompleteMetrics() {
        when(orderRepository.sumCompletedTotalRevenue()).thenReturn(new BigDecimal("158420000.00"));
        when(orderRepository.countAllActiveOrders()).thenReturn(940L);
        when(orderRepository.countActiveOrdersByStatusCode(OrderStatus.COMPLETED)).thenReturn(890L);

        List<Object[]> monthlyRows = Arrays.asList(
                new Object[]{1, new BigDecimal("10200000.00"), 60L},
                new Object[]{3, new BigDecimal("15800000.00"), 95L},
                new Object[]{11, new BigDecimal("24800000.00"), 140L}
        );
        when(orderRepository.findMonthlyCompletedRevenueBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(monthlyRows);

        when(authClient.getUserAnalyticsCounts()).thenReturn(ResponseEntity.ok(
                ApiResponse.success(RemoteUserAnalyticsCountsDto.builder()
                        .totalUsersCount(1250L)
                        .totalMerchantsCount(32L)
                        .build())
        ));
        when(restaurantClient.getRestaurantAnalyticsCounts()).thenReturn(ResponseEntity.ok(
                ApiResponse.success(RemoteRestaurantAnalyticsCountsDto.builder()
                        .totalRestaurantsCount(48L)
                        .totalFoodItemsCount(420L)
                        .build())
        ));

        AdminAnalyticsSummaryResponse result = adminAnalyticsService.getPlatformAnalyticsSummary(2026);

        assertThat(result.getYear()).isEqualTo(2026);
        assertThat(result.getTotalRevenue()).isEqualByComparingTo("158420000.00");
        assertThat(result.getYearlyRevenue()).isEqualByComparingTo("50800000.00");
        assertThat(result.getMonthlyRevenue()).hasSize(12);
        assertThat(result.getMonthlyRevenue().get(0).getMonth()).isEqualTo("01/2026");
        assertThat(result.getMonthlyRevenue().get(0).getRevenue()).isEqualByComparingTo("10200000.00");
        assertThat(result.getMonthlyRevenue().get(1).getMonth()).isEqualTo("02/2026");
        assertThat(result.getMonthlyRevenue().get(1).getRevenue()).isEqualByComparingTo("0");
        assertThat(result.getMonthlyRevenue().get(10).getMonth()).isEqualTo("11/2026");
        assertThat(result.getMonthlyRevenue().get(10).getRevenue()).isEqualByComparingTo("24800000.00");

        assertThat(result.getTotalUsersCount()).isEqualTo(1250L);
        assertThat(result.getTotalMerchantsCount()).isEqualTo(32L);
        assertThat(result.getTotalRestaurantsCount()).isEqualTo(48L);
        assertThat(result.getTotalFoodItemsCount()).isEqualTo(420L);
        assertThat(result.getCompletedOrdersCount()).isEqualTo(890L);
        assertThat(result.getTotalOrdersCount()).isEqualTo(940L);
        assertThat(result.getOrderSuccessRate()).isEqualTo(94.68);
        assertThat(result.isPartialData()).isFalse();
        assertThat(result.getWarnings()).isEmpty();
        verify(orderRepository).findMonthlyCompletedRevenueBetween(
                eq(LocalDateTime.of(2026, 1, 1, 0, 0, 0)),
                eq(LocalDateTime.of(2027, 1, 1, 0, 0, 0))
        );
    }

    @Test
    @DisplayName("Điều kiện biên: Khi hệ thống chưa có đơn hàng nào, tỷ lệ đơn thành công trả 0.0 và doanh thu 12 tháng = 0")
    void getPlatformAnalyticsSummary_zeroOrders_preventsDivisionByZero() {
        when(orderRepository.sumCompletedTotalRevenue()).thenReturn(BigDecimal.ZERO);
        when(orderRepository.countAllActiveOrders()).thenReturn(0L);
        when(orderRepository.countActiveOrdersByStatusCode(OrderStatus.COMPLETED)).thenReturn(0L);
        when(orderRepository.findMonthlyCompletedRevenueBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        when(authClient.getUserAnalyticsCounts()).thenReturn(ResponseEntity.ok(
                ApiResponse.success(RemoteUserAnalyticsCountsDto.builder()
                        .totalUsersCount(5L)
                        .totalMerchantsCount(1L)
                        .build())
        ));
        when(restaurantClient.getRestaurantAnalyticsCounts()).thenReturn(ResponseEntity.ok(
                ApiResponse.success(RemoteRestaurantAnalyticsCountsDto.builder()
                        .totalRestaurantsCount(2L)
                        .totalFoodItemsCount(10L)
                        .build())
        ));

        AdminAnalyticsSummaryResponse result = adminAnalyticsService.getPlatformAnalyticsSummary(2026);

        assertThat(result.getTotalRevenue()).isEqualByComparingTo("0");
        assertThat(result.getOrderSuccessRate()).isEqualTo(0.0);
        assertThat(result.getMonthlyRevenue()).hasSize(12);
        assertThat(result.getMonthlyRevenue())
                .allSatisfy(point -> assertThat(point.getRevenue()).isEqualByComparingTo("0"));
    }

    @Test
    @DisplayName("Validation: Năm thống kê ngoài phạm vi hợp lệ ném BadRequestException")
    void getPlatformAnalyticsSummary_invalidYear_throwsBadRequest() {
        assertThatThrownBy(() -> adminAnalyticsService.getPlatformAnalyticsSummary(1999))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("Resilience Fallback: Vẫn trả doanh thu đơn hàng khi auth-service lỗi và restaurant-service fallback")
    void getPlatformAnalyticsSummary_downstreamDegraded_returnsPartialData() {
        when(orderRepository.sumCompletedTotalRevenue()).thenReturn(new BigDecimal("5000000"));
        when(orderRepository.countAllActiveOrders()).thenReturn(10L);
        when(orderRepository.countActiveOrdersByStatusCode(OrderStatus.COMPLETED)).thenReturn(8L);
        when(orderRepository.findMonthlyCompletedRevenueBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        when(authClient.getUserAnalyticsCounts()).thenThrow(new RuntimeException("auth-service unavailable"));
        when(restaurantClient.getRestaurantAnalyticsCounts()).thenReturn(ResponseEntity.ok(
                ApiResponse.success(RemoteRestaurantAnalyticsCountsDto.builder()
                        .totalRestaurantsCount(0L)
                        .totalFoodItemsCount(0L)
                        .fallback(true)
                        .build())
        ));

        AdminAnalyticsSummaryResponse result = adminAnalyticsService.getPlatformAnalyticsSummary(2026);

        assertThat(result.getTotalRevenue()).isEqualByComparingTo("5000000");
        assertThat(result.getOrderSuccessRate()).isEqualTo(80.0);
        assertThat(result.getTotalUsersCount()).isZero();
        assertThat(result.getTotalRestaurantsCount()).isZero();
        assertThat(result.isPartialData()).isTrue();
        assertThat(result.getWarnings()).hasSize(2);
    }
}

