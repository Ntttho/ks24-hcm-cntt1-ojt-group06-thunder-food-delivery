package com.foodthunder.payment.controller;

import com.foodthunder.common.dto.payment.*;
import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * API 1: Tạo URL thanh toán qua cổng VNPay Sandbox
     * POST /api/v1/payments/vnpay/create-url
     */
    @PostMapping({ "/vnpay/create-url", "/vnpay-url" })
    public ResponseEntity<ApiResponse<VnPayPaymentUrlResponse>> createVnPayUrl(
            @Valid @RequestBody VnPayPaymentUrlRequest request,
            HttpServletRequest servletRequest) {
        String clientIp = extractClientIp(servletRequest);
        log.info("Request create VNPay URL for orderId: {}, clientIp: {}", request.getOrderId(), clientIp);
        VnPayPaymentUrlResponse response = paymentService.createVnPayPaymentUrl(request, clientIp);
        return ResponseEntity.ok(ApiResponse.success("Khởi tạo URL thanh toán VNPay thành công", response));
    }

    /**
     * API 2: Nhận kết quả điều hướng người dùng quay lại từ VNPay (Return URL)
     * GET /api/v1/payments/vnpay/return hoặc /vnpay/callback
     */
    @GetMapping({ "/vnpay/return", "/vnpay/callback" })
    public ResponseEntity<ApiResponse<VnPayCallbackDto>> handleVnPayCallback(
            @RequestParam Map<String, String> allParams) {
        log.info("Received VNPay return callback with {} parameters", allParams.size());
        VnPayCallbackDto callbackDto = paymentService.processVnPayCallback(allParams);
        if ("00".equals(callbackDto.getVnp_ResponseCode())) {
            return ResponseEntity.ok(ApiResponse.success("Thanh toán đơn hàng thành công qua VNPay", callbackDto));
        } else {
            return ResponseEntity
                    .ok(ApiResponse.success("Giao dịch không thành công hoặc đã bị hủy bởi người dùng", callbackDto));
        }
    }

    /**
     * API 3: Webhook IPN xử lý thông báo ngầm từ máy chủ VNPay (Server-to-Server)
     * GET /api/v1/payments/vnpay/ipn
     */
    @GetMapping("/vnpay/ipn")
    public ResponseEntity<VnPayIpnResponse> handleVnPayIpn(
            @RequestParam Map<String, String> allParams) {
        log.info("Received VNPay IPN webhook call");
        VnPayIpnResponse ipnResponse = paymentService.processVnPayIpn(allParams);
        return ResponseEntity.ok(ipnResponse);
    }

    /**
     * API 4: Khởi tạo thanh toán COD (Tiền mặt khi nhận hàng)
     * POST /api/v1/payments/cod
     */
    @PostMapping("/cod")
    public ResponseEntity<ApiResponse<PaymentResponseDto>> createCodPayment(
            @Valid @RequestBody PaymentInitiateRequest request) {
        log.info("Creating COD payment record for orderId: {}", request.getOrderId());
        PaymentResponseDto response = paymentService.createCodPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Khởi tạo thanh toán tiền mặt (COD) thành công", response));
    }

    /**
     * API 5: Lấy thông tin thanh toán theo mã đơn hàng
     * GET /api/v1/payments/order/{orderId}
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<PaymentResponseDto>> getPaymentByOrderId(
            @PathVariable Long orderId) {
        PaymentResponseDto response = paymentService.getPaymentByOrderId(orderId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin thanh toán thành công", response));
    }

    private String extractClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
