// package com.foodthunder.payment.controller;

// import com.fasterxml.jackson.databind.ObjectMapper;
// import com.foodthunder.common.dto.payment.PaymentInitiateRequest;
// import com.foodthunder.common.dto.payment.PaymentResponseDto;
// import com.foodthunder.common.dto.payment.VnPayPaymentUrlRequest;
// import com.foodthunder.common.dto.payment.VnPayPaymentUrlResponse;
// import com.foodthunder.common.enums.PaymentMethod;
// import com.foodthunder.common.enums.PaymentStatus;
// import com.foodthunder.payment.service.PaymentService;
// import org.junit.jupiter.api.DisplayName;
// import org.junit.jupiter.api.Test;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
// import org.springframework.boot.test.mock.mockito.MockBean;
// import org.springframework.http.MediaType;
// import org.springframework.test.web.servlet.MockMvc;

// import java.math.BigDecimal;

// import static org.mockito.ArgumentMatchers.any;
// import static org.mockito.ArgumentMatchers.anyString;
// import static org.mockito.Mockito.when;
// import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
// import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
// import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
// import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// @WebMvcTest(PaymentController.class)
// class PaymentControllerTest {
//         // test
//         @Autowired
//         private MockMvc mockMvc;

//         @Autowired
//         private ObjectMapper objectMapper;

//         @MockBean
//         private PaymentService paymentService;

//         @Test
//         @DisplayName("POST /api/v1/payments/vnpay/create-url should return paymentUrl")
//         void shouldCreateVnPayUrl() throws Exception {
//                 VnPayPaymentUrlRequest request = VnPayPaymentUrlRequest.builder()
//                                 .orderId(1L)
//                                 .amount(BigDecimal.valueOf(50000))
//                                 .orderInfo("Thanh toan don 1")
//                                 .build();

//                 VnPayPaymentUrlResponse response = VnPayPaymentUrlResponse.builder()
//                                 .paymentUrl("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=5000000")
//                                 .transactionRef("1_1712345678")
//                                 .build();

//                 when(paymentService.createVnPayPaymentUrl(any(VnPayPaymentUrlRequest.class), anyString()))
//                                 .thenReturn(response);

//                 mockMvc.perform(post("/api/v1/payments/vnpay/create-url")
//                                 .contentType(MediaType.APPLICATION_JSON)
//                                 .content(objectMapper.writeValueAsString(request)))
//                                 .andExpect(status().isOk())
//                                 .andExpect(jsonPath("$.status").value(200))
//                                 .andExpect(jsonPath("$.data.paymentUrl").value(
//                                                 "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=5000000"));
//         }

//         @Test
//         @DisplayName("POST /api/v1/payments/cod should create COD payment")
//         void shouldCreateCodPayment() throws Exception {
//                 PaymentInitiateRequest request = PaymentInitiateRequest.builder()
//                                 .orderId(2L)
//                                 .amount(BigDecimal.valueOf(100000))
//                                 .paymentMethod(PaymentMethod.CASH)
//                                 .build();

//                 PaymentResponseDto responseDto = PaymentResponseDto.builder()
//                                 .id(1L)
//                                 .orderId(2L)
//                                 .paymentMethod(PaymentMethod.CASH)
//                                 .status(PaymentStatus.PENDING)
//                                 .amount(BigDecimal.valueOf(100000))
//                                 .build();

//                 when(paymentService.createCodPayment(any(PaymentInitiateRequest.class)))
//                                 .thenReturn(responseDto);

//                 mockMvc.perform(post("/api/v1/payments/cod")
//                                 .contentType(MediaType.APPLICATION_JSON)
//                                 .content(objectMapper.writeValueAsString(request)))
//                                 .andExpect(status().isCreated())
//                                 .andExpect(jsonPath("$.status").value(201))
//                                 .andExpect(jsonPath("$.data.orderId").value(2))
//                                 .andExpect(jsonPath("$.data.paymentMethod").value("CASH"));
//         }

//         @Test
//         @DisplayName("GET /api/v1/payments/order/{orderId} should return payment detail")
//         void shouldGetPaymentByOrderId() throws Exception {
//                 PaymentResponseDto responseDto = PaymentResponseDto.builder()
//                                 .id(1L)
//                                 .orderId(3L)
//                                 .paymentMethod(PaymentMethod.E_WALLET)
//                                 .status(PaymentStatus.SUCCESS)
//                                 .amount(BigDecimal.valueOf(120000))
//                                 .build();

//                 when(paymentService.getPaymentByOrderId(3L)).thenReturn(responseDto);

//                 mockMvc.perform(get("/api/v1/payments/order/3"))
//                                 .andExpect(status().isOk())
//                                 .andExpect(jsonPath("$.status").value(200))
//                                 .andExpect(jsonPath("$.data.status").value("SUCCESS"));
//         }
// }
