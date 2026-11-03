// package com.foodthunder.payment.service;

// import com.foodthunder.common.dto.payment.*;
// import com.foodthunder.common.dto.response.ApiResponse;
// import com.foodthunder.common.enums.PaymentMethod;
// import com.foodthunder.common.enums.PaymentStatus;
// import com.foodthunder.payment.client.OrderClient;
// import com.foodthunder.payment.config.VnPayConfig;
// import com.foodthunder.payment.dto.client.RemoteOrderDto;
// import com.foodthunder.payment.entity.Payment;
// import com.foodthunder.payment.repository.PaymentRepository;
// import com.foodthunder.payment.repository.PaymentTransactionRepository;
// import com.foodthunder.payment.service.impl.PaymentServiceImpl;
// import com.foodthunder.payment.util.VnPayUtil;
// import org.junit.jupiter.api.BeforeEach;
// import org.junit.jupiter.api.DisplayName;
// import org.junit.jupiter.api.Test;
// import org.junit.jupiter.api.extension.ExtendWith;
// import org.mockito.InjectMocks;
// import org.mockito.Mock;
// import org.mockito.junit.jupiter.MockitoExtension;
// import org.springframework.http.ResponseEntity;

// import java.math.BigDecimal;
// import java.time.LocalDateTime;
// import java.util.HashMap;
// import java.util.Map;
// import java.util.Optional;

// import static org.junit.jupiter.api.Assertions.*;
// import static org.mockito.ArgumentMatchers.*;
// import static org.mockito.Mockito.*;

// @ExtendWith(MockitoExtension.class)
// class PaymentServiceTest {

//     @Mock
//     private VnPayConfig vnPayConfig;

//     @Mock
//     private PaymentRepository paymentRepository;

//     @Mock
//     private PaymentTransactionRepository paymentTransactionRepository;

//     @Mock
//     private OrderClient orderClient;

//     @InjectMocks
//     private PaymentServiceImpl paymentService;

//     private final String secretKey = "OQQTQXPPWRLNWHQFDNWCGMDYZTSYHHMP";

//     @BeforeEach
//     void setUp() {
//         lenient().when(vnPayConfig.getTmnCode()).thenReturn("QF8R0HDB");
//         lenient().when(vnPayConfig.getHashSecret()).thenReturn(secretKey);
//         lenient().when(vnPayConfig.getUrl()).thenReturn("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
//         lenient().when(vnPayConfig.getReturnUrl()).thenReturn("http://localhost:5173/payment/vnpay-return");
//     }

//     @Test
//     @DisplayName("Should create VNPay payment URL and record pending payment")
//     void shouldCreateVnPayPaymentUrl() {
//         VnPayPaymentUrlRequest request = VnPayPaymentUrlRequest.builder()
//                 .orderId(101L)
//                 .amount(BigDecimal.valueOf(50000))
//                 .orderInfo("Thanh toan don 101")
//                 .bankCode("NCB")
//                 .build();

//         when(orderClient.getOrderDetail(eq(101L), anyString(), anyString()))
//                 .thenReturn(ResponseEntity.ok(ApiResponse.success(RemoteOrderDto.builder()
//                         .id(101L)
//                         .totalAmount(BigDecimal.valueOf(50000))
//                         .build())));

//         when(paymentRepository.findByOrderId(101L)).thenReturn(Optional.empty());
//         when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
//             Payment p = i.getArgument(0);
//             p.setId(1L);
//             p.setCreatedAt(LocalDateTime.now());
//             p.setUpdatedAt(LocalDateTime.now());
//             return p;
//         });

//         VnPayPaymentUrlResponse response = paymentService.createVnPayPaymentUrl(request, "127.0.0.1");

//         assertNotNull(response);
//         assertNotNull(response.getPaymentUrl());
//         assertTrue(response.getPaymentUrl().contains("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"));
//         assertTrue(response.getPaymentUrl().contains("vnp_SecureHash="));
//         verify(paymentRepository, times(1)).save(any(Payment.class));
//     }

//     @Test
//     @DisplayName("Should process successful VNPay return callback and update order status")
//     void shouldProcessSuccessfulVnPayCallback() {
//         Map<String, String> params = new HashMap<>();
//         params.put("vnp_Amount", "5000000");
//         params.put("vnp_Command", "pay");
//         params.put("vnp_ResponseCode", "00");
//         params.put("vnp_TransactionNo", "14000123");
//         params.put("vnp_TxnRef", "101_1712345678");

//         String hashData = VnPayUtil.buildHashData(params);
//         String secureHash = VnPayUtil.hmacSHA512(secretKey, hashData);
//         params.put("vnp_SecureHash", secureHash);

//         Payment payment = Payment.builder()
//                 .id(1L)
//                 .orderId(101L)
//                 .status(PaymentStatus.PENDING)
//                 .amount(BigDecimal.valueOf(50000))
//                 .build();

//         when(paymentRepository.findByOrderId(101L)).thenReturn(Optional.of(payment));
//         when(paymentRepository.save(any(Payment.class))).thenReturn(payment);

//         VnPayCallbackDto callbackDto = paymentService.processVnPayCallback(params);

//         assertNotNull(callbackDto);
//         assertEquals("00", callbackDto.getVnp_ResponseCode());
//         assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
//         verify(orderClient, times(1)).updateOrderStatus(eq(101L), any(), anyString(), anyString());
//     }

//     @Test
//     @DisplayName("Should process COD payment creation")
//     void shouldCreateCodPayment() {
//         PaymentInitiateRequest request = PaymentInitiateRequest.builder()
//                 .orderId(202L)
//                 .amount(BigDecimal.valueOf(75000))
//                 .paymentMethod(PaymentMethod.CASH)
//                 .build();

//         when(paymentRepository.findByOrderId(202L)).thenReturn(Optional.empty());
//         when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
//             Payment p = i.getArgument(0);
//             p.setId(2L);
//             p.setCreatedAt(LocalDateTime.now());
//             p.setUpdatedAt(LocalDateTime.now());
//             return p;
//         });

//         PaymentResponseDto response = paymentService.createCodPayment(request);

//         assertNotNull(response);
//         assertEquals(202L, response.getOrderId());
//         assertEquals(PaymentMethod.CASH, response.getPaymentMethod());
//         assertEquals(PaymentStatus.PENDING, response.getStatus());
//         verify(paymentRepository, times(1)).save(any(Payment.class));
//     }
// }
