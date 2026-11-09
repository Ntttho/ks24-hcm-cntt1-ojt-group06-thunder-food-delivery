package com.foodthunder.payment.controller;

import com.foodthunder.common.dto.payment.PaymentResponseDto;
import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.payment.dto.request.SepayGenerateRequest;
import com.foodthunder.payment.dto.request.VietQrGenerateRequest;
import com.foodthunder.payment.dto.response.SepayGenerateResponse;
import com.foodthunder.payment.dto.response.VietQrGenerateResponse;
import com.foodthunder.payment.dto.webhook.SepayWebhookPayload;
import com.foodthunder.payment.dto.webhook.VietQrWebhookPayload;
import com.foodthunder.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Sinh mã QR SePay (tích hợp VietQR Napas 247) kèm cú pháp định danh đơn hàng và số tiền
     */
    @PostMapping("/sepay/generate")
    public ResponseEntity<ApiResponse<SepayGenerateResponse>> generateSepayQr(
            @Valid @RequestBody SepayGenerateRequest request) {
        log.info("API POST /api/v1/payments/sepay/generate cho orderId={}", request.getOrderId());
        SepayGenerateResponse response = paymentService.generateSepayQr(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo mã QR SePay thành công", response));
    }

    /**
     * Webhook tiếp nhận biến động số dư chuyển khoản tự động từ SePay
     */
    @PostMapping("/sepay/webhook")
    public ResponseEntity<ApiResponse<Void>> handleSepayWebhook(
            @RequestBody SepayWebhookPayload payload,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        log.info("API POST /api/v1/payments/sepay/webhook");
        ApiResponse<Void> response = paymentService.handleSepayWebhook(payload, authorizationHeader);
        return ResponseEntity.ok(response);
    }

    /**
     * Tương thích ngược: Sinh mã VietQR endpoint cũ
     */
    @PostMapping("/vietqr/generate")
    public ResponseEntity<ApiResponse<VietQrGenerateResponse>> generateVietQr(
            @Valid @RequestBody VietQrGenerateRequest request) {
        log.info("API POST /api/v1/payments/vietqr/generate cho orderId={}", request.getOrderId());
        VietQrGenerateResponse response = paymentService.generateVietQr(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo mã VietQR thành công", response));
    }

    /**
     * Tương thích ngược: Webhook VietQR endpoint cũ
     */
    @PostMapping("/vietqr/webhook")
    public ResponseEntity<ApiResponse<Void>> handleVietQrWebhook(
            @RequestBody VietQrWebhookPayload payload,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        log.info("API POST /api/v1/payments/vietqr/webhook");
        ApiResponse<Void> response = paymentService.handleVietQrWebhook(payload, authorizationHeader);
        return ResponseEntity.ok(response);
    }

    /**
     * Tra cứu trạng thái thanh toán của đơn hàng (dành cho Polling phía Client khi đang mở modal QR)
     */
    @GetMapping("/orders/{orderId}/status")
    public ResponseEntity<ApiResponse<PaymentResponseDto>> getPaymentStatus(
            @PathVariable("orderId") Long orderId) {
        PaymentResponseDto dto = paymentService.checkPaymentStatus(orderId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    /**
     * Khởi tạo giao dịch thanh toán tiền mặt (COD)
     */
    @PostMapping("/cod")
    public ResponseEntity<ApiResponse<PaymentResponseDto>> createCodPayment(
            @RequestParam("orderId") Long orderId,
            @RequestParam("amount") BigDecimal amount,
            @RequestParam(value = "idempotencyKey", required = false) String idempotencyKey) {
        log.info("API POST /api/v1/payments/cod cho orderId={}", orderId);
        PaymentResponseDto dto = paymentService.createCodPayment(orderId, amount, idempotencyKey);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Khởi tạo thanh toán COD thành công", dto));
    }
}
