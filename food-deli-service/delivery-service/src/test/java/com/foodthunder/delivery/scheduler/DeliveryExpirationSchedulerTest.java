package com.foodthunder.delivery.scheduler;

import com.foodthunder.delivery.repository.DriverOfferRepository;
import com.foodthunder.delivery.repository.DriverPenaltyRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeliveryExpirationSchedulerTest {

    @Mock
    private DriverOfferRepository driverOfferRepository;

    @Mock
    private DriverPenaltyRepository driverPenaltyRepository;

    @InjectMocks
    private DeliveryExpirationScheduler scheduler;

    @Test
    @DisplayName("Scheduler chạy mỗi 1 phút: Chuyển đúng số lượng offer quá hạn sang IGNORED và penalty sang EXPIRED")
    void testRunExpirationTasks_Success() {
        when(driverOfferRepository.expirePendingOffers(any(LocalDateTime.class))).thenReturn(3);
        when(driverPenaltyRepository.expireActivePenalties(any(LocalDateTime.class))).thenReturn(2);

        scheduler.runExpirationTasks();

        verify(driverOfferRepository, times(1)).expirePendingOffers(any(LocalDateTime.class));
        verify(driverPenaltyRepository, times(1)).expireActivePenalties(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("Scheduler: Khi không có offer hay penalty nào hết hạn, chạy bình thường không phát sinh lỗi")
    void testRunExpirationTasks_ZeroItems() {
        when(driverOfferRepository.expirePendingOffers(any(LocalDateTime.class))).thenReturn(0);
        when(driverPenaltyRepository.expireActivePenalties(any(LocalDateTime.class))).thenReturn(0);

        scheduler.runExpirationTasks();

        verify(driverOfferRepository, times(1)).expirePendingOffers(any(LocalDateTime.class));
        verify(driverPenaltyRepository, times(1)).expireActivePenalties(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("Scheduler: Xử lý ngoại lệ an toàn, không làm crash luồng chạy nền nếu CSDL gặp trục trặc")
    void testRunExpirationTasks_HandlesException() {
        when(driverOfferRepository.expirePendingOffers(any(LocalDateTime.class)))
                .thenThrow(new RuntimeException("Database connection timeout"));
        when(driverPenaltyRepository.expireActivePenalties(any(LocalDateTime.class)))
                .thenReturn(1);

        scheduler.runExpirationTasks();

        verify(driverOfferRepository, times(1)).expirePendingOffers(any(LocalDateTime.class));
        verify(driverPenaltyRepository, times(1)).expireActivePenalties(any(LocalDateTime.class));
    }
}

