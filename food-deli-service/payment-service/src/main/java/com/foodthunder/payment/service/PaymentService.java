package com.foodthunder.payment.service;

import com.foodthunder.common.dto.payment.*;

import java.util.Map;

public interface PaymentService {

    VnPayPaymentUrlResponse createVnPayPaymentUrl(VnPayPaymentUrlRequest request, String clientIp);

    VnPayCallbackDto processVnPayCallback(Map<String, String> params);

    VnPayIpnResponse processVnPayIpn(Map<String, String> params);

    PaymentResponseDto createCodPayment(PaymentInitiateRequest request);

    PaymentResponseDto getPaymentByOrderId(Long orderId);
}
