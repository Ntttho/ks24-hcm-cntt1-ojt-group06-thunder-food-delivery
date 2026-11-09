package com.foodthunder.delivery.controller;

import com.foodthunder.common.dto.response.ApiResponse;
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
@RequestMapping("/api/v1/deliveries")
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
     * Lấy danh sách cuốc xe đang chờ tài xế xác nhận.
     */
    @GetMapping("/offers")
    public ResponseEntity<ApiResponse<List<DriverOfferResponse>>> getPendingOffers(
            @RequestHeader(value = "X-User-Id", defaultValue = "2") Integer driverId) {
        List<DriverOfferResponse> res = deliveryService.getPendingOffers(driverId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cuốc xe thành công", res));
    }

    /**
     * Cập nhật các bước giao hàng tiếp theo (PICKING_UP, DELIVERING, COMPLETED).
     * Hỗ trợ cả POST và PUT.
     */
    @RequestMapping(value = "/orders/{orderId}/step", method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<ApiResponse<String>> updateDeliveryStep(
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateDeliveryStepRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "2") Integer driverId) {
        deliveryService.updateDeliveryStep(driverId, orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tiến trình giao hàng thành công", request.getStep()));
    }
}
