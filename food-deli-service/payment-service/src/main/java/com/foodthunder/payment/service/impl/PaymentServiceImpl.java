package com.foodthunder.payment.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.common.dto.payment.PaymentResponseDto;
import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.common.enums.PaymentMethod;
import com.foodthunder.common.enums.PaymentStatus;
import com.foodthunder.common.enums.TransactionStatus;
import com.foodthunder.payment.client.OrderClient;
import com.foodthunder.payment.config.SepayConfig;
import com.foodthunder.payment.dto.client.RemoteOrderDto;
import com.foodthunder.payment.dto.client.RemoteUpdateOrderStatusRequest;
import com.foodthunder.payment.dto.request.SepayGenerateRequest;
import com.foodthunder.payment.dto.request.VietQrGenerateRequest;
import com.foodthunder.payment.dto.response.SepayGenerateResponse;
import com.foodthunder.payment.dto.response.VietQrGenerateResponse;
import com.foodthunder.payment.dto.webhook.SepayWebhookPayload;
import com.foodthunder.payment.dto.webhook.VietQrWebhookPayload;
import com.foodthunder.payment.entity.Payment;
import com.foodthunder.payment.entity.PaymentTransaction;
import com.foodthunder.payment.exception.BadRequestException;
import com.foodthunder.payment.exception.ResourceNotFoundException;
import com.foodthunder.payment.repository.PaymentRepository;
import com.foodthunder.payment.repository.PaymentTransactionRepository;
import com.foodthunder.payment.service.PaymentService;
import com.foodthunder.payment.util.SepayUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final SepayConfig sepayConfig;
    private final OrderClient orderClient;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public SepayGenerateResponse generateSepayQr(SepayGenerateRequest request) {
        Long orderId = request.getOrderId();
        BigDecimal amount = request.getAmount();

        log.info("Bắt đầu sinh mã SePay QR cho đơn hàng orderId={}, số tiền={}", orderId, amount);

        // 1. Kiểm tra đơn hàng và đồng bộ số tiền cuối cùng từ order-service (sau khi đã trừ voucher quán & toàn sàn)
        BigDecimal effectiveAmount = resolveAuthoritativeAmount(orderId, amount, true);
        if (effectiveAmount.compareTo(BigDecimal.valueOf(1000)) < 0) {
            throw new BadRequestException("Đơn hàng có tổng thanh toán dưới 1.000đ sau khi áp dụng voucher, không thể tạo mã SePay QR");
        }

        // 2. Tạo hoặc tái sử dụng bản ghi Payment
        Payment payment = findOrCreatePayment(orderId, effectiveAmount, request.getIdempotencyKey());

        // 3. Sinh cú pháp chuyển khoản và link ảnh mã QR SePay
        String paymentContent = SepayUtil.buildPaymentContent(sepayConfig.getOrderPrefix(), orderId);
        String qrCodeUrl = SepayUtil.buildSepayQrUrl(
                sepayConfig.getQrBaseUrl(),
                sepayConfig.getBankName(),
                sepayConfig.getAccountNo(),
                sepayConfig.getTemplate(),
                effectiveAmount,
                paymentContent
        );

        log.info("Sinh mã SePay QR thành công cho orderId={}, amount={}, QR URL: {}", orderId, effectiveAmount, qrCodeUrl);

        return SepayGenerateResponse.builder()
                .orderId(orderId)
                .amount(effectiveAmount)
                .qrCodeUrl(qrCodeUrl)
                .bankName(sepayConfig.getBankName())
                .bankBin(sepayConfig.getBankBin())
                .accountNo(sepayConfig.getAccountNo())
                .accountName(sepayConfig.getAccountName())
                .paymentContent(paymentContent)
                .status(PaymentStatus.PENDING.name())
                .expiresAt(Instant.now().plusSeconds(15 * 60))
                .build();
    }

    @Override
    @Transactional
    public ApiResponse<Void> handleSepayWebhook(SepayWebhookPayload payload, String authorizationHeader) {
        log.info("Nhận SePay Webhook: {}", payload);

        // 1. Xác thực bảo mật Webhook qua Token
        validateSepayWebhookSecurity(authorizationHeader);

        if (payload == null) {
            throw new BadRequestException("Dữ liệu SePay Webhook không được để trống!");
        }

        // 2. Bỏ qua nếu là giao dịch tiền ra (out)
        if ("out".equalsIgnoreCase(payload.getTransferType())) {
            log.info("Bỏ qua giao dịch tiền ra (transferType=out) id={}", payload.getId());
            return ApiResponse.success("Đã ghi nhận, bỏ qua giao dịch chi tiền.", null);
        }

        // 3. Trích xuất mã đơn hàng từ mã nhận diện (code) hoặc nội dung chuyển khoản
        Long orderId = resolveOrderId(payload);

        if (orderId == null) {
            log.warn("SePay Webhook không chứa mã đơn hàng hợp lệ: code='{}', content='{}'",
                    payload.getCode(), payload.getSafeContent());
            return ApiResponse.success("Giao dịch không thuộc đơn hàng FoodThunder hoặc sai cú pháp, đã bỏ qua.", null);
        }

        // 4. Kiểm tra Idempotency chống xử lý lặp lại (Replay Attack)
        String refCode = payload.getReferenceCode();
        if (refCode == null || refCode.isBlank()) {
            refCode = payload.getId() != null ? "SEPAY_" + payload.getId() : "TX_" + orderId + "_" + System.currentTimeMillis();
        }

        if (transactionRepository.findByTransactionRef(refCode).isPresent()) {
            log.info("Giao dịch SePay refCode={} đã được xử lý trước đó (Idempotent).", refCode);
            return ApiResponse.success("Giao dịch đã được ghi nhận trước đó.", null);
        }

        // 5. Khóa bi quan bản ghi Payment để xử lý an toàn
        Payment payment = paymentRepository.findByOrderIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin thanh toán cho đơn hàng #" + orderId));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            log.info("Đơn hàng #{} đã ở trạng thái thanh toán SUCCESS.", orderId);
            return ApiResponse.success("Đơn hàng đã thanh toán thành công trước đó.", null);
        }

        // 6. Đối soát số tiền thanh toán
        BigDecimal transferAmount = payload.getTransferAmount();
        if (transferAmount != null && transferAmount.compareTo(payment.getAmount()) < 0) {
            log.error("Số tiền SePay nhận được ({}) thấp hơn số tiền đơn hàng ({}) cho orderId={}",
                    transferAmount, payment.getAmount(), orderId);

            PaymentTransaction failedTx = PaymentTransaction.builder()
                    .payment(payment)
                    .attemptNumber((int) transactionRepository.countByPaymentId(payment.getId()) + 1)
                    .status(TransactionStatus.FAILED)
                    .transactionRef(refCode)
                    .gatewayResponse(toJson(payload))
                    .build();
            payment.addTransaction(failedTx);
            paymentRepository.save(payment);

            throw new BadRequestException("Số tiền chuyển khoản (" + transferAmount + " VNĐ) không đủ giá trị đơn hàng (" + payment.getAmount() + " VNĐ)!");
        }

        // 7. Cập nhật Payment -> SUCCESS và ghi log Transaction
        payment.setStatus(PaymentStatus.SUCCESS);
        PaymentTransaction successTx = PaymentTransaction.builder()
                .payment(payment)
                .attemptNumber((int) transactionRepository.countByPaymentId(payment.getId()) + 1)
                .status(TransactionStatus.SUCCESS)
                .transactionRef(refCode)
                .gatewayResponse(toJson(payload))
                .build();
        payment.addTransaction(successTx);
        paymentRepository.save(payment);

        log.info("Thanh toán SePay đơn hàng #{} thành công! refCode={}", orderId, refCode);

        // 8. Đồng bộ trạng thái đơn hàng sang order-service: AWAITING_PAYMENT -> PENDING
        try {
            orderClient.confirmPaymentSuccess(orderId, refCode, "SYSTEM", "0");
            log.info("Đã gọi confirmPaymentSuccess sang order-service cho đơn hàng #{} thành công.", orderId);
        } catch (Exception e) {
            log.warn("Lỗi gọi confirmPaymentSuccess sang order-service cho đơn hàng #{}: {}. Thử fallback qua updateOrderStatus...", orderId, e.getMessage());
            try {
                orderClient.updateOrderStatus(
                        orderId,
                        RemoteUpdateOrderStatusRequest.builder()
                                .statusCode("PENDING")
                                .reason("Đã thanh toán SePay QR thành công qua ngân hàng (Ref: " + refCode + ")")
                                .build(),
                        "SYSTEM",
                        "0"
                );
                log.info("Fallback updateOrderStatus thành công cho đơn hàng #{}.", orderId);
            } catch (Exception ex) {
                log.error("Fallback updateOrderStatus thất bại cho đơn hàng #{}: {}", orderId, ex.getMessage());
            }
        }

        return ApiResponse.success("Xác nhận thanh toán đơn hàng #" + orderId + " thành công!", null);
    }

    @Override
    @Transactional
    public VietQrGenerateResponse generateVietQr(VietQrGenerateRequest request) {
        SepayGenerateResponse resp = generateSepayQr(SepayGenerateRequest.builder()
                .orderId(request.getOrderId())
                .amount(request.getAmount())
                .orderInfo(request.getOrderInfo())
                .idempotencyKey(request.getIdempotencyKey())
                .build());

        return VietQrGenerateResponse.builder()
                .orderId(resp.getOrderId())
                .amount(resp.getAmount())
                .qrCodeUrl(resp.getQrCodeUrl())
                .bankBin(resp.getBankBin())
                .bankName(resp.getBankName())
                .accountNo(resp.getAccountNo())
                .accountName(resp.getAccountName())
                .paymentContent(resp.getPaymentContent())
                .status(resp.getStatus())
                .expiresAt(resp.getExpiresAt())
                .build();
    }

    @Override
    @Transactional
    public ApiResponse<Void> handleVietQrWebhook(VietQrWebhookPayload payload, String authorizationHeader) {
        SepayWebhookPayload sepayPayload = SepayWebhookPayload.builder()
                .id(payload.getId())
                .gateway(payload.getGateway())
                .transactionDate(payload.getTransactionDate())
                .accountNumber(payload.getAccountNumber())
                .subAccount(payload.getSubAccount())
                .transferType(payload.getTransferType() != null ? payload.getTransferType() : "in")
                .transferAmount(payload.getTransferAmount())
                .accumulated(payload.getAccumulated())
                .code(payload.getCode())
                .content(payload.getTransactionContent())
                .referenceCode(payload.getReferenceCode())
                .description(payload.getDescription())
                .build();

        return handleSepayWebhook(sepayPayload, authorizationHeader);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponseDto checkPaymentStatus(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin thanh toán cho đơn hàng #" + orderId));

        return PaymentResponseDto.builder()
                .id(payment.getId())
                .orderId(payment.getOrderId())
                .idempotencyKey(payment.getIdempotencyKey())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .amount(payment.getAmount())
                .createdAt(payment.getCreatedAt() != null ? payment.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant() : Instant.now())
                .updatedAt(payment.getUpdatedAt() != null ? payment.getUpdatedAt().atZone(ZoneId.systemDefault()).toInstant() : Instant.now())
                .build();
    }

    @Override
    @Transactional
    public PaymentResponseDto createCodPayment(Long orderId, BigDecimal amount, String idempotencyKey) {
        BigDecimal effectiveAmount = resolveAuthoritativeAmount(orderId, amount, false);
        log.info("Khởi tạo thanh toán COD cho đơn hàng orderId={}, số tiền={}", orderId, effectiveAmount);

        Optional<Payment> existingOpt = paymentRepository.findByOrderId(orderId);
        Payment payment;
        if (existingOpt.isPresent()) {
            payment = existingOpt.get();
            payment.setPaymentMethod(PaymentMethod.CASH);
            payment.setAmount(effectiveAmount);
        } else {
            String key = (idempotencyKey != null && !idempotencyKey.isBlank())
                    ? idempotencyKey
                    : "COD_" + orderId + "_" + System.currentTimeMillis();

            payment = Payment.builder()
                    .orderId(orderId)
                    .amount(effectiveAmount)
                    .paymentMethod(PaymentMethod.CASH)
                    .status(PaymentStatus.PENDING)
                    .idempotencyKey(key)
                    .build();
        }
        paymentRepository.save(payment);

        return PaymentResponseDto.builder()
                .id(payment.getId())
                .orderId(payment.getOrderId())
                .idempotencyKey(payment.getIdempotencyKey())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .amount(payment.getAmount())
                .createdAt(payment.getCreatedAt() != null ? payment.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant() : Instant.now())
                .updatedAt(payment.getUpdatedAt() != null ? payment.getUpdatedAt().atZone(ZoneId.systemDefault()).toInstant() : Instant.now())
                .build();
    }

    private BigDecimal resolveAuthoritativeAmount(Long orderId, BigDecimal requestedAmount, boolean rejectTerminalStatus) {
        try {
            ResponseEntity<ApiResponse<RemoteOrderDto>> orderResp = orderClient.getOrderDetail(orderId, "SYSTEM", "0");
            if (orderResp != null && orderResp.getBody() != null && orderResp.getBody().data() != null) {
                RemoteOrderDto order = orderResp.getBody().data();
                if (rejectTerminalStatus
                        && ("CANCELLED".equalsIgnoreCase(order.getStatus()) || "COMPLETED".equalsIgnoreCase(order.getStatus()))) {
                    throw new BadRequestException("Không thể tạo thanh toán cho đơn hàng đã " + order.getStatus());
                }
                if (order.getTotalAmount() != null && order.getTotalAmount().compareTo(BigDecimal.ZERO) >= 0) {
                    return order.getTotalAmount();
                }
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Không thể đồng bộ số tiền từ order-service cho orderId={}, dùng số tiền yêu cầu {}: {}",
                    orderId, requestedAmount, e.getMessage());
        }
        return requestedAmount != null ? requestedAmount : BigDecimal.ZERO;
    }

    private Payment findOrCreatePayment(Long orderId, BigDecimal amount, String customIdempotency) {
        Optional<Payment> existingOpt = paymentRepository.findByOrderId(orderId);
        Payment payment;
        if (existingOpt.isPresent()) {
            payment = existingOpt.get();
            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                throw new BadRequestException("Đơn hàng #" + orderId + " đã được thanh toán thành công trước đó!");
            }
            payment.setAmount(amount);
            payment.setPaymentMethod(PaymentMethod.E_WALLET);
        } else {
            String idempotency = (customIdempotency != null && !customIdempotency.isBlank())
                    ? customIdempotency
                    : "SEPAY_" + orderId + "_" + System.currentTimeMillis();

            payment = Payment.builder()
                    .orderId(orderId)
                    .amount(amount)
                    .paymentMethod(PaymentMethod.E_WALLET)
                    .status(PaymentStatus.PENDING)
                    .idempotencyKey(idempotency)
                    .build();
        }
        return paymentRepository.save(payment);
    }

    @Override
    @Transactional
    public PaymentResponseDto simulatePaymentSuccess(Long orderId) {
        log.info("Giả lập thanh toán thành công (SANDBOX) cho đơn hàng #{}", orderId);
        Payment payment = paymentRepository.findByOrderIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin thanh toán cho đơn hàng #" + orderId));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            log.info("Đơn hàng #{} đã ở trạng thái thanh toán SUCCESS.", orderId);
            return checkPaymentStatus(orderId);
        }

        String refCode = "SIMULATED_" + orderId + "_" + System.currentTimeMillis();
        payment.setStatus(PaymentStatus.SUCCESS);
        PaymentTransaction successTx = PaymentTransaction.builder()
                .payment(payment)
                .attemptNumber((int) transactionRepository.countByPaymentId(payment.getId()) + 1)
                .status(TransactionStatus.SUCCESS)
                .transactionRef(refCode)
                .gatewayResponse("{\"simulated\": true, \"note\": \"Test thanh toan gia lap sandbox\"}")
                .build();
        payment.addTransaction(successTx);
        paymentRepository.save(payment);

        try {
            orderClient.confirmPaymentSuccess(orderId, refCode, "SYSTEM", "0");
            log.info("Đã gọi confirmPaymentSuccess (Sandbox) cho đơn hàng #{} thành công.", orderId);
        } catch (Exception e) {
            log.warn("Lỗi gọi confirmPaymentSuccess sandbox cho đơn #{}: {}. Thử fallback qua updateOrderStatus...", orderId, e.getMessage());
            try {
                orderClient.updateOrderStatus(
                        orderId,
                        RemoteUpdateOrderStatusRequest.builder()
                                .statusCode("PENDING")
                                .reason("Giả lập thanh toán Sandbox thành công (Ref: " + refCode + ")")
                                .build(),
                        "SYSTEM",
                        "0"
                );
                log.info("Fallback updateOrderStatus (Sandbox) thành công cho đơn hàng #{}.", orderId);
            } catch (Exception ex) {
                log.error("Fallback updateOrderStatus sandbox thất bại cho đơn #{}: {}", orderId, ex.getMessage());
            }
        }

        return checkPaymentStatus(orderId);
    }

    @Override
    @Transactional
    public PaymentResponseDto cancelPayment(Long orderId, String reason) {
        log.info("Processing cancelPayment for orderId={}, reason={}", orderId, reason);
        Optional<Payment> paymentOpt = paymentRepository.findByOrderId(orderId);
        if (paymentOpt.isEmpty()) {
            log.warn("Không tìm thấy bản ghi thanh toán cho orderId={}", orderId);
            return null;
        }

        Payment payment = paymentOpt.get();
        int nextAttempt = payment.getTransactions().size() + 1;
        String cleanReason = (reason != null && !reason.isBlank()) ? reason : "Đơn hàng bị hủy";

        if (payment.getStatus() == PaymentStatus.PENDING || payment.getStatus() == PaymentStatus.PROCESSING) {
            payment.setStatus(PaymentStatus.FAILED);
            PaymentTransaction tx = PaymentTransaction.builder()
                    .attemptNumber(nextAttempt)
                    .status(TransactionStatus.FAILED)
                    .transactionRef("CANCELLED_" + orderId)
                    .gatewayResponse("{\"action\":\"CANCELLED\",\"reason\":\"" + cleanReason.replace("\"", "'") + "\"}")
                    .build();
            payment.addTransaction(tx);
            log.info("Cập nhật thanh toán sang FAILED do đơn hàng #{} bị hủy trước khi thanh toán", orderId);
        } else if (payment.getStatus() == PaymentStatus.SUCCESS) {
            PaymentTransaction tx = PaymentTransaction.builder()
                    .attemptNumber(nextAttempt)
                    .status(TransactionStatus.FAILED)
                    .transactionRef("REFUND_REQUIRED_" + orderId)
                    .gatewayResponse("{\"action\":\"REFUND_REQUIRED\",\"reason\":\"" + cleanReason.replace("\"", "'") + "\"}")
                    .build();
            payment.addTransaction(tx);
            log.warn("Đơn hàng #{} đã thanh toán SUCCESS nhưng bị hủy. Đã ghi nhận giao dịch REFUND_REQUIRED đối soát hoàn tiền", orderId);
        }

        Payment saved = paymentRepository.save(payment);
        return mapToPaymentResponseDto(saved);
    }

    private PaymentResponseDto mapToPaymentResponseDto(Payment payment) {
        return PaymentResponseDto.builder()
                .id(payment.getId())
                .orderId(payment.getOrderId())
                .idempotencyKey(payment.getIdempotencyKey())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .amount(payment.getAmount())
                .createdAt(payment.getCreatedAt() != null ? payment.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant() : Instant.now())
                .updatedAt(payment.getUpdatedAt() != null ? payment.getUpdatedAt().atZone(ZoneId.systemDefault()).toInstant() : Instant.now())
                .build();
    }

    private void validateSepayWebhookSecurity(String authHeader) {
        String configuredToken = sepayConfig.getWebhookToken();
        String apiKey = sepayConfig.getApiKey();

        if ((configuredToken != null && !configuredToken.isBlank()) || (apiKey != null && !apiKey.isBlank())) {
            if (authHeader == null || authHeader.isBlank()) {
                throw new BadRequestException("Thiếu Header xác thực SePay Webhook!");
            }
            String cleanToken = authHeader.replaceAll("(?i)^(apikey|bearer)\\s+", "").trim();
            boolean matchToken = configuredToken != null && configuredToken.equals(cleanToken);
            boolean matchApiKey = apiKey != null && apiKey.equals(cleanToken);

            if (!matchToken && !matchApiKey) {
                log.warn("Xác thực SePay Webhook không thành công: Token không khớp!");
                throw new BadRequestException("Khóa bảo mật SePay Webhook không hợp lệ!");
            }
        }
    }

    private Long resolveOrderId(SepayWebhookPayload payload) {
        if (payload == null) {
            return null;
        }
        if (payload.getCode() != null && !payload.getCode().isBlank()) {
            Long idFromCode = SepayUtil.extractOrderId(payload.getCode(), sepayConfig.getOrderPrefix());
            if (idFromCode != null) {
                return idFromCode;
            }
        }
        return SepayUtil.extractOrderId(payload.getSafeContent(), sepayConfig.getOrderPrefix());
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return String.valueOf(obj);
        }
    }
}
