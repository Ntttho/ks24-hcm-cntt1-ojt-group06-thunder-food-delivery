package com.foodthunder.order.service.analytics;

import com.foodthunder.order.client.AuthClient;
import com.foodthunder.order.client.RestaurantClient;
import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.analytics.AdminAnalyticsSummaryResponse;
import com.foodthunder.order.dto.client.RemoteRestaurantDto;
import com.foodthunder.order.dto.client.RemoteRestaurantStatsDto;
import com.foodthunder.order.dto.client.RemoteUserStatsDto;
import com.foodthunder.order.entity.Order;
import com.foodthunder.order.entity.OrderStatus;
import com.foodthunder.order.repository.OrderRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAnalyticsServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private AuthClient authClient;

    @Mock
    private RestaurantClient restaurantClient;

    @InjectMocks
    private AdminAnalyticsServiceImpl adminAnalyticsService;

    @Test
    @DisplayName("Tổng hợp KPI toàn sàn, biểu đồ 12 tháng T1..T12 và Top quán theo doanh thu")
    void getAnalyticsSummary_aggregatesCorrectly() {
        OrderStatus completed = OrderStatus.builder().id(8).code(OrderStatus.COMPLETED).build();
        OrderStatus cancelled = OrderStatus.builder().id(9).code(OrderStatus.CANCELLED).build();

        Order o1 = Order.builder().id(1L).restaurantId(10).totalAmount(BigDecimal.valueOf(200000))
                .status(completed).createdAt(LocalDateTime.of(2026, 3, 15, 12, 0)).build();
        Order o2 = Order.builder().id(2L).restaurantId(10).totalAmount(BigDecimal.valueOf(150000))
                .status(completed).createdAt(LocalDateTime.of(2026, 3, 20, 18, 0)).build();
        Order o3 = Order.builder().id(3L).restaurantId(20).totalAmount(BigDecimal.valueOf(500000))
                .status(completed).createdAt(LocalDateTime.of(2026, 11, 5, 19, 30)).build();
        Order o4 = Order.builder().id(4L).restaurantId(10).totalAmount(BigDecimal.valueOf(90000))
                .status(cancelled).createdAt(LocalDateTime.of(2026, 11, 6, 10, 0)).build();

        when(orderRepository.findByCreatedAtBetween(any(), any())).thenReturn(List.of(o1, o2, o3, o4));
        when(authClient.getUserStatsSummary()).thenReturn(ResponseEntity.ok(ApiResponse.success(
                RemoteUserStatsDto.builder().totalUsers(120L).totalMerchants(15L).build()
        )));
        when(restaurantClient.getRestaurantStatsSummary()).thenReturn(ResponseEntity.ok(ApiResponse.success(
                RemoteRestaurantStatsDto.builder().totalRestaurants(24L).totalFoodItems(320L).build()
        )));
        when(restaurantClient.getAllRestaurants()).thenReturn(ResponseEntity.ok(ApiResponse.success(List.of(
                RemoteRestaurantDto.builder().id(10).name("Cơm Tấm A").build(),
                RemoteRestaurantDto.builder().id(20).name("Bún Bò B").build()
        ))));

        AdminAnalyticsSummaryResponse summary = adminAnalyticsService.getAnalyticsSummary(2026);

        assertThat(summary.getYear()).isEqualTo(2026);
        assertThat(summary.getTotalUsers()).isEqualTo(120L);
        assertThat(summary.getTotalMerchants()).isEqualTo(15L);
        assertThat(summary.getTotalRestaurants()).isEqualTo(24L);
        assertThat(summary.getTotalFoodItems()).isEqualTo(320L);
        assertThat(summary.getTotalOrders()).isEqualTo(4L);
        assertThat(summary.getCompletedOrders()).isEqualTo(3L);
        assertThat(summary.getCancelledOrders()).isEqualTo(1L);
        assertThat(summary.getCompletionRate()).isEqualTo(75.0);
        assertThat(summary.getTotalGmv()).isEqualByComparingTo(BigDecimal.valueOf(850000));

        assertThat(summary.getMonthlyRevenue()).hasSize(12);
        assertThat(summary.getMonthlyRevenue().get(2).getLabel()).isEqualTo("T3");
        assertThat(summary.getMonthlyRevenue().get(2).getRevenue()).isEqualByComparingTo(BigDecimal.valueOf(350000));
        assertThat(summary.getMonthlyRevenue().get(2).getOrderCount()).isEqualTo(2L);
        assertThat(summary.getMonthlyRevenue().get(10).getLabel()).isEqualTo("T11");
        assertThat(summary.getMonthlyRevenue().get(10).getRevenue()).isEqualByComparingTo(BigDecimal.valueOf(500000));

        assertThat(summary.getTopRestaurants()).hasSize(2);
        assertThat(summary.getTopRestaurants().get(0).getRestaurantName()).isEqualTo("Bún Bò B");
        assertThat(summary.getTopRestaurants().get(0).getRevenue()).isEqualByComparingTo(BigDecimal.valueOf(500000));
        assertThat(summary.getTopRestaurants().get(1).getRestaurantName()).isEqualTo("Cơm Tấm A");
    }

    @Test
    @DisplayName("Fallback an toàn khi Feign Client tới auth-service / restaurant-service bị lỗi")
    void getAnalyticsSummary_gracefulFallbackOnFeignError() {
        when(orderRepository.findByCreatedAtBetween(any(), any())).thenReturn(List.of());
        when(authClient.getUserStatsSummary()).thenThrow(new RuntimeException("auth-service down"));
        when(restaurantClient.getRestaurantStatsSummary()).thenThrow(new RuntimeException("restaurant-service down"));
        when(restaurantClient.getAllRestaurants()).thenThrow(new RuntimeException("restaurant-service down"));

        AdminAnalyticsSummaryResponse summary = adminAnalyticsService.getAnalyticsSummary(2026);

        assertThat(summary.getTotalUsers()).isZero();
        assertThat(summary.getTotalRestaurants()).isZero();
        assertThat(summary.getMonthlyRevenue()).hasSize(12);
        assertThat(summary.getTotalGmv()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}

