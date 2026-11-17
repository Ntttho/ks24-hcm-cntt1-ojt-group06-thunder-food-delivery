package com.foodthunder.payment.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.common.dto.payment.PaymentResponseDto;
import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.payment.client.OrderClient;
import com.foodthunder.payment.config.SepayConfig;
import com.foodthunder.payment.dto.client.RemoteOrderDto;
import com.foodthunder.payment.dto.request.SepayGenerateRequest;
import com.foodthunder.payment.dto.response.SepayGenerateResponse;
import com.foodthunder.payment.entity.Payment;
import com.foodthunder.payment.exception.BadRequestException;
import com.foodthunder.payment.repository.PaymentRepository;
import com.foodthunder.payment.repository.PaymentTransactionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentTransactionRepository transactionRepository;

    @Mock
    private SepayConfig sepayConfig;

    @Mock
    private OrderClient orderClient;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private void stubSepayConfig() {
        when(sepayConfig.getOrderPrefix()).thenReturn("FOODDELI");
        when(sepayConfig.getQrBaseUrl()).thenReturn("https://qr.sepay.vn/img");
        when(sepayConfig.getBankName()).thenReturn("ACB");
        when(sepayConfig.getAccountNo()).thenReturn("17532841");
        when(sepayConfig.getAccountName()).thenReturn("NGUYEN TA THO");
        when(sepayConfig.getTemplate()).thenReturn("compact2");
    }

    @Test
    @DisplayName("Sinh mã SePay QR luôn đồng bộ đúng totalAmount sau giảm giá voucher từ order-service")
    void generateSepayQr_syncsAuthoritativeOrderTotal() {
        stubSepayConfig();
        RemoteOrderDto discountedOrder = RemoteOrderDto.builder()
                .id(10L)
                .orderCode("ORD-10")
                .totalAmount(BigDecimal.valueOf(65000))
                .status("AWAITING_PAYMENT")
                .build();

        when(orderClient.getOrderDetail(10L, "SYSTEM", "0"))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(discountedOrder)));
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));

        SepayGenerateRequest request = SepayGenerateRequest.builder()
                .orderId(10L)
                .amount(BigDecimal.valueOf(100000))
                .build();

        SepayGenerateResponse response = paymentService.generateSepayQr(request);

        assertThat(response.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(65000));
        assertThat(response.getQrCodeUrl()).contains("amount=65000");
    }

    @Test
    @DisplayName("Từ chối sinh QR SePay khi đơn sau áp voucher dưới 1.000đ")
    void generateSepayQr_belowMinimumAfterVoucher_throwsBadRequest() {
        RemoteOrderDto freeOrder = RemoteOrderDto.builder()
                .id(11L)
                .totalAmount(BigDecimal.ZERO)
                .status("AWAITING_PAYMENT")
                .build();

        when(orderClient.getOrderDetail(11L, "SYSTEM", "0"))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(freeOrder)));

        SepayGenerateRequest request = SepayGenerateRequest.builder()
                .orderId(11L)
                .amount(BigDecimal.valueOf(50000))
                .build();

        assertThatThrownBy(() -> paymentService.generateSepayQr(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("1.000đ");
    }

    @Test
    @DisplayName("Tạo thanh toán COD đồng bộ đúng totalAmount sau giảm giá voucher từ order-service")
    void createCodPayment_syncsAuthoritativeOrderTotal() {
        RemoteOrderDto discountedOrder = RemoteOrderDto.builder()
                .id(12L)
                .totalAmount(BigDecimal.valueOf(45000))
                .status("PENDING")
                .build();

        when(orderClient.getOrderDetail(12L, "SYSTEM", "0"))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(discountedOrder)));
        when(paymentRepository.findByOrderId(12L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));

        PaymentResponseDto response = paymentService.createCodPayment(12L, BigDecimal.valueOf(80000), null);

        assertThat(response.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(45000));
    }
}
