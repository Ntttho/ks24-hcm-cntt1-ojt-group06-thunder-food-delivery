package com.foodthunder.delivery.concurrency;

import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.delivery.client.OrderClient;
import com.foodthunder.delivery.dto.client.RemoteUpdateOrderStatusRequest;
import com.foodthunder.delivery.dto.response.AcceptOrderResponse;
import com.foodthunder.delivery.entity.DriverDetail;
import com.foodthunder.delivery.entity.DriverOffer;
import com.foodthunder.delivery.exception.ConflictException;
import com.foodthunder.delivery.repository.DriverDetailRepository;
import com.foodthunder.delivery.repository.DriverOfferRepository;
import com.foodthunder.delivery.service.DeliveryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class DeliveryConcurrencyTest {

    @Autowired
    private DeliveryService deliveryService;

    @Autowired
    private DriverDetailRepository driverDetailRepository;

    @Autowired
    private DriverOfferRepository driverOfferRepository;

    @MockBean
    private OrderClient orderClient;

    private static final Long TEST_ORDER_ID = 888L;
    private static final Integer DRIVER_1 = 201;
    private static final Integer DRIVER_2 = 202;

    @BeforeEach
    void setUp() {
        driverOfferRepository.deleteAll();
        driverDetailRepository.deleteAll();

        // 1. Tạo 2 tài xế online sẵn sàng nhận đơn
        DriverDetail d1 = DriverDetail.builder()
                .userId(DRIVER_1)
                .licensePlate("59B1-11111")
                .idCardNumber("111111111111")
                .vehicleType("Motorbike")
                .approvalStatus("APPROVED")
                .isOnline(true)
                .build();

        DriverDetail d2 = DriverDetail.builder()
                .userId(DRIVER_2)
                .licensePlate("59B1-22222")
                .idCardNumber("222222222222")
                .vehicleType("Motorbike")
                .approvalStatus("APPROVED")
                .isOnline(true)
                .build();

        driverDetailRepository.saveAll(List.of(d1, d2));

        // 2. Tạo 2 lời mời (offers) cho cùng 1 đơn hàng TEST_ORDER_ID
        DriverOffer offer1 = DriverOffer.builder()
                .orderId(TEST_ORDER_ID)
                .driverId(DRIVER_1)
                .status("OFFERED")
                .algorithm("NEARBY_RADIUS")
                .offeredAt(LocalDateTime.now())
                .build();

        DriverOffer offer2 = DriverOffer.builder()
                .orderId(TEST_ORDER_ID)
                .driverId(DRIVER_2)
                .status("OFFERED")
                .algorithm("NEARBY_RADIUS")
                .offeredAt(LocalDateTime.now())
                .build();

        driverOfferRepository.saveAll(List.of(offer1, offer2));

        // 3. Mock Feign client order-service luôn phản hồi 200 OK
        when(orderClient.updateOrderStatus(anyLong(), any(RemoteUpdateOrderStatusRequest.class), anyInt(), anyString()))
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Updated")));
    }

    @Test
    @DisplayName("Kiểm thử Race Condition: 2 tài xế cùng bấm nhận 1 đơn cùng mili-giây -> Duy nhất 1 tài xế nhận thành công, tài xế còn lại nhận 409 Conflict")
    void testConcurrentAcceptOrder_PessimisticLocking_PreventsRaceCondition() throws InterruptedException {
        int numberOfThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch endGate = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);
        AtomicReference<Integer> winnerDriverId = new AtomicReference<>(null);

        // Task cho tài xế 1
        executor.submit(() -> {
            try {
                startGate.await(); // Chờ hiệu lệnh đồng thanh
                AcceptOrderResponse resp = deliveryService.acceptOrder(DRIVER_1, TEST_ORDER_ID);
                if (resp != null && "ACCEPTED".equals(resp.getStatus())) {
                    successCount.incrementAndGet();
                    winnerDriverId.set(DRIVER_1);
                }
            } catch (ConflictException ce) {
                conflictCount.incrementAndGet();
            } catch (Exception ex) {
                // Các exception khác nếu có
            } finally {
                endGate.countDown();
            }
        });

        // Task cho tài xế 2
        executor.submit(() -> {
            try {
                startGate.await(); // Chờ hiệu lệnh đồng thanh
                AcceptOrderResponse resp = deliveryService.acceptOrder(DRIVER_2, TEST_ORDER_ID);
                if (resp != null && "ACCEPTED".equals(resp.getStatus())) {
                    successCount.incrementAndGet();
                    winnerDriverId.set(DRIVER_2);
                }
            } catch (ConflictException ce) {
                conflictCount.incrementAndGet();
            } catch (Exception ex) {
                // Các exception khác nếu có
            } finally {
                endGate.countDown();
            }
        });

        // Mở cổng bắn đồng thời cả 2 thread
        startGate.countDown();
        boolean completedInTime = endGate.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Kiểm chứng tính bất biến và triệt tiêu Race Condition
        assertThat(completedInTime).isTrue();
        assertThat(successCount.get())
                .as("Chỉ duy nhất 1 tài xế được phép nhận đơn thành công")
                .isEqualTo(1);

        assertThat(conflictCount.get())
                .as("Tài xế bấm sau bắt buộc nhận lỗi 409 Conflict")
                .isEqualTo(1);

        // Kiểm tra cơ sở dữ liệu
        List<DriverOffer> allOffers = driverOfferRepository.findByOrderId(TEST_ORDER_ID);
        long acceptedCount = allOffers.stream().filter(o -> "ACCEPTED".equalsIgnoreCase(o.getStatus())).count();
        long missedCount = allOffers.stream().filter(o -> "MISSED".equalsIgnoreCase(o.getStatus())).count();

        assertThat(acceptedCount).isEqualTo(1L);
        assertThat(missedCount).isEqualTo(1L);

        Integer winner = winnerDriverId.get();
        assertThat(winner).isNotNull();
        System.out.println(">>> Race condition resolved successfully! Winner Driver ID: " + winner);
    }
}
