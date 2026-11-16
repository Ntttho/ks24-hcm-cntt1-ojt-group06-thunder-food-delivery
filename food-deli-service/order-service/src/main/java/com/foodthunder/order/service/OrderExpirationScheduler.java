package com.foodthunder.order.service;

import com.foodthunder.order.entity.Order;
import com.foodthunder.order.entity.OrderStatus;
import com.foodthunder.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Background Scheduler tự động quét và hủy các đơn hàng chờ thanh toán quá hạn 8 phút (AWAITING_PAYMENT).
 * Khi hủy tự động:
 * 1. Chuyển trạng thái đơn sang CANCELLED
 * 2. Ghi log chuyển trạng thái
 * 3. Tự động hoàn trả số lượng món ăn và topping vào kho quán (restoreProductStock)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderExpirationScheduler {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    /**
     * Chạy định kỳ mỗi 60 giây (fixedDelay = 60000ms)
     */
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void autoCancelExpiredAwaitingPaymentOrders() {
        LocalDateTime expirationThreshold = LocalDateTime.now().minusMinutes(8);
        List<Order> expiredOrders = orderRepository.findByStatusCodeAndCreatedAtBefore(
                OrderStatus.AWAITING_PAYMENT, expirationThreshold
        );

        if (!expiredOrders.isEmpty()) {
            log.info("Phát hiện {} đơn hàng AWAITING_PAYMENT quá hạn 8 phút cần tự động hủy", expiredOrders.size());
        }

        for (Order order : expiredOrders) {
            try {
                log.info("Tự động hủy đơn hàng #{} do quá hạn thanh toán 8 phút (createdAt={})",
                        order.getId(), order.getCreatedAt());
                orderService.cancelOrder(
                        order.getId(),
                        "Quá hạn thanh toán 8 phút (Hệ thống tự động hủy)",
                        0,
                        "SYSTEM"
                );
                log.info("Đã tự động hủy và hoàn kho thành công cho đơn hàng #{}", order.getId());
            } catch (Exception ex) {
                log.error("Lỗi khi tự động hủy đơn hàng #{}: {}", order.getId(), ex.getMessage(), ex);
            }
        }
    }
}
