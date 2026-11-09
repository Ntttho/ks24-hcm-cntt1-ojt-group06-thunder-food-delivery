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

        // 1. Kiểm tra đơn hàng có tồn tại bên order-service (nếu khả dụng)
        try {
            ResponseEntity<ApiResponse<RemoteOrderDto>> orderResp = orderClient.getOrderDetail(orderId, "SYSTEM", "0");
            if (orderResp != null && orderResp.getBody() != null && orderResp.getBody().data() != null) {
                RemoteOrderDto order = orderResp.getBody().data();
                if ("CANCELLED".equalsIgnoreCase(order.getStatus()) || "COMPLETED".equalsIgnoreCase(order.getStatus())) {
                    throw new BadRequestException("Không thể tạo thanh toán cho đơn hàng đã " + order.getStatus());
                }
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Không thể kiểm tra thông tin order-service cho orderId={}, tiếp tục: {}", orderId, e.getMessage());
        }

        // 2. Tạo hoặc tái sử dụng bản ghi Payment
        Payment payment = findOrCreatePayment(orderId, amount, request.getIdempotencyKey());

        // 3. Sinh cú pháp chuyển khoản và link ảnh mã QR SePay
        String paymentContent = SepayUtil.buildPaymentContent(sepayConfig.getOrderPrefix(), orderId);
        String qrCodeUrl = SepayUtil.buildSepayQrUrl(
                sepayConfig.getQrBaseUrl(),
                sepayConfig.getBankName(),
                sepayConfig.getAccountNo(),
                sepayConfig.getTemplate(),
                amount,
                paymentContent
        );

        log.info("Sinh mã SePay QR thành công cho orderId={}, QR URL: {}", orderId, qrCodeUrl);

        return SepayGenerateResponse.builder()
                .orderId(orderId)
                .amount(amount)
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

        // 3. Trích xuất mã đơn hàng từ nội dung chuyển khoản
        String content = payload.getSafeContent();
        Long orderId = SepayUtil.extractOrderId(content, sepayConfig.getOrderPrefix());

        if (orderId == null) {
            log.warn("SePay Webhook không chứa mã đơn hàng hợp lệ: content='{}'", content);
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
            orderClient.updateOrderStatus(
                    orderId,
                    RemoteUpdateOrderStatusRequest.builder()
                            .status("PENDING")
                            .note("Đã thanh toán SePay QR thành công qua ngân hàng (Ref: " + refCode + ")")
                            .build(),
                    "SYSTEM",
                    "0"
            );
            log.info("Đã đồng bộ đơn hàng #{} sang trạng thái PENDING thành công.", orderId);
        } catch (Exception e) {
            log.error("Lỗi gọi Feign Client sang order-service để cập nhật đơn hàng #{}: {}", orderId, e.getMessage());
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
        log.info("Khởi tạo thanh toán COD cho đơn hàng orderId={}, số tiền={}", orderId, amount);

        Optional<Payment> existingOpt = paymentRepository.findByOrderId(orderId);
        Payment payment;
        if (existingOpt.isPresent()) {
            payment = existingOpt.get();
            payment.setPaymentMethod(PaymentMethod.CASH);
            payment.setAmount(amount);
        } else {
            String key = (idempotencyKey != null && !idempotencyKey.isBlank())
                    ? idempotencyKey
                    : "COD_" + orderId + "_" + System.currentTimeMillis();

            payment = Payment.builder()
                    .orderId(orderId)
                    .amount(amount)
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

    private void validateSepayWebhookSecurity(String authHeader) {
        String configuredToken = sepayConfig.getWebhookToken();
        String apiKey = sepayConfig.getApiKey();

        if ((configuredToken != null && !configuredToken.isBlank()) || (apiKey != null && !apiKey.isBlank())) {
            if (authHeader == null || authHeader.isBlank()) {
                throw new BadRequestException("Thiếu Header xác thực SePay Webhook!");
            }
            String cleanToken = authHeader.replace("Apikey ", "").replace("Bearer ", "").trim();
            boolean matchToken = configuredToken != null && configuredToken.equals(cleanToken);
            boolean matchApiKey = apiKey != null && apiKey.equals(cleanToken);

            if (!matchToken && !matchApiKey) {
                log.warn("Xác thực SePay Webhook không thành công: Token không khớp!");
                throw new BadRequestException("Khóa bảo mật SePay Webhook không hợp lệ!");
            }
        }
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return String.valueOf(obj);
        }
    }
}
