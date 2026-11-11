package com.foodthunder.order.service.analytics;

import com.foodthunder.order.entity.OrderStatus;
import com.foodthunder.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Thực thi các truy vấn đọc thống kê nội bộ của order-service trong transaction ngắn hạn,
 * giải phóng DB connection trước khi gọi các Feign client tới microservice khác.
 */
@Component
@RequiredArgsConstructor
public class OrderAnalyticsQueryHelper {

    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public LocalOrderMetrics loadLocalMetrics(LocalDateTime startOfYear, LocalDateTime startOfNextYear) {
        BigDecimal totalRevenue = orderRepository.sumCompletedTotalRevenue();
        long totalOrdersCount = orderRepository.countAllActiveOrders();
        long completedOrdersCount = orderRepository.countActiveOrdersByStatusCode(OrderStatus.COMPLETED);
        List<Object[]> monthlyRows = orderRepository.findMonthlyCompletedRevenueBetween(startOfYear, startOfNextYear);
        return new LocalOrderMetrics(
                totalRevenue != null ? totalRevenue : BigDecimal.ZERO,
                totalOrdersCount,
                completedOrdersCount,
                monthlyRows
        );
    }

    public record LocalOrderMetrics(
            BigDecimal totalRevenue,
            long totalOrdersCount,
            long completedOrdersCount,
            List<Object[]> monthlyRows
    ) {
    }
}

