package com.foodthunder.delivery.service;

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
     * Tài xế từ chối cuốc xe.
     */
    void rejectOrder(Integer driverId, Long orderId, String reason);

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
}
