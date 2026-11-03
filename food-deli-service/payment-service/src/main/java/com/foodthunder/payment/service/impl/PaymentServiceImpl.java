package com.foodthunder.payment.service.impl;

import com.foodthunder.common.dto.payment.*;
import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.common.enums.PaymentMethod;
import com.foodthunder.common.enums.PaymentStatus;
import com.foodthunder.common.enums.TransactionStatus;
import com.foodthunder.payment.client.OrderClient;
import com.foodthunder.payment.config.VnPayConfig;
import com.foodthunder.payment.dto.client.RemoteOrderDto;
import com.foodthunder.payment.dto.client.RemoteUpdateOrderStatusRequest;
import com.foodthunder.payment.entity.Payment;
import com.foodthunder.payment.entity.PaymentTransaction;
import com.foodthunder.payment.exception.BadRequestException;
import com.foodthunder.payment.exception.PaymentException;
import com.foodthunder.payment.exception.ResourceNotFoundException;
import com.foodthunder.payment.repository.PaymentRepository;
import com.foodthunder.payment.repository.PaymentTransactionRepository;
import com.foodthunder.payment.service.PaymentService;
import com.foodthunder.payment.util.VnPayUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.ZoneId;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final VnPayConfig vnPayConfig;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final OrderClient orderClient;

    @Override
    @Transactional
    public VnPayPaymentUrlResponse createVnPayPaymentUrl(VnPayPaymentUrlRequest request, String clientIp) {
        Long orderId = request.getOrderId();
        BigDecimal amount = request.getAmount();

        log.info("Creating VNPay payment URL for orderId: {}, amount: {}", orderId, amount);

        // 1. Fetch remote order information via OpenFeign to pre-validate
        try {
            ResponseEntity<ApiResponse<RemoteOrderDto>> orderResp = orderClient.getOrderDetail(orderId, "SYSTEM", "0");
            if (orderResp != null && orderResp.getBody() != null && orderResp.getBody().data() != null) {
                RemoteOrderDto orderDto = orderResp.getBody().data();
                if (orderDto.getTotalAmount() != null && orderDto.getTotalAmount().compareTo(amount) != 0) {
                    log.warn("Order amount mismatch: requested={}, actual={}", amount, orderDto.getTotalAmount());
                }
            }
        } catch (Exception ex) {
            log.warn("Could not verify order status from order-service: {}. Continuing in sandbox mode.", ex.getMessage());
        }

        // 2. Manage Payment record (Idempotent: update if existing, or create new)
        Optional<Payment> existingPaymentOpt = paymentRepository.findByOrderId(orderId);
        Payment payment;
        if (existingPaymentOpt.isPresent()) {
            payment = existingPaymentOpt.get();
            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                throw new BadRequestException("Đơn hàng #" + orderId + " đã được thanh toán thành công");
            }
            payment.setAmount(amount);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setPaymentMethod(PaymentMethod.E_WALLET);
        } else {
            String idempotencyKey = "PAY-VNP-" + orderId + "-" + System.currentTimeMillis();
            payment = Payment.builder()
                    .orderId(orderId)
                    .idempotencyKey(idempotencyKey)
                    .paymentMethod(PaymentMethod.E_WALLET)
                    .status(PaymentStatus.PENDING)
                    .amount(amount)
                    .build();
        }
        Payment savedPayment = paymentRepository.save(payment);

        // 3. Prepare VNPay query parameters
        String vnpTxnRef = orderId + "_" + System.currentTimeMillis();
        long vnpAmount = amount.multiply(BigDecimal.valueOf(100)).longValue();

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        String vnpCreateDate = formatter.format(cld.getTime());

        cld.add(Calendar.MINUTE, 15);
        String vnpExpireDate = formatter.format(cld.getTime());

        String effectiveIp = (clientIp != null && !clientIp.isBlank()) ? clientIp : "127.0.0.1";
        String returnUrl = (request.getReturnUrl() != null && !request.getReturnUrl().isBlank())
                ? request.getReturnUrl()
                : vnPayConfig.getReturnUrl();

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        vnpParams.put("vnp_Amount", String.valueOf(vnpAmount));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", vnpTxnRef);
        vnpParams.put("vnp_OrderInfo", request.getOrderInfo() != null ? request.getOrderInfo() : "Thanh toan don hang #" + orderId);
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", returnUrl);
        vnpParams.put("vnp_IpAddr", effectiveIp);
        vnpParams.put("vnp_CreateDate", vnpCreateDate);
        vnpParams.put("vnp_ExpireDate", vnpExpireDate);

        if (request.getBankCode() != null && !request.getBankCode().isBlank()) {
            vnpParams.put("vnp_BankCode", request.getBankCode().trim());
        }

        // 4. Generate Checksum SHA512
        String hashData = VnPayUtil.buildHashData(vnpParams);
        String vnpSecureHash = VnPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), hashData);
        String queryUrl = VnPayUtil.buildQueryUrl(vnpParams) + "&vnp_SecureHash=" + vnpSecureHash;
        String paymentUrl = vnPayConfig.getUrl() + "?" + queryUrl;

        // 5. Record initial transaction attempt
        PaymentTransaction transaction = PaymentTransaction.builder()
                .payment(savedPayment)
                .attemptNumber((int) (paymentTransactionRepository.countByPaymentId(savedPayment.getId()) + 1))
                .status(TransactionStatus.PENDING)
                .transactionRef(vnpTxnRef)
                .gatewayResponse("INIT: " + vnpTxnRef)
                .build();
        paymentTransactionRepository.save(transaction);

        log.info("Generated VNPay paymentUrl successfully for orderId: {}, txnRef: {}", orderId, vnpTxnRef);

        return VnPayPaymentUrlResponse.builder()
                .paymentUrl(paymentUrl)
                .transactionRef(vnpTxnRef)
                .build();
    }

    @Override
    @Transactional
    public VnPayCallbackDto processVnPayCallback(Map<String, String> params) {
        log.info("Processing VNPay return callback with params: {}", params);

        boolean isValidChecksum = VnPayUtil.verifyChecksum(params, vnPayConfig.getHashSecret());
        String responseCode = params.getOrDefault("vnp_ResponseCode", "99");
        String txnRef = params.get("vnp_TxnRef");
        String transactionNo = params.get("vnp_TransactionNo");

        Long orderId = parseOrderIdFromTxnRef(txnRef);

        if (!isValidChecksum) {
            log.error("Invalid VNPay checksum in return callback for txnRef: {}", txnRef);
            return mapParamsToCallbackDto(params, "97");
        }

        if (orderId != null) {
            paymentRepository.findByOrderId(orderId).ifPresent(payment -> {
                boolean isSuccess = "00".equals(responseCode);
                PaymentStatus newStatus = isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
                payment.setStatus(newStatus);
                paymentRepository.save(payment);

                // Record transaction
                PaymentTransaction transaction = PaymentTransaction.builder()
                        .payment(payment)
                        .attemptNumber((int) (paymentTransactionRepository.countByPaymentId(payment.getId()) + 1))
                        .status(isSuccess ? TransactionStatus.SUCCESS : TransactionStatus.FAILED)
                        .transactionRef(transactionNo != null ? transactionNo : txnRef)
                        .gatewayResponse(params.toString())
                        .build();
                paymentTransactionRepository.save(transaction);

                // Update order status in order-service
                try {
                    String targetOrderStatus = isSuccess ? "PENDING" : "CANCELLED";
                    String reason = isSuccess
                            ? "Thanh toán VNPay thành công (Mã GD: " + transactionNo + ")"
                            : "Thanh toán VNPay thất bại hoặc bị hủy (Mã phản hồi: " + responseCode + ")";
                    RemoteUpdateOrderStatusRequest updateReq = RemoteUpdateOrderStatusRequest.builder()
                            .statusCode(targetOrderStatus)
                            .reason(reason)
                            .build();
                    orderClient.updateOrderStatus(orderId, updateReq, "SYSTEM", "0");
                    log.info("Synced orderId: {} status to {} following VNPay callback", orderId, targetOrderStatus);
                } catch (Exception e) {
                    log.error("Failed to notify order-service of payment update for orderId: {}", orderId, e);
                }
            });
        }

        return mapParamsToCallbackDto(params, responseCode);
    }

    @Override
    @Transactional
    public VnPayIpnResponse processVnPayIpn(Map<String, String> params) {
        log.info("Processing VNPay IPN webhook: {}", params);

        // 1. Verify Checksum
        boolean isValidChecksum = VnPayUtil.verifyChecksum(params, vnPayConfig.getHashSecret());
        if (!isValidChecksum) {
            log.warn("VNPay IPN checksum verification failed");
            return VnPayIpnResponse.invalidChecksum();
        }

        // 2. Validate Order existence
        String txnRef = params.get("vnp_TxnRef");
        Long orderId = parseOrderIdFromTxnRef(txnRef);
        if (orderId == null) {
            return VnPayIpnResponse.orderNotFound();
        }

        Optional<Payment> paymentOpt = paymentRepository.findByOrderId(orderId);
        if (paymentOpt.isEmpty()) {
            log.warn("VNPay IPN: Payment record not found for orderId: {}", orderId);
            return VnPayIpnResponse.orderNotFound();
        }

        Payment payment = paymentOpt.get();

        // 3. Validate Amount
        String vnpAmountStr = params.get("vnp_Amount");
        if (vnpAmountStr != null) {
            long receivedAmount = Long.parseLong(vnpAmountStr) / 100;
            if (payment.getAmount().longValue() != receivedAmount) {
                log.warn("VNPay IPN: Amount mismatch. Expected: {}, Received: {}", payment.getAmount(), receivedAmount);
                return VnPayIpnResponse.invalidAmount();
            }
        }

        // 4. Validate if already confirmed
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            log.info("VNPay IPN: Payment for orderId: {} already confirmed earlier", orderId);
            return VnPayIpnResponse.alreadyConfirmed();
        }

        // 5. Update Payment & Transaction
        String responseCode = params.getOrDefault("vnp_ResponseCode", "99");
        boolean isSuccess = "00".equals(responseCode);
        payment.setStatus(isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED);
        paymentRepository.save(payment);

        PaymentTransaction transaction = PaymentTransaction.builder()
                .payment(payment)
                .attemptNumber((int) (paymentTransactionRepository.countByPaymentId(payment.getId()) + 1))
                .status(isSuccess ? TransactionStatus.SUCCESS : TransactionStatus.FAILED)
                .transactionRef(params.get("vnp_TransactionNo"))
                .gatewayResponse(params.toString())
                .build();
        paymentTransactionRepository.save(transaction);

        // 6. Notify order-service
        try {
            String targetOrderStatus = isSuccess ? "PENDING" : "CANCELLED";
            String reason = isSuccess
                    ? "VNPay IPN xác nhận thanh toán thành công (Mã GD: " + params.get("vnp_TransactionNo") + ")"
                    : "VNPay IPN thông báo giao dịch thất bại";
            RemoteUpdateOrderStatusRequest updateReq = RemoteUpdateOrderStatusRequest.builder()
                    .statusCode(targetOrderStatus)
                    .reason(reason)
                    .build();
            orderClient.updateOrderStatus(orderId, updateReq, "SYSTEM", "0");
            log.info("Synced orderId: {} status to {} via VNPay IPN", orderId, targetOrderStatus);
        } catch (Exception ex) {
            log.error("Failed to notify order-service during IPN processing", ex);
        }

        return VnPayIpnResponse.success();
    }

    @Override
    @Transactional
    public PaymentResponseDto createCodPayment(PaymentInitiateRequest request) {
        Long orderId = request.getOrderId();
        BigDecimal amount = request.getAmount();

        log.info("Initiating COD payment for orderId: {}, amount: {}", orderId, amount);

        Optional<Payment> existingOpt = paymentRepository.findByOrderId(orderId);
        Payment payment;
        if (existingOpt.isPresent()) {
            payment = existingOpt.get();
            payment.setPaymentMethod(PaymentMethod.CASH);
            payment.setAmount(amount);
        } else {
            String idempotencyKey = request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()
                    ? request.getIdempotencyKey()
                    : "PAY-COD-" + orderId + "-" + System.currentTimeMillis();
            payment = Payment.builder()
                    .orderId(orderId)
                    .idempotencyKey(idempotencyKey)
                    .paymentMethod(PaymentMethod.CASH)
                    .status(PaymentStatus.PENDING)
                    .amount(amount)
                    .build();
        }

        Payment saved = paymentRepository.save(payment);

        PaymentTransaction transaction = PaymentTransaction.builder()
                .payment(saved)
                .attemptNumber((int) (paymentTransactionRepository.countByPaymentId(saved.getId()) + 1))
                .status(TransactionStatus.PENDING)
                .transactionRef("COD-" + orderId)
                .gatewayResponse("CASH_ON_DELIVERY")
                .build();
        paymentTransactionRepository.save(transaction);

        return mapToDto(saved, null, "COD-" + orderId);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponseDto getPaymentByOrderId(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin thanh toán cho đơn hàng #" + orderId));
        return mapToDto(payment, null, null);
    }

    private Long parseOrderIdFromTxnRef(String txnRef) {
        if (txnRef == null || txnRef.isBlank()) return null;
        try {
            if (txnRef.contains("_")) {
                return Long.parseLong(txnRef.split("_")[0]);
            }
            return Long.parseLong(txnRef);
        } catch (NumberFormatException e) {
            log.error("Failed to parse orderId from txnRef: {}", txnRef, e);
            return null;
        }
    }

    private VnPayCallbackDto mapParamsToCallbackDto(Map<String, String> params, String responseCode) {
        return VnPayCallbackDto.builder()
                .vnp_TmnCode(params.get("vnp_TmnCode"))
                .vnp_Amount(params.get("vnp_Amount"))
                .vnp_BankCode(params.get("vnp_BankCode"))
                .vnp_BankTranNo(params.get("vnp_BankTranNo"))
                .vnp_CardType(params.get("vnp_CardType"))
                .vnp_PayDate(params.get("vnp_PayDate"))
                .vnp_OrderInfo(params.get("vnp_OrderInfo"))
                .vnp_TransactionNo(params.get("vnp_TransactionNo"))
                .vnp_ResponseCode(responseCode)
                .vnp_TransactionStatus(params.get("vnp_TransactionStatus"))
                .vnp_TxnRef(params.get("vnp_TxnRef"))
                .vnp_SecureHashType(params.get("vnp_SecureHashType"))
                .vnp_SecureHash(params.get("vnp_SecureHash"))
                .build();
    }

    private PaymentResponseDto mapToDto(Payment payment, String paymentUrl, String txnRef) {
        return PaymentResponseDto.builder()
                .id(payment.getId())
                .orderId(payment.getOrderId())
                .idempotencyKey(payment.getIdempotencyKey())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .amount(payment.getAmount())
                .paymentUrl(paymentUrl)
                .transactionRef(txnRef)
                .createdAt(payment.getCreatedAt() != null ? payment.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant() : Instant.now())
                .updatedAt(payment.getUpdatedAt() != null ? payment.getUpdatedAt().atZone(ZoneId.systemDefault()).toInstant() : Instant.now())
                .build();
    }
}

