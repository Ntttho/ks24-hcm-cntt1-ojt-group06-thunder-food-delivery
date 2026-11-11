package com.foodthunder.delivery.controller;

import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.delivery.dto.request.DriverCancelOrderRequest;
import com.foodthunder.delivery.dto.request.DriverLocationRequest;
import com.foodthunder.delivery.dto.request.UpdateDeliveryStepRequest;
import com.foodthunder.delivery.dto.response.*;
import com.foodthunder.delivery.service.DeliveryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/deliveries", "/api/v1/delivery", "/api/v1/shippers", "/api/v1/drivers"})
@RequiredArgsConstructor
@Slf4j
public class DeliveryController {

    private final DeliveryService deliveryService;

    /**
     * Tài xế bấm nhận đơn hàng.
     * Sử dụng Khóa Bi Quan (Pessimistic Locking - SELECT ... FOR UPDATE) chống Race Condition.
     */
    @PostMapping("/orders/{orderId}/accept")
    public ResponseEntity<ApiResponse<AcceptOrderResponse>> acceptOrder(
            @PathVariable Long orderId,
            @RequestHeader(value = "X-User-Id", defaultValue = "2") Integer driverId) {
        log.info("REST request to accept order #{} by driver #{}", orderId, driverId);
        AcceptOrderResponse res = deliveryService.acceptOrder(driverId, orderId);
        return ResponseEntity.ok(ApiResponse.success("Nhận đơn hàng thành công!", res));
    }

    /**
     * Tài xế từ chối cuốc xe.
     */
    @PostMapping("/orders/{orderId}/reject")
    public ResponseEntity<ApiResponse<String>> rejectOrder(
            @PathVariable Long orderId,
            @RequestParam(required = false, defaultValue = "Tài xế bận") String reason,
            @RequestHeader(value = "X-User-Id", defaultValue = "2") Integer driverId) {
        log.info("REST request to reject order #{} by driver #{}", orderId, driverId);
        deliveryService.rejectOrder(driverId, orderId, reason);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối đơn hàng thành công", "REJECTED"));
    }

    /**
     * Tài xế hủy nhận đơn sau khi đã tiếp nhận (Driver Cancel / Trả đơn).
     * Cập nhật chỉ số Cancellation Rate (CR) và tự động phạt nếu CR > 10%.
     */
    @PostMapping({"/orders/{orderId}/cancel", "/orders/{orderId}/driver-cancel"})
    public ResponseEntity<ApiResponse<DriverMetricsResponse>> cancelOrder(
            @PathVariable Long orderId,
            @Valid @RequestBody DriverCancelOrderRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "2") Integer driverId) {
        log.info("REST request to cancel accepted order #{} by driver #{}", orderId, driverId);
        DriverMetricsResponse res = deliveryService.cancelOrder(driverId, orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Hủy nhận đơn và trả về hệ thống thành công", res));
    }

    /**
     * Bật / tắt chế độ nhận cuốc trực tuyến (Online/Offline).
     */
    @PutMapping("/driver/toggle-online")
    public ResponseEntity<ApiResponse<DriverStatusResponse>> toggleOnline(
            @RequestHeader(value = "X-User-Id", defaultValue = "2") Integer driverId) {
        DriverStatusResponse res = deliveryService.toggleOnline(driverId);
        String msg = Boolean.TRUE.equals(res.getIsOnline())
                ? "Tài xế đã chuyển sang trạng thái TRỰC TUYẾN (Sẵn sàng nhận đơn)"
                : "Tài xế đã chuyển sang trạng thái NGOẠI TUYẾN (Nghỉ ngơi)";
        return ResponseEntity.ok(ApiResponse.success(msg, res));
    }

    /**
     * Lấy thông tin trạng thái hoạt động của tài xế.
     */
    @GetMapping("/driver/status")
    public ResponseEntity<ApiResponse<DriverStatusResponse>> getDriverStatus(
            @RequestHeader(value = "X-User-Id", defaultValue = "2") Integer driverId) {
        DriverStatusResponse res = deliveryService.getDriverStatus(driverId);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    /**
     * Cập nhật vị trí GPS thời gian thực của tài xế.
     */
    @PostMapping("/location")
    public ResponseEntity<ApiResponse<DriverLocationResponse>> updateLocation(
            @Valid @RequestBody DriverLocationRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "2") Integer driverId) {
        DriverLocationResponse res = deliveryService.updateLocation(driverId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created("Cập nhật vị trí thành công", res));
    }

    /**
     * Tra cứu vị trí hiện tại mới nhất của tài xế theo driverId.
     */
    @GetMapping("/driver/{driverId}/location")
    public ResponseEntity<ApiResponse<DriverLocationResponse>> getDriverLocation(@PathVariable Integer driverId) {
        DriverLocationResponse res = deliveryService.getCurrentLocation(driverId);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    /**
     * Tra cứu vị trí shipper đang giao đơn hàng theo orderId (Dành cho Quán & Khách hàng).
     */
    @GetMapping("/orders/{orderId}/location")
    public ResponseEntity<ApiResponse<DriverLocationResponse>> getOrderDriverLocation(@PathVariable Long orderId) {
        DriverLocationResponse res = deliveryService.getOrderDriverLocation(orderId);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    /**
     * Lấy danh sách cuốc xe đang chờ tài xế xác nhận (hỗ trợ cả /offers và /available).
     */
    @GetMapping({"/offers", "/available", "/available-orders"})
    public ResponseEntity<ApiResponse<List<DriverOfferResponse>>> getPendingOffers(
            @RequestHeader(value = "X-User-Id", defaultValue = "2") Integer driverId) {
        List<DriverOfferResponse> res = deliveryService.getPendingOffers(driverId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cuốc xe thành công", res));
    }

    /**
     * Cập nhật các bước giao hàng tiếp theo (PICKING_UP, DELIVERING, COMPLETED).
     * Hỗ trợ cả POST và PUT, cả /step và /status.
     */
    @RequestMapping(value = {"/orders/{orderId}/step", "/orders/{orderId}/status"}, method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<ApiResponse<String>> updateDeliveryStep(
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateDeliveryStepRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "2") Integer driverId) {
        deliveryService.updateDeliveryStep(driverId, orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tiến trình giao hàng thành công", request.getStep()));
    }

    /**
     * Thống kê hiệu suất và thu nhập của tài xế (hỗ trợ /metrics, /earnings, /me/metrics).
     */
    @GetMapping({"/metrics", "/earnings", "/me/metrics"})
    public ResponseEntity<ApiResponse<DriverMetricsResponse>> getDriverMetrics(
            @RequestHeader(value = "X-User-Id", defaultValue = "2") Integer driverId) {
        DriverMetricsResponse res = deliveryService.getDriverMetrics(driverId);
        return ResponseEntity.ok(ApiResponse.success("Thống kê tài xế thành công", res));
    }
}
