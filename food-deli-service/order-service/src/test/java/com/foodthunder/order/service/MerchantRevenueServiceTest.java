package com.foodthunder.order.service;

import com.foodthunder.order.client.RestaurantClient;
import com.foodthunder.order.dto.revenue.*;
import com.foodthunder.order.entity.Order;
import com.foodthunder.order.entity.OrderStatus;
import com.foodthunder.order.repository.OrderItemRepository;
import com.foodthunder.order.repository.OrderRepository;
import com.foodthunder.order.service.SystemSettingsService;
import com.foodthunder.order.service.revenue.MerchantRevenueServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MerchantRevenueServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private RestaurantClient restaurantClient;

    @Mock
    private SystemSettingsService systemSettingsService;

    @InjectMocks
    private MerchantRevenueServiceImpl revenueService;

    private OrderStatus completedStatus;
    private OrderStatus cancelledStatus;

    @BeforeEach
    void setUp() {
        completedStatus = OrderStatus.builder().id(8).code(OrderStatus.COMPLETED).label("Hoàn thành").build();
        cancelledStatus = OrderStatus.builder().id(9).code(OrderStatus.CANCELLED).label("Đã hủy").build();
    }

    @Test
    @DisplayName("getRevenueSummary: Tính đúng KPI tổng doanh thu, số đơn thành công, AOV và tỷ lệ hoàn tất")
    void getRevenueSummary_shouldCalculateCorrectKPIs() {
        // Arrange
        Order order1 = Order.builder()
                .id(1L)
                .restaurantId(1)
                .status(completedStatus)
                .subtotalAmount(new BigDecimal("100000"))
                .totalAmount(new BigDecimal("100000"))
                .discountAmount(new BigDecimal("10000"))
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        Order order2 = Order.builder()
                .id(2L)
                .restaurantId(1)
                .status(completedStatus)
                .subtotalAmount(new BigDecimal("200000"))
                .totalAmount(new BigDecimal("200000"))
                .discountAmount(BigDecimal.ZERO)
                .createdAt(LocalDateTime.now().minusDays(2))
                .build();

        Order order3 = Order.builder()
                .id(3L)
                .restaurantId(1)
                .status(cancelledStatus)
                .totalAmount(new BigDecimal("50000"))
                .discountAmount(BigDecimal.ZERO)
                .createdAt(LocalDateTime.now().minusDays(3))
                .build();

        when(orderRepository.findByRestaurantIdAndCreatedAtBetween(eq(1), any(), any()))
                .thenReturn(Arrays.asList(order1, order2, order3));
        when(systemSettingsService.commissionRatesAt(anyCollection())).thenReturn(Map.of(
                order1.getCreatedAt(), new BigDecimal("10"),
                order2.getCreatedAt(), new BigDecimal("10")
        ));

        // Act
        MerchantRevenueSummaryResponse summary = revenueService.getRevenueSummary(
                1, null, "MONTH", null, null, 100, "ROLE_MERCHANT"
        );

        // Assert
        assertThat(summary).isNotNull();
        assertThat(summary.getRestaurantId()).isEqualTo(1);
        assertThat(summary.getTotalRevenue()).isEqualByComparingTo(new BigDecimal("300000"));
        assertThat(summary.getSuccessfulOrders()).isEqualTo(2L);
        assertThat(summary.getTotalOrders()).isEqualTo(3L);
        assertThat(summary.getCancelledOrders()).isEqualTo(1L);
        assertThat(summary.getAverageOrderValue()).isEqualByComparingTo(new BigDecimal("150000"));
        assertThat(summary.getTotalDiscount()).isEqualByComparingTo(new BigDecimal("10000"));
        assertThat(summary.getPlatformCommission()).isEqualByComparingTo(new BigDecimal("30000"));
        assertThat(summary.getRestaurantPayout()).isEqualByComparingTo(new BigDecimal("270000"));
        assertThat(summary.getCompletionRate()).isEqualTo(66.7);
    }

    @Test
    @DisplayName("getRevenueChart: Tạo đầy đủ các điểm dữ liệu cho kỳ 7 ngày qua")
    void getRevenueChart_shouldGeneratePointsCorrectly() {
        // Arrange
        Order order = Order.builder()
                .id(1L)
                .restaurantId(1)
                .status(completedStatus)
                .totalAmount(new BigDecimal("150000"))
                .createdAt(LocalDateTime.now())
                .build();

        when(orderRepository.findByRestaurantIdAndCreatedAtBetween(eq(1), any(), any()))
                .thenReturn(List.of(order));

        // Act
        RevenueChartResponse chart = revenueService.getRevenueChart(
                1, null, "WEEK", null, null, 100, "ROLE_MERCHANT"
        );

        // Assert
        assertThat(chart).isNotNull();
        assertThat(chart.getPeriod()).isEqualTo("WEEK");
        assertThat(chart.getPoints()).hasSize(7);
        assertThat(chart.getTotalPeriodRevenue()).isEqualByComparingTo(new BigDecimal("150000"));
        assertThat(chart.getTotalPeriodOrders()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getTopSellingFoods: Map đúng thông tin món bán chạy nhất")
    void getTopSellingFoods_shouldReturnMappedList() {
        // Arrange
        Object[] row1 = new Object[]{101, "Cơm Tấm Sườn Bì", 50L, new BigDecimal("2500000")};
        Object[] row2 = new Object[]{102, "Trà Sữa Trân Châu", 30L, new BigDecimal("900000")};
        List<Object[]> rows = Arrays.asList(row1, row2);

        when(orderItemRepository.findTopSellingFoodsByRestaurantId(eq(1), any(), any(), any(Pageable.class)))
                .thenReturn(rows);

        // Act
        List<TopSellingFoodDto> result = revenueService.getTopSellingFoods(
                1, null, 5, null, null, 100, "ROLE_MERCHANT"
        );

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getFoodName()).isEqualTo("Cơm Tấm Sườn Bì");
        assertThat(result.get(0).getTotalQuantitySold()).isEqualTo(50L);
        assertThat(result.get(0).getTotalRevenue()).isEqualByComparingTo(new BigDecimal("2500000"));
    }

    @Test
    @DisplayName("getMultiBranchComparison: Tính đúng tỷ lệ phần trăm đóng góp doanh thu của từng chi nhánh")
    void getMultiBranchComparison_shouldCalculatePercentageContribution() {
        // Arrange
        Order o1 = Order.builder()
                .id(1L)
                .restaurantId(1)
                .status(completedStatus)
                .totalAmount(new BigDecimal("3000000"))
                .createdAt(LocalDateTime.now())
                .build();

        Order o2 = Order.builder()
                .id(2L)
                .restaurantId(2)
                .status(completedStatus)
                .totalAmount(new BigDecimal("1000000"))
                .createdAt(LocalDateTime.now())
                .build();

        when(orderRepository.findByRestaurantIdInAndCreatedAtBetween(anyList(), any(), any()))
                .thenReturn(Arrays.asList(o1, o2));

        // Act
        List<MultiBranchRevenueDto> branches = revenueService.getMultiBranchComparison(
                Arrays.asList(1, 2), "MONTH", null, null, 100, "ROLE_MERCHANT"
        );

        // Assert
        assertThat(branches).hasSize(2);
        // Sorted descending by revenue
        assertThat(branches.get(0).getRestaurantId()).isEqualTo(1);
        assertThat(branches.get(0).getTotalRevenue()).isEqualByComparingTo(new BigDecimal("3000000"));
        assertThat(branches.get(0).getContributionPercentage()).isEqualTo(75.0);

        assertThat(branches.get(1).getRestaurantId()).isEqualTo(2);
        assertThat(branches.get(1).getTotalRevenue()).isEqualByComparingTo(new BigDecimal("1000000"));
        assertThat(branches.get(1).getContributionPercentage()).isEqualTo(25.0);
    }
}
