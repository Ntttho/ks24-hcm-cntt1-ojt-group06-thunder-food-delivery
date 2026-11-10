package com.foodthunder.delivery.scheduler;

import com.foodthunder.delivery.repository.DriverOfferRepository;
import com.foodthunder.delivery.repository.DriverPenaltyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DeliveryExpirationScheduler {

    private final DriverOfferRepository driverOfferRepository;
    private final DriverPenaltyRepository driverPenaltyRepository;

    /**
     * Cron Job chạy định kỳ mỗi 1 phút (60.000 ms):
     * 1. Tự động chuyển các offer quá hạn (OFFERED và expiresAt <= now) thành IGNORED.
     * 2. Tự động chuyển các hình phạt đã qua hạn (ACTIVE và endsAt <= now) thành EXPIRED.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void runExpirationTasks() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Quét và chuyển các DriverOffer quá hạn từ OFFERED sang IGNORED
        try {
            int expiredOffersCount = driverOfferRepository.expirePendingOffers(now);
            if (expiredOffersCount > 0) {
                log.info("[Scheduler] Đã tự động chuyển {} lời mời nhận đơn quá hạn từ OFFERED sang IGNORED", expiredOffersCount);
            }
        } catch (Exception ex) {
            log.error("[Scheduler] Lỗi khi xử lý hết hạn lời mời nhận đơn: {}", ex.getMessage());
        }

        // 2. Quét và chuyển các DriverPenalty hết hạn từ ACTIVE sang EXPIRED
        try {
            int expiredPenaltiesCount = driverPenaltyRepository.expireActivePenalties(now);
            if (expiredPenaltiesCount > 0) {
                log.info("[Scheduler] Đã tự động chuyển {} hình phạt hết thời hạn từ ACTIVE sang EXPIRED", expiredPenaltiesCount);
            }
        } catch (Exception ex) {
            log.error("[Scheduler] Lỗi khi xử lý hết hạn hình phạt: {}", ex.getMessage());
        }
    }
}
