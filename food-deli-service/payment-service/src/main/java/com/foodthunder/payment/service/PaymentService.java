package com.foodthunder.payment.service;

import com.foodthunder.common.dto.payment.PaymentResponseDto;
import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.payment.dto.request.SepayGenerateRequest;
import com.foodthunder.payment.dto.request.VietQrGenerateRequest;
import com.foodthunder.payment.dto.response.SepayGenerateResponse;
import com.foodthunder.payment.dto.response.VietQrGenerateResponse;
import com.foodthunder.payment.dto.webhook.SepayWebhookPayload;
import com.foodthunder.payment.dto.webhook.VietQrWebhookPayload;

import java.math.BigDecimal;

public interface PaymentService {

    /**
     * Sinh mã QR SePay (tích hợp VietQR Napas 247) kèm cú pháp định danh đơn hàng và số tiền
     */
    SepayGenerateResponse generateSepayQr(SepayGenerateRequest request);

    /**
     * Tiếp nhận và xử lý Webhook biến động số dư từ cổng SePay
     */
    ApiResponse<Void> handleSepayWebhook(SepayWebhookPayload payload, String authorizationHeader);

    /**
     * Tương thích VietQR endpoint cũ
     */
    VietQrGenerateResponse generateVietQr(VietQrGenerateRequest request);

    /**
     * Tương thích Webhook VietQR endpoint cũ
     */
    ApiResponse<Void> handleVietQrWebhook(VietQrWebhookPayload payload, String authorizationHeader);

    /**
     * Tra cứu trạng thái thanh toán của đơn hàng (dùng cho Polling phía Client)
     */
    PaymentResponseDto checkPaymentStatus(Long orderId);

    /**
     * Khởi tạo giao dịch thanh toán tiền mặt (COD)
     */
    PaymentResponseDto createCodPayment(Long orderId, BigDecimal amount, String idempotencyKey);
}
