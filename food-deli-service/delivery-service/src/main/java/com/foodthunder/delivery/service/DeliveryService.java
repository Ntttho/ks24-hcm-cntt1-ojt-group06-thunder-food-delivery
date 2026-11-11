package com.foodthunder.delivery.service;

import com.foodthunder.delivery.dto.request.DriverCancelOrderRequest;
import com.foodthunder.delivery.dto.request.DriverLocationRequest;
import com.foodthunder.delivery.dto.request.UpdateDeliveryStepRequest;
import com.foodthunder.delivery.dto.response.*;

import java.util.List;

public interface DeliveryService {

    /**
     * Tài xế bấm nhận đơn hàng.
     * Sử dụng Pessimistic Locking (SELECT ... FOR UPDATE) để chống Race Condition.
     */
    AcceptOrderResponse acceptOrder(Integer driverId, Long orderId);

    /**
     * Tài xế từ chối cuốc xe (khi đang ở bước nhận lời mời - OFFERED).
     */
    void rejectOrder(Integer driverId, Long orderId, String reason);

    /**
     * Tài xế hủy nhận đơn sau khi đã tiếp nhận (Driver Cancel / Trả đơn).
     * Cập nhật chỉ số Cancellation Rate (CR) và tự động phạt nếu CR > 10%.
     */
    DriverMetricsResponse cancelOrder(Integer driverId, Long orderId, DriverCancelOrderRequest request);

    /**
     * Bật/tắt trạng thái trực tuyến nhận cuốc.
     */
    DriverStatusResponse toggleOnline(Integer driverId);

    /**
     * Lấy thông tin trạng thái tài xế.
     */
    DriverStatusResponse getDriverStatus(Integer driverId);

    /**
     * Cập nhật tọa độ GPS định vị.
     */
    DriverLocationResponse updateLocation(Integer driverId, DriverLocationRequest request);

    /**
     * Lấy tọa độ mới nhất của tài xế.
     */
    DriverLocationResponse getCurrentLocation(Integer driverId);

    /**
     * Lấy tọa độ tài xế đang giao đơn hàng cụ thể.
     */
    DriverLocationResponse getOrderDriverLocation(Long orderId);

    /**
     * Lấy danh sách cuốc xe đang chờ phản hồi của tài xế.
     */
    List<DriverOfferResponse> getPendingOffers(Integer driverId);

    /**
     * Cập nhật các bước giao hàng tiếp theo (PICKING_UP, DELIVERING, COMPLETED).
     */
    void updateDeliveryStep(Integer driverId, Long orderId, UpdateDeliveryStepRequest request);

    /**
     * Thống kê hiệu suất và thu nhập của tài xế.
     */
    DriverMetricsResponse getDriverMetrics(Integer driverId);

    /**
     * SP3-ADM-02: Lấy danh sách hồ sơ tài xế chờ duyệt hoặc lọc theo trạng thái.
     */
    List<DriverApprovalDto> getDriverApprovals(String status);

    /**
     * SP3-ADM-02: Lấy chi tiết hồ sơ tài xế theo userId.
     */
    DriverApprovalDto getDriverApprovalDetail(Integer userId);

    /**
     * SP3-ADM-02: Phê duyệt hồ sơ tài xế (APPROVED).
     */
    DriverApprovalDto approveDriver(Integer userId);

    /**
     * SP3-ADM-02: Từ chối hồ sơ tài xế (REJECTED) kèm lý do.
     */
    DriverApprovalDto rejectDriver(Integer userId, String rejectReason);

    /**
     * Đăng ký hoặc cập nhật hồ sơ xe / CCCD cho tài xế.
     */
    DriverApprovalDto registerOrUpdateDriver(Integer userId, com.foodthunder.delivery.dto.request.DriverRegistrationRequest request);
}

