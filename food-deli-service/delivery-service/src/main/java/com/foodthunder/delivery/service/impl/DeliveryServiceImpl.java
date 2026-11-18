package com.foodthunder.delivery.service.impl;

import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.delivery.client.NotificationClient;
import com.foodthunder.delivery.client.OrderClient;
import com.foodthunder.delivery.client.UserClient;
import com.foodthunder.delivery.dto.client.RemoteUpdateOrderStatusRequest;
import com.foodthunder.delivery.dto.client.RemoteUserDto;
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
    private final NotificationClient notificationClient;
    private final UserClient userClient;

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
            DriverDetail dDetail = driverDetailRepository.findById(driverId).orElse(null);
            String driverName = (dDetail != null && dDetail.getFullName() != null && !dDetail.getFullName().isBlank())
                    ? dDetail.getFullName().trim() : null;
            String driverPhone = (dDetail != null && dDetail.getPhoneNumber() != null && !dDetail.getPhoneNumber().isBlank())
                    ? dDetail.getPhoneNumber().trim() : null;

            if ((driverName == null || driverPhone == null) && driverId != null) {
                try {
                    ResponseEntity<ApiResponse<RemoteUserDto>> uRes = userClient.getUserById(Long.valueOf(driverId));
                    if (uRes != null && uRes.getBody() != null && uRes.getBody().data() != null) {
                        RemoteUserDto uData = uRes.getBody().data();
                        if (driverName == null && uData.getFullName() != null && !uData.getFullName().isBlank()) {
                            driverName = uData.getFullName().trim();
                            if (dDetail != null) dDetail.setFullName(driverName);
                        }
                        if (driverPhone == null && uData.getPhone() != null && !uData.getPhone().isBlank()) {
                            driverPhone = uData.getPhone().trim();
                            if (dDetail != null) dDetail.setPhoneNumber(driverPhone);
                        }
                        if (dDetail != null && (dDetail.getEmail() == null || dDetail.getEmail().isBlank()) && uData.getEmail() != null) {
                            dDetail.setEmail(uData.getEmail().trim());
                        }
                        if (dDetail != null) {
                            driverDetailRepository.save(dDetail);
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Could not fetch user profile from auth-service for driverId {}: {}", driverId, ex.getMessage());
                }
            }

            if (driverName == null || driverName.isBlank()) {
                driverName = "Tài xế #" + driverId;
            }
            if (driverPhone == null || driverPhone.isBlank()) {
                driverPhone = "090000000" + driverId;
            }

            RemoteUpdateOrderStatusRequest statusReq = RemoteUpdateOrderStatusRequest.builder()
                    .statusCode("DRIVER_ACCEPTED")
                    .reason("Tài xế " + driverName + " đã nhận đơn giao hàng")
                    .driverName(driverName)
                    .driverPhone(driverPhone)
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
                .orElseThrow(() -> new BadRequestException("Hồ sơ tài xế chưa được tạo hoặc chưa hoàn tất thủ tục đăng ký. Vui lòng liên hệ Admin!"));

        if (driver.getApprovalStatus() == null || !"APPROVED".equalsIgnoreCase(driver.getApprovalStatus())) {
            throw new BadRequestException("Hồ sơ tài xế của bạn đang ở trạng thái '" 
                    + (driver.getApprovalStatus() != null ? driver.getApprovalStatus() : "PENDING")
                    + "'. Bạn chỉ có thể bật trực tuyến sau khi được Ban Quản Trị phê duyệt!");
        }

        checkDriverSuspension(driverId);

        driver.setIsOnline(!Boolean.TRUE.equals(driver.getIsOnline()));
        driverDetailRepository.save(driver);

        log.info("Driver #{} toggled online status to: {}", driverId, driver.getIsOnline());
        return mapToDriverStatusResponse(driver);
    }

    @Override
    public DriverStatusResponse getDriverStatus(Integer driverId) {
        return driverDetailRepository.findById(driverId)
                .map(this::mapToDriverStatusResponse)
                .orElseGet(() -> DriverStatusResponse.builder()
                        .userId(driverId)
                        .approvalStatus("NOT_REGISTERED")
                        .isOnline(false)
                        .licensePlate(null)
                        .idCardNumber(null)
                        .vehicleType("Xe máy (Motorbike)")
                        .rejectReason(null)
                        .build());
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
        DriverLocationResponse response = mapToDriverLocationResponse(saved);

        // Realtime WebSocket broadcast to customer live tracking: /topic/orders/{orderId}/location
        if (request.getOrderId() != null && notificationClient != null) {
            try {
                String topic = "/topic/orders/" + request.getOrderId() + "/location";
                notificationClient.broadcastEvent(new NotificationClient.BroadcastRequest(topic, response));
                log.debug("Broadcasted live driver location to topic {}", topic);
            } catch (Exception ex) {
                log.warn("Failed to broadcast driver location via WebSocket: {}", ex.getMessage());
            }
        }

        return response;
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
        // 1. Kiểm tra trạng thái phê duyệt của tài xế
        DriverDetail driver = driverDetailRepository.findById(driverId).orElse(null);
        if (driver == null || driver.getApprovalStatus() == null || !"APPROVED".equalsIgnoreCase(driver.getApprovalStatus())) {
            log.info("Driver #{} is not approved yet (status: {}), returning empty offers list",
                    driverId, driver != null ? driver.getApprovalStatus() : "NOT_FOUND");
            return Collections.emptyList();
        }

        // 2. Nếu tài xế đang bị tạm khóa nhận cuốc (AR < 80% hoặc CR > 10%), không hiển thị đơn mới
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

        if (!"ACCEPTED".equalsIgnoreCase(offer.getStatus())
                && !"DELIVERING".equalsIgnoreCase(offer.getStatus())
                && !"PICKING_UP".equalsIgnoreCase(offer.getStatus())) {
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

        // 3. Khắc phục BUG-02: Cập nhật trạng thái offer nội bộ khi hoàn tất hoặc giao hàng
        if ("COMPLETED".equalsIgnoreCase(targetStep)) {
            offer.setStatus("COMPLETED");
            offer.setRespondedAt(LocalDateTime.now());
            driverOfferRepository.save(offer);
            log.info("Driver #{} completed order #{}, offer status updated to COMPLETED", driverId, orderId);
        } else if ("DELIVERING".equalsIgnoreCase(targetStep)) {
            offer.setStatus("DELIVERING");
            driverOfferRepository.save(offer);
        }

        // 4. Nếu có gửi kèm tọa độ thì ghi nhận vào driver_locations và broadcast WebSocket sang khách hàng
        if (request.getCurrentLat() != null && request.getCurrentLng() != null) {
            DriverLocation location = DriverLocation.builder()
                    .driverId(driverId)
                    .orderId(orderId)
                    .latitude(request.getCurrentLat())
                    .longitude(request.getCurrentLng())
                    .speedKmh(24.0)
                    .build();
            DriverLocation savedLoc = driverLocationRepository.save(location);

            if (notificationClient != null) {
                try {
                    String topic = "/topic/orders/" + orderId + "/location";
                    notificationClient.broadcastEvent(new NotificationClient.BroadcastRequest(topic, mapToDriverLocationResponse(savedLoc)));
                    log.debug("Broadcasted updated delivery step driver location to topic {}", topic);
                } catch (Exception ex) {
                    log.warn("Failed to broadcast location on step update: {}", ex.getMessage());
                }
            }
        }

        log.info("Driver #{} updated delivery step for order #{} to {}", driverId, orderId, targetStep);
    }

    private DriverStatusResponse mapToDriverStatusResponse(DriverDetail d) {
        return DriverStatusResponse.builder()
                .userId(d.getUserId())
                .licensePlate(d.getLicensePlate())
                .idCardNumber(d.getIdCardNumber())
                .vehicleType(d.getVehicleType())
                .approvalStatus(d.getApprovalStatus())
                .rejectReason(d.getRejectReason())
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
        String orderCode = "ORD-" + o.getOrderId();
        String restaurantName = "Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi";
        String restaurantAddress = "123 Nguyễn Trãi, Phường 2, Quận 5, TP.HCM";
        String restaurantPhone = "02838383838";
        String customerName = "Khách hàng";
        String customerPhone = "0987654321";
        String receiverAddress = "Địa chỉ giao hàng";
        java.math.BigDecimal totalAmount = java.math.BigDecimal.valueOf(100000);
        String paymentMethod = "COD";

        if (orderClient != null && o.getOrderId() != null) {
            try {
                var resp = orderClient.getOrderById(o.getOrderId());
                if (resp != null && resp.getBody() != null && resp.getBody().data() != null) {
                    var ord = resp.getBody().data();
                    if (ord.getOrderCode() != null) orderCode = ord.getOrderCode();
                    if (ord.getRestaurantName() != null) restaurantName = ord.getRestaurantName();
                    if (ord.getRestaurantAddress() != null) restaurantAddress = ord.getRestaurantAddress();
                    if (ord.getRestaurantPhone() != null) restaurantPhone = ord.getRestaurantPhone();
                    if (ord.getCustomerName() != null) customerName = ord.getCustomerName();
                    if (ord.getCustomerPhone() != null) customerPhone = ord.getCustomerPhone();
                    if (ord.getReceiverAddress() != null) receiverAddress = ord.getReceiverAddress();
                    if (ord.getTotalAmount() != null) totalAmount = ord.getTotalAmount();
                    if (ord.getPaymentMethod() != null) paymentMethod = ord.getPaymentMethod();
                }
            } catch (Exception ex) {
                log.warn("Could not enrich DriverOfferResponse from orderClient for orderId {}: {}", o.getOrderId(), ex.getMessage());
            }
        }

        return DriverOfferResponse.builder()
                .id(o.getId())
                .orderId(o.getOrderId())
                .orderCode(orderCode)
                .driverId(o.getDriverId())
                .status(o.getStatus())
                .restaurantName(restaurantName)
                .restaurantAddress(restaurantAddress)
                .restaurantPhone(restaurantPhone)
                .customerName(customerName)
                .customerPhone(customerPhone)
                .receiverAddress(receiverAddress)
                .totalAmount(totalAmount)
                .paymentMethod(paymentMethod)
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
        List<DriverOffer> offers = driverOfferRepository.findAllByOrderIdForUpdate(orderId);
        DriverOffer offer = offers.stream()
                .filter(o -> o.getDriverId().equals(driverId))
                .findFirst()
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
        long completedAll = allOffers.stream().filter(o -> "COMPLETED".equalsIgnoreCase(o.getStatus())).count();
        long cancelledAll = allOffers.stream().filter(o -> "REJECTED".equalsIgnoreCase(o.getStatus()) || "DRIVER_CANCELLED".equalsIgnoreCase(o.getStatus())).count();
        double completionRate = totalAll > 0 ? (double) Math.round((double) completedAll / totalAll * 10000.0) / 100.0 : 100.0;
        double earnings = completedAll * 20000.0;

        boolean isSuspended = activePenalty != null || acceptanceRate < 80.0 || cancellationRate > 10.0;

        double ratingAvg = 5.0;
        try {
            ResponseEntity<ApiResponse<RemoteUserDto>> userResp = userClient.getUserById(driverId.longValue());
            if (userResp != null && userResp.getBody() != null && userResp.getBody().data() != null) {
                RemoteUserDto userDto = userResp.getBody().data();
                if (userDto.getRatingAvg() != null) {
                    ratingAvg = userDto.getRatingAvg().doubleValue();
                }
            }
        } catch (Exception ex) {
            log.warn("Failed to fetch driver rating for driverId={}: {}", driverId, ex.getMessage());
        }

        return DriverMetricsResponse.builder()
                .driverId(driverId)
                .totalOrders(totalAll)
                .completedOrders(completedAll)
                .cancelledOrders(cancelledAll)
                .completionRate(completionRate)
                .acceptanceRate(acceptanceRate)
                .cancellationRate(cancellationRate)
                .totalEarnings(earnings)
                .ratingAvg(ratingAvg)
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

    @Override
    @Transactional(readOnly = true)
    public List<DriverApprovalDto> getDriverApprovals(String status) {
        List<DriverDetail> list;
        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status.trim())) {
            list = driverDetailRepository.findByApprovalStatusOrderByUserIdDesc(status.trim().toUpperCase());
        } else {
            list = driverDetailRepository.findAllByOrderByUserIdDesc();
        }
        return list.stream()
                .map(this::mapToDriverApprovalDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DriverApprovalDto getDriverApprovalDetail(Integer userId) {
        DriverDetail detail = driverDetailRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài xế với ID: " + userId));
        return mapToDriverApprovalDto(detail);
    }

    @Override
    @Transactional
    public DriverApprovalDto approveDriver(Integer userId) {
        DriverDetail detail = driverDetailRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài xế với ID: " + userId));

        detail.setApprovalStatus("APPROVED");
        detail.setRejectReason(null);
        DriverDetail saved = driverDetailRepository.save(detail);
        log.info("Admin đã phê duyệt tài xế #{}", userId);
        return mapToDriverApprovalDto(saved);
    }

    @Override
    @Transactional
    public DriverApprovalDto rejectDriver(Integer userId, String rejectReason) {
        DriverDetail detail = driverDetailRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài xế với ID: " + userId));

        detail.setApprovalStatus("REJECTED");
        detail.setRejectReason(rejectReason != null ? rejectReason : "Hồ sơ không đáp ứng điều kiện sàn");
        DriverDetail saved = driverDetailRepository.save(detail);
        log.info("Admin đã từ chối tài xế #{}, lý do: {}", userId, rejectReason);
        return mapToDriverApprovalDto(saved);
    }

    @Override
    @Transactional
    public DriverApprovalDto registerOrUpdateDriver(Integer userId, com.foodthunder.delivery.dto.request.DriverRegistrationRequest request) {
        DriverDetail detail = driverDetailRepository.findByUserId(userId)
                .orElseGet(() -> DriverDetail.builder()
                        .userId(userId)
                        .approvalStatus("PENDING")
                        .isOnline(false)
                        .build());

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            detail.setFullName(request.getFullName().trim());
        }
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
            detail.setPhoneNumber(request.getPhoneNumber().trim());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            detail.setEmail(request.getEmail().trim());
        }
        if (detail.getFullName() == null || detail.getFullName().isBlank()
                || detail.getPhoneNumber() == null || detail.getPhoneNumber().isBlank()
                || detail.getEmail() == null || detail.getEmail().isBlank()) {
            enrichProfileFromAuth(detail, userId);
        }
        if (request.getLicensePlate() != null && !request.getLicensePlate().isBlank()) {
            detail.setLicensePlate(request.getLicensePlate().trim());
        }
        if (request.getIdCardNumber() != null && !request.getIdCardNumber().isBlank()) {
            detail.setIdCardNumber(request.getIdCardNumber().trim());
        }
        if (request.getVehicleType() != null && !request.getVehicleType().isBlank()) {
            detail.setVehicleType(request.getVehicleType().trim());
        }
        detail.setApprovalStatus("PENDING");
        detail.setRejectReason(null);

        DriverDetail saved = driverDetailRepository.save(detail);
        return mapToDriverApprovalDto(saved);
    }

    private void enrichProfileFromAuth(DriverDetail detail, Integer userId) {
        if (userId == null) return;
        try {
            ResponseEntity<ApiResponse<RemoteUserDto>> uRes = userClient.getUserById(Long.valueOf(userId));
            if (uRes != null && uRes.getBody() != null && uRes.getBody().data() != null) {
                RemoteUserDto uData = uRes.getBody().data();
                if ((detail.getFullName() == null || detail.getFullName().isBlank()) && uData.getFullName() != null && !uData.getFullName().isBlank()) {
                    detail.setFullName(uData.getFullName().trim());
                }
                if ((detail.getPhoneNumber() == null || detail.getPhoneNumber().isBlank()) && uData.getPhone() != null && !uData.getPhone().isBlank()) {
                    detail.setPhoneNumber(uData.getPhone().trim());
                }
                if ((detail.getEmail() == null || detail.getEmail().isBlank()) && uData.getEmail() != null && !uData.getEmail().isBlank()) {
                    detail.setEmail(uData.getEmail().trim());
                }
            }
        } catch (Exception ex) {
            log.warn("Could not enrich driver profile from auth-service for userId {}: {}", userId, ex.getMessage());
        }
    }

    private DriverApprovalDto mapToDriverApprovalDto(DriverDetail detail) {
        String fullName = detail.getFullName();
        String phoneNumber = detail.getPhoneNumber();
        String email = detail.getEmail();

        if ((fullName == null || fullName.isBlank() || phoneNumber == null || phoneNumber.isBlank() || email == null || email.isBlank())
                && detail.getUserId() != null) {
            try {
                ResponseEntity<ApiResponse<RemoteUserDto>> uRes = userClient.getUserById(Long.valueOf(detail.getUserId()));
                if (uRes != null && uRes.getBody() != null && uRes.getBody().data() != null) {
                    RemoteUserDto uData = uRes.getBody().data();
                    if ((fullName == null || fullName.isBlank()) && uData.getFullName() != null && !uData.getFullName().isBlank()) {
                        fullName = uData.getFullName().trim();
                    }
                    if ((phoneNumber == null || phoneNumber.isBlank()) && uData.getPhone() != null && !uData.getPhone().isBlank()) {
                        phoneNumber = uData.getPhone().trim();
                    }
                    if ((email == null || email.isBlank()) && uData.getEmail() != null && !uData.getEmail().isBlank()) {
                        email = uData.getEmail().trim();
                    }
                }
            } catch (Exception ex) {
                log.warn("Could not enrich mapToDriverApprovalDto for userId {}: {}", detail.getUserId(), ex.getMessage());
            }
        }

        if (fullName == null || fullName.isBlank()) {
            fullName = "Tài xế #" + detail.getUserId();
        }
        if (phoneNumber == null || phoneNumber.isBlank()) {
            phoneNumber = "090000000" + detail.getUserId();
        }
        if (email == null || email.isBlank()) {
            email = "driver." + detail.getUserId() + "@foodthunder.com";
        }

        return DriverApprovalDto.builder()
                .userId(detail.getUserId())
                .fullName(fullName)
                .phoneNumber(phoneNumber)
                .email(email)
                .avatarUrl("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150")
                .licensePlate(detail.getLicensePlate())
                .idCardNumber(detail.getIdCardNumber())
                .vehicleType(detail.getVehicleType() != null ? detail.getVehicleType() : "Xe máy (Motorbike)")
                .approvalStatus(detail.getApprovalStatus() != null ? detail.getApprovalStatus() : "PENDING")
                .rejectReason(detail.getRejectReason())
                .isOnline(detail.getIsOnline())
                .build();
    }
}

