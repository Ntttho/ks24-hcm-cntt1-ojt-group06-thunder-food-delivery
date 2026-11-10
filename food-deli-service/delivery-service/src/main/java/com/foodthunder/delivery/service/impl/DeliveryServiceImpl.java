package com.foodthunder.delivery.service.impl;

import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.delivery.client.OrderClient;
import com.foodthunder.delivery.dto.client.RemoteUpdateOrderStatusRequest;
import com.foodthunder.delivery.dto.request.DriverCancelOrderRequest;
import com.foodthunder.delivery.dto.request.DriverLocationRequest;
import com.foodthunder.delivery.dto.request.UpdateDeliveryStepRequest;
import com.foodthunder.delivery.dto.response.*;
import com.foodthunder.delivery.entity.DriverDetail;
import com.foodthunder.delivery.entity.DriverLocation;
import com.foodthunder.delivery.entity.DriverOffer;
import com.foodthunder.delivery.entity.DriverPenalty;
import com.foodthunder.delivery.exception.BadRequestException;
import com.foodthunder.delivery.exception.ConflictException;
import com.foodthunder.delivery.exception.ResourceNotFoundException;
import com.foodthunder.delivery.repository.DriverDetailRepository;
import com.foodthunder.delivery.repository.DriverLocationRepository;
import com.foodthunder.delivery.repository.DriverOfferRepository;
import com.foodthunder.delivery.repository.DriverPenaltyRepository;
import com.foodthunder.delivery.service.DeliveryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryServiceImpl implements DeliveryService {

    private final DriverDetailRepository driverDetailRepository;
    private final DriverLocationRepository driverLocationRepository;
    private final DriverOfferRepository driverOfferRepository;
    private final DriverPenaltyRepository driverPenaltyRepository;
    private final OrderClient orderClient;

    @Override
    @Transactional
    public AcceptOrderResponse acceptOrder(Integer driverId, Long orderId) {
        log.info("Driver #{} is attempting to accept order #{}", driverId, orderId);

        // 1. Thẩm định trạng thái tài xế (phải tồn tại và đang trực tuyến)
        DriverDetail driver = driverDetailRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài xế với ID=" + driverId));

        if (!Boolean.TRUE.equals(driver.getIsOnline())) {
            throw new BadRequestException("Tài xế đang ngoại tuyến (Offline). Vui lòng bật chế độ trực tuyến trước khi nhận đơn!");
        }

        if (!"APPROVED".equalsIgnoreCase(driver.getApprovalStatus())) {
            throw new BadRequestException("Tài khoản tài xế chưa được phê duyệt (Trạng thái: " + driver.getApprovalStatus() + ")");
        }

        // 1.1 Kiểm tra chế tài phạt / Tự động tạm khóa nhận cuốc (AR < 80% hoặc CR > 10%)
        checkDriverSuspension(driverId);

        // 2. KHÓA BI QUAN (PESSIMISTIC LOCKING - SELECT ... FOR UPDATE)
        // Lấy tất cả offers của orderId này kèm khóa ghi độc quyền X-Lock trên CSDL.
        // Bất kỳ thread nào khác cùng truy vấn đơn này sẽ bị BLOCKED tại đây cho đến khi transaction hoàn tất.
        List<DriverOffer> offers = driverOfferRepository.findAllByOrderIdForUpdate(orderId);

        // 3. Kiểm tra Race Condition: Đơn đã có tài xế khác nhanh tay nhận trước hay chưa?
        boolean alreadyAccepted = offers.stream()
                .anyMatch(o -> "ACCEPTED".equalsIgnoreCase(o.getStatus()));

        if (alreadyAccepted) {
            log.warn("Race condition detected: Order #{} has already been accepted by another driver. Rejecting driver #{}", orderId, driverId);
            throw new ConflictException("Đơn hàng này đã được một tài xế khác nhanh tay nhận trước. Vui lòng chọn đơn khác!");
        }

        // 4. Tìm offer dành riêng cho tài xế này hoặc tạo mới nếu nhận từ pool mở
        DriverOffer targetOffer = offers.stream()
                .filter(o -> o.getDriverId().equals(driverId))
                .findFirst()
                .orElse(null);

        if (targetOffer == null) {
            targetOffer = DriverOffer.builder()
                    .orderId(orderId)
                    .driverId(driverId)
                    .status("ACCEPTED")
                    .algorithm("DIRECT_ACCEPT")
                    .offeredAt(LocalDateTime.now())
                    .respondedAt(LocalDateTime.now())
                    .build();
            offers.add(targetOffer);
        } else {
            if ("EXPIRED".equalsIgnoreCase(targetOffer.getStatus())) {
                throw new BadRequestException("Cuốc xe đã hết thời gian phản hồi!");
            }
            if ("REJECTED".equalsIgnoreCase(targetOffer.getStatus())) {
                throw new BadRequestException("Bạn đã từ chối cuốc xe này trước đó!");
            }
            targetOffer.setStatus("ACCEPTED");
            targetOffer.setRespondedAt(LocalDateTime.now());
        }

        // 5. Cập nhật tất cả các offers khác của cùng đơn hàng thành MISSED (Hụt cuốc)
        for (DriverOffer other : offers) {
            if (!other.getDriverId().equals(driverId) && "OFFERED".equalsIgnoreCase(other.getStatus())) {
                other.setStatus("MISSED");
                other.setRespondedAt(LocalDateTime.now());
                other.setResponseReason("Tài xế khác đã nhanh tay nhận trước");
            }
        }

        driverOfferRepository.saveAll(offers);

        // 6. Đồng bộ liên dịch vụ sang order-service qua OpenFeign
        try {
            RemoteUpdateOrderStatusRequest statusReq = RemoteUpdateOrderStatusRequest.builder()
                    .statusCode("DRIVER_ACCEPTED")
                    .reason("Tài xế #" + driverId + " đã nhận đơn giao hàng")
                    .build();

            ResponseEntity<ApiResponse<Object>> feignResp = orderClient.updateOrderStatus(orderId, statusReq, driverId, "ROLE_DRIVER");
            if (feignResp != null && feignResp.getBody() != null && feignResp.getBody().status() >= 400) {
                throw new BadRequestException("Không thể nhận đơn: " + feignResp.getBody().message());
            }
        } catch (BadRequestException be) {
            throw be;
        } catch (Exception ex) {
            log.error("Failed to update status in order-service: {}", ex.getMessage());
            throw new BadRequestException("Lỗi đồng bộ trạng thái đơn hàng sang order-service: " + ex.getMessage());
        }

        log.info("Driver #{} successfully accepted order #{}", driverId, orderId);

        return AcceptOrderResponse.builder()
                .offerId(targetOffer.getId())
                .orderId(orderId)
                .driverId(driverId)
                .status("ACCEPTED")
                .respondedAt(targetOffer.getRespondedAt())
                .build();
    }

    @Override
    @Transactional
    public void rejectOrder(Integer driverId, Long orderId, String reason) {
        DriverOffer offer = driverOfferRepository.findByOrderIdAndDriverId(orderId, driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời nhận đơn #" + orderId + " cho tài xế #" + driverId));

        offer.setStatus("REJECTED");
        offer.setRespondedAt(LocalDateTime.now());
        offer.setResponseReason(reason != null ? reason : "Tài xế từ chối nhận cuốc");
        driverOfferRepository.save(offer);

        log.info("Driver #{} rejected order #{}, reason: {}", driverId, orderId, offer.getResponseReason());

        // Đánh giá lại AR và tự động thi hành chế tài nếu AR < 80%
        evaluateAndApplyPenalties(driverId);
    }

    @Override
    @Transactional
    public DriverStatusResponse toggleOnline(Integer driverId) {
        DriverDetail driver = driverDetailRepository.findById(driverId)
                .orElseGet(() -> DriverDetail.builder()
                        .userId(driverId)
                        .licensePlate("59A1-00000")
                        .idCardNumber("000000000000")
                        .vehicleType("Motorbike")
                        .approvalStatus("APPROVED")
                        .isOnline(false)
                        .build());

        driver.setIsOnline(!Boolean.TRUE.equals(driver.getIsOnline()));
        driverDetailRepository.save(driver);

        log.info("Driver #{} toggled online status to: {}", driverId, driver.getIsOnline());
        return mapToDriverStatusResponse(driver);
    }

    @Override
    public DriverStatusResponse getDriverStatus(Integer driverId) {
        DriverDetail driver = driverDetailRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tài xế với ID=" + driverId));
        return mapToDriverStatusResponse(driver);
    }

    @Override
    @Transactional
    public DriverLocationResponse updateLocation(Integer driverId, DriverLocationRequest request) {
        DriverLocation location = DriverLocation.builder()
                .driverId(driverId)
                .orderId(request.getOrderId())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .heading(request.getHeading() != null ? request.getHeading() : 0.0)
                .speedKmh(request.getSpeedKmh() != null ? request.getSpeedKmh() : 24.0)
                .build();

        DriverLocation saved = driverLocationRepository.save(location);
        return mapToDriverLocationResponse(saved);
    }

    @Override
    public DriverLocationResponse getCurrentLocation(Integer driverId) {
        DriverLocation loc = driverLocationRepository.findFirstByDriverIdOrderByCreatedAtDesc(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có dữ liệu định vị cho tài xế ID=" + driverId));
        return mapToDriverLocationResponse(loc);
    }

    @Override
    public DriverLocationResponse getOrderDriverLocation(Long orderId) {
        DriverLocation loc = driverLocationRepository.findFirstByOrderIdOrderByCreatedAtDesc(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có dữ liệu định vị cho đơn hàng ID=" + orderId));
        return mapToDriverLocationResponse(loc);
    }

    @Override
    public List<DriverOfferResponse> getPendingOffers(Integer driverId) {
        // Nếu tài xế đang bị tạm khóa nhận cuốc (AR < 80% hoặc CR > 10%), không hiển thị đơn mới
        List<DriverPenalty> activePenalties = driverPenaltyRepository.findActivePenalties(driverId, LocalDateTime.now());
        if (!activePenalties.isEmpty()) {
            log.info("Driver #{} is currently suspended from accepting orders, returning empty offers list", driverId);
            return Collections.emptyList();
        }

        List<DriverOffer> offers = driverOfferRepository.findByDriverIdAndStatus(driverId, "OFFERED");
        return offers.stream().map(this::mapToOfferResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateDeliveryStep(Integer driverId, Long orderId, UpdateDeliveryStepRequest request) {
        String targetStep = request.getStep().trim().toUpperCase();

        if (!List.of("PICKING_UP", "DELIVERING", "COMPLETED").contains(targetStep)) {
            throw new BadRequestException("Bước chuyển trạng thái không hợp lệ: '" + targetStep + "'. Chỉ chấp nhận: PICKING_UP, DELIVERING, COMPLETED");
        }

        // 1. Kiểm tra tài xế có phải là người nhận đơn này không
        DriverOffer offer = driverOfferRepository.findByOrderIdAndDriverId(orderId, driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài xế #" + driverId + " không phải người nhận đơn #" + orderId));

        if (!"ACCEPTED".equalsIgnoreCase(offer.getStatus())) {
            throw new BadRequestException("Đơn hàng chưa ở trạng thái được bạn tiếp nhận!");
        }

        // 2. Gọi OpenFeign sang order-service để cập nhật máy trạng thái đơn hàng
        RemoteUpdateOrderStatusRequest feignReq = RemoteUpdateOrderStatusRequest.builder()
                .statusCode(targetStep)
                .reason(request.getNote() != null ? request.getNote() : "Tài xế cập nhật tiến trình: " + targetStep)
                .build();

        try {
            ResponseEntity<ApiResponse<Object>> resp = orderClient.updateOrderStatus(orderId, feignReq, driverId, "ROLE_DRIVER");
            if (resp != null && resp.getBody() != null && resp.getBody().status() >= 400) {
                throw new BadRequestException("Không thể cập nhật tiến trình đơn: " + resp.getBody().message());
            }
        } catch (BadRequestException be) {
            throw be;
        } catch (Exception ex) {
            log.error("Failed to propagate delivery step to order-service: {}", ex.getMessage());
            throw new BadRequestException("Lỗi cập nhật tiến trình giao hàng: " + ex.getMessage());
        }

        // 3. Nếu có gửi kèm tọa độ thì ghi nhận vào driver_locations
        if (request.getCurrentLat() != null && request.getCurrentLng() != null) {
            DriverLocation location = DriverLocation.builder()
                    .driverId(driverId)
                    .orderId(orderId)
                    .latitude(request.getCurrentLat())
                    .longitude(request.getCurrentLng())
                    .speedKmh(24.0)
                    .build();
            driverLocationRepository.save(location);
        }

        log.info("Driver #{} updated delivery step for order #{} to {}", driverId, orderId, targetStep);
    }

    private DriverStatusResponse mapToDriverStatusResponse(DriverDetail d) {
        return DriverStatusResponse.builder()
                .userId(d.getUserId())
                .licensePlate(d.getLicensePlate())
                .vehicleType(d.getVehicleType())
                .approvalStatus(d.getApprovalStatus())
                .isOnline(d.getIsOnline())
                .build();
    }

    private DriverLocationResponse mapToDriverLocationResponse(DriverLocation l) {
        return DriverLocationResponse.builder()
                .id(l.getId())
                .driverId(l.getDriverId())
                .orderId(l.getOrderId())
                .latitude(l.getLatitude())
                .longitude(l.getLongitude())
                .heading(l.getHeading())
                .speedKmh(l.getSpeedKmh())
                .createdAt(l.getCreatedAt())
                .build();
    }

    private DriverOfferResponse mapToOfferResponse(DriverOffer o) {
        return DriverOfferResponse.builder()
                .id(o.getId())
                .orderId(o.getOrderId())
                .driverId(o.getDriverId())
                .status(o.getStatus())
                .distanceKm(o.getDistanceKm())
                .pickupEtaMinutes(o.getPickupEtaMinutes())
                .dispatchScore(o.getDispatchScore())
                .offeredAt(o.getOfferedAt())
                .expiresAt(o.getExpiresAt())
                .build();
    }

    @Override
    @Transactional
    public DriverMetricsResponse cancelOrder(Integer driverId, Long orderId, DriverCancelOrderRequest request) {
        DriverOffer offer = driverOfferRepository.findByOrderIdAndDriverId(orderId, driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin đơn hàng #" + orderId + " được tiếp nhận bởi tài xế #" + driverId));

        if (!"ACCEPTED".equalsIgnoreCase(offer.getStatus()) && !"PICKING_UP".equalsIgnoreCase(offer.getStatus())) {
            throw new BadRequestException("Chỉ có thể hủy trả các đơn hàng bạn đã tiếp nhận!");
        }

        String reasonCode = request.getReasonCode() != null ? request.getReasonCode().trim().toUpperCase() : "PERSONAL_REASON";
        boolean isChargeable = !"CUSTOMER_REQUEST".equalsIgnoreCase(reasonCode)
                && !"SYSTEM_ISSUE".equalsIgnoreCase(reasonCode);

        offer.setStatus("DRIVER_CANCELLED");
        offer.setCancellationChargeable(isChargeable);
        offer.setRespondedAt(LocalDateTime.now());
        offer.setResponseReason("Tài xế hủy đơn: [" + reasonCode + "] " + (request.getNote() != null ? request.getNote() : ""));
        driverOfferRepository.save(offer);

        try {
            RemoteUpdateOrderStatusRequest feignReq = RemoteUpdateOrderStatusRequest.builder()
                    .statusCode("DRIVER_REJECTED")
                    .reason("Tài xế trả đơn: " + reasonCode + (request.getNote() != null ? " - " + request.getNote() : ""))
                    .build();

            orderClient.updateOrderStatus(orderId, feignReq, driverId, "ROLE_DRIVER");
        } catch (Exception ex) {
            log.warn("Failed to propagate driver order cancellation to order-service: {}", ex.getMessage());
        }

        log.info("Driver #{} cancelled order #{}, chargeable: {}", driverId, orderId, isChargeable);

        return getDriverMetrics(driverId);
    }

    @Override
    @Transactional
    public DriverMetricsResponse getDriverMetrics(Integer driverId) {
        LocalDateTime now = LocalDateTime.now();

        // 1. Rolling Window 100 cho Acceptance Rate (AR) chuẩn PRD
        List<DriverOffer> rollingOffers = driverOfferRepository.findRollingWindowEligibleOffers(driverId, PageRequest.of(0, 100));
        long rollingOffersCount = rollingOffers.size();
        long rollingAcceptedCount = rollingOffers.stream()
                .filter(o -> List.of("ACCEPTED", "COMPLETED", "DRIVER_CANCELLED").contains(o.getStatus().toUpperCase()))
                .count();
        double acceptanceRate = rollingOffersCount == 0 ? 100.0
                : (double) Math.round((double) rollingAcceptedCount / rollingOffersCount * 10000.0) / 100.0;

        // 2. Rolling Window 100 cho Cancellation Rate (CR) chuẩn PRD
        List<DriverOffer> rollingAcceptedOrders = driverOfferRepository.findRollingWindowAcceptedOffers(driverId, PageRequest.of(0, 100));
        long rollingAcceptedOrdersCount = rollingAcceptedOrders.size();
        long rollingChargeableCancelledCount = rollingAcceptedOrders.stream()
                .filter(o -> "DRIVER_CANCELLED".equalsIgnoreCase(o.getStatus()) && Boolean.TRUE.equals(o.getCancellationChargeable()))
                .count();
        double cancellationRate = rollingAcceptedOrdersCount == 0 ? 0.0
                : (double) Math.round((double) rollingChargeableCancelledCount / rollingAcceptedOrdersCount * 10000.0) / 100.0;

        // 3. Đánh giá và tự động thi hành chế tài phạt nếu vi phạm ngưỡng AR < 80% hoặc CR > 10%
        DriverPenalty activePenalty = evaluateAndApplyPenalties(driverId, acceptanceRate, cancellationRate, now);

        // 4. Trạng thái hiệu suất tổng thể (GOOD, WARNING, DANGER)
        String performanceStatus;
        if (acceptanceRate < 80.0 || cancellationRate > 10.0 || activePenalty != null) {
            performanceStatus = "DANGER";
        } else if (acceptanceRate < 85.0 || cancellationRate > 3.0) {
            performanceStatus = "WARNING";
        } else {
            performanceStatus = "GOOD";
        }

        // 5. Thống kê toàn thời gian (hỗ trợ tương thích ngược)
        List<DriverOffer> allOffers = driverOfferRepository.findByDriverIdOrderByCreatedAtDesc(driverId);
        long totalAll = allOffers.size();
        long completedAll = allOffers.stream().filter(o -> "COMPLETED".equalsIgnoreCase(o.getStatus()) || "ACCEPTED".equalsIgnoreCase(o.getStatus())).count();
        long cancelledAll = allOffers.stream().filter(o -> "REJECTED".equalsIgnoreCase(o.getStatus()) || "DRIVER_CANCELLED".equalsIgnoreCase(o.getStatus())).count();
        double completionRate = totalAll > 0 ? (double) Math.round((double) completedAll / totalAll * 10000.0) / 100.0 : 100.0;
        double earnings = completedAll * 20000.0;

        boolean isSuspended = activePenalty != null || acceptanceRate < 80.0 || cancellationRate > 10.0;

        return DriverMetricsResponse.builder()
                .driverId(driverId)
                .totalOrders(totalAll)
                .completedOrders(completedAll)
                .cancelledOrders(cancelledAll)
                .completionRate(completionRate)
                .acceptanceRate(acceptanceRate)
                .cancellationRate(cancellationRate)
                .totalEarnings(earnings)
                .ratingAvg(5.0)
                .rollingWindowOffers(rollingOffersCount)
                .rollingWindowAccepted(rollingAcceptedCount)
                .rollingWindowCancelled(rollingChargeableCancelledCount)
                .isSuspended(isSuspended)
                .penaltyType(activePenalty != null ? activePenalty.getType() : (acceptanceRate < 80.0 ? "LOW_AR_COOLDOWN" : (cancellationRate > 10.0 ? "HIGH_CR_SUSPENSION" : null)))
                .penaltyReason(activePenalty != null ? activePenalty.getReason() : (acceptanceRate < 80.0 ? "Tỷ lệ nhận đơn AR (" + acceptanceRate + "%) dưới 80%" : (cancellationRate > 10.0 ? "Tỷ lệ hủy đơn CR (" + cancellationRate + "%) vượt 10%" : null)))
                .penaltyEndsAt(activePenalty != null ? activePenalty.getEndsAt() : null)
                .performanceStatus(performanceStatus)
                .build();
    }

    private void checkDriverSuspension(Integer driverId) {
        LocalDateTime now = LocalDateTime.now();
        List<DriverPenalty> activePenalties = driverPenaltyRepository.findActivePenalties(driverId, now);
        if (!activePenalties.isEmpty()) {
            DriverPenalty penalty = activePenalties.get(0);
            String endsAtStr = penalty.getEndsAt() != null ? penalty.getEndsAt().toString() : "Vô thời hạn";
            String msg = String.format("Tài khoản tài xế đang bị tạm khóa nhận cuốc: %s. Thời hạn mở khóa: %s",
                    penalty.getReason(), endsAtStr);
            log.warn("Blocked driver #{} from accepting order: {}", driverId, msg);
            throw new BadRequestException(msg);
        }

        // Kiểm tra nhanh AR/CR hiện tại
        DriverMetricsResponse metrics = calculateRealtimeMetrics(driverId);
        if (Boolean.TRUE.equals(metrics.getIsSuspended())) {
            throw new BadRequestException("Tài khoản tài xế đang bị tạm khóa nhận cuốc do vi phạm hiệu suất: " + metrics.getPenaltyReason());
        }
    }

    private DriverPenalty evaluateAndApplyPenalties(Integer driverId) {
        DriverMetricsResponse metrics = calculateRealtimeMetrics(driverId);
        return evaluateAndApplyPenalties(driverId, metrics.getAcceptanceRate(), metrics.getCancellationRate(), LocalDateTime.now());
    }

    private DriverPenalty evaluateAndApplyPenalties(Integer driverId, double ar, double cr, LocalDateTime now) {
        List<DriverPenalty> existingActive = driverPenaltyRepository.findActivePenalties(driverId, now);
        if (!existingActive.isEmpty()) {
            return existingActive.get(0);
        }

        // Tự động tạm khóa nếu AR < 80% (LOW_AR_COOLDOWN 15 phút)
        if (ar < 80.0) {
            DriverPenalty penalty = DriverPenalty.builder()
                    .driverId(driverId)
                    .type("LOW_AR_COOLDOWN")
                    .status("ACTIVE")
                    .reason(String.format("Tỷ lệ nhận đơn AR (%.2f%%) dưới ngưỡng tối thiểu 80%% trên rolling window 100 offer gần nhất", ar))
                    .startsAt(now)
                    .endsAt(now.plusMinutes(15))
                    .build();
            log.warn("Applying LOW_AR_COOLDOWN for driver #{}: AR = {}%", driverId, ar);
            return driverPenaltyRepository.save(penalty);
        }

        // Tự động tạm khóa nếu CR > 10% (HIGH_CR_SUSPENSION 24 giờ)
        if (cr > 10.0) {
            DriverPenalty penalty = DriverPenalty.builder()
                    .driverId(driverId)
                    .type("HIGH_CR_SUSPENSION")
                    .status("ACTIVE")
                    .reason(String.format("Tỷ lệ hủy đơn CR (%.2f%%) vượt ngưỡng tối đa 10%% trên rolling window 100 đơn nhận gần nhất", cr))
                    .startsAt(now)
                    .endsAt(now.plusHours(24))
                    .build();
            log.warn("Applying HIGH_CR_SUSPENSION for driver #{}: CR = {}%", driverId, cr);
            return driverPenaltyRepository.save(penalty);
        }

        return null;
    }

    private DriverMetricsResponse calculateRealtimeMetrics(Integer driverId) {
        List<DriverOffer> rollingOffers = driverOfferRepository.findRollingWindowEligibleOffers(driverId, PageRequest.of(0, 100));
        long rollingOffersCount = rollingOffers.size();
        long rollingAcceptedCount = rollingOffers.stream()
                .filter(o -> List.of("ACCEPTED", "COMPLETED", "DRIVER_CANCELLED").contains(o.getStatus().toUpperCase()))
                .count();
        double acceptanceRate = rollingOffersCount == 0 ? 100.0
                : (double) Math.round((double) rollingAcceptedCount / rollingOffersCount * 10000.0) / 100.0;

        List<DriverOffer> rollingAcceptedOrders = driverOfferRepository.findRollingWindowAcceptedOffers(driverId, PageRequest.of(0, 100));
        long rollingAcceptedOrdersCount = rollingAcceptedOrders.size();
        long rollingChargeableCancelledCount = rollingAcceptedOrders.stream()
                .filter(o -> "DRIVER_CANCELLED".equalsIgnoreCase(o.getStatus()) && Boolean.TRUE.equals(o.getCancellationChargeable()))
                .count();
        double cancellationRate = rollingAcceptedOrdersCount == 0 ? 0.0
                : (double) Math.round((double) rollingChargeableCancelledCount / rollingAcceptedOrdersCount * 10000.0) / 100.0;

        boolean isSuspended = acceptanceRate < 80.0 || cancellationRate > 10.0;

        return DriverMetricsResponse.builder()
                .driverId(driverId)
                .acceptanceRate(acceptanceRate)
                .cancellationRate(cancellationRate)
                .rollingWindowOffers(rollingOffersCount)
                .rollingWindowAccepted(rollingAcceptedCount)
                .rollingWindowCancelled(rollingChargeableCancelledCount)
                .isSuspended(isSuspended)
                .penaltyReason(acceptanceRate < 80.0 ? "AR (" + acceptanceRate + "%) < 80%" : (cancellationRate > 10.0 ? "CR (" + cancellationRate + "%) > 10%" : null))
                .build();
    }
}

