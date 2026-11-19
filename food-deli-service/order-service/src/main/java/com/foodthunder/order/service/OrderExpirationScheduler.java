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
 * Background Scheduler tự động quét và hủy các đơn hàng treo / quá hạn thời gian:
 * 1. Đơn chờ thanh toán quá hạn 8 phút (AWAITING_PAYMENT).
 * 2. Đơn chờ quán xác nhận quá hạn 10 phút (PENDING).
 * 3. Đơn đã xác nhận nhưng quá 15 phút không có tài xế tiếp nhận (CONFIRMED & driverId IS NULL).
 * 
 * Khi hủy tự động:
 * - Chuyển trạng thái đơn sang CANCELLED
 * - Ghi log chuyển trạng thái (kèm lý do tự động hủy cụ thể)
 * - Tự động hoàn trả số lượng món ăn vào kho quán (restoreProductStock)
 * - Tự động hoàn lại voucher giảm giá (releaseOrderVouchers)
 * - Phát sóng WebSocket cập nhật realtime cho khách hàng, quán ăn và tài xế
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderExpirationScheduler {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    /**
     * 1. Quét tự động hủy đơn hàng chờ thanh toán quá hạn 8 phút (AWAITING_PAYMENT).
     * Chạy định kỳ mỗi 60 giây.
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

    /**
     * 2. Quét tự động hủy đơn hàng chờ quán xác nhận quá hạn 10 phút (PENDING).
     * Chạy định kỳ mỗi 60 giây.
     */
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void autoCancelExpiredPendingOrders() {
        LocalDateTime expirationThreshold = LocalDateTime.now().minusMinutes(10);
        List<Order> expiredOrders = orderRepository.findByStatusCodeAndCreatedAtBefore(
                OrderStatus.PENDING, expirationThreshold
        );

        if (!expiredOrders.isEmpty()) {
            log.info("Phát hiện {} đơn hàng PENDING quá hạn 10 phút quán chưa phản hồi cần tự động hủy", expiredOrders.size());
        }

        for (Order order : expiredOrders) {
            try {
                log.info("Tự động hủy đơn hàng #{} do quán không phản hồi sau 10 phút (createdAt={})",
                        order.getId(), order.getCreatedAt());
                orderService.cancelOrder(
                        order.getId(),
                        "Quán không phản hồi sau 10 phút (Hệ thống tự động hủy)",
                        0,
                        "SYSTEM"
                );
                log.info("Đã tự động hủy và hoàn kho đơn hàng PENDING #{}", order.getId());
            } catch (Exception ex) {
                log.error("Lỗi khi tự động hủy đơn hàng PENDING #{}: {}", order.getId(), ex.getMessage(), ex);
            }
        }
    }

    /**
     * 3. Quét tự động hủy đơn hàng đã xác nhận quá hạn 15 phút chưa có tài xế nhận (CONFIRMED & driverId IS NULL).
     * Chạy định kỳ mỗi 60 giây.
     */
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void autoCancelExpiredUnassignedConfirmedOrders() {
        LocalDateTime expirationThreshold = LocalDateTime.now().minusMinutes(15);
        List<Order> expiredOrders = orderRepository.findUnassignedOrdersByStatusCodeAndCreatedAtBefore(
                OrderStatus.CONFIRMED, expirationThreshold
        );

        if (!expiredOrders.isEmpty()) {
            log.info("Phát hiện {} đơn hàng CONFIRMED quá 15 phút chưa có tài xế nhận cần tự động hủy", expiredOrders.size());
        }

        for (Order order : expiredOrders) {
            try {
                log.info("Tự động hủy đơn hàng #{} do không có tài xế nhận sau 15 phút (createdAt={})",
                        order.getId(), order.getCreatedAt());
                orderService.cancelOrder(
                        order.getId(),
                        "Hết thời gian tìm tài xế giao hàng sau 15 phút (Hệ thống tự động hủy)",
                        0,
                        "SYSTEM"
                );
                log.info("Đã tự động hủy và hoàn kho đơn hàng CONFIRMED không có tài xế #{}", order.getId());
            } catch (Exception ex) {
                log.error("Lỗi khi tự động hủy đơn hàng CONFIRMED #{}: {}", order.getId(), ex.getMessage(), ex);
            }
        }
    }
}
