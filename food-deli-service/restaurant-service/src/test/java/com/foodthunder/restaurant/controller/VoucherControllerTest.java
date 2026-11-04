package com.foodthunder.restaurant.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.restaurant.dto.CreateVoucherRequest;
import com.foodthunder.restaurant.dto.ValidateVoucherRequest;
import com.foodthunder.restaurant.dto.VoucherDto;
import com.foodthunder.restaurant.dto.VoucherValidationResponse;
import com.foodthunder.restaurant.service.VoucherService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VoucherController.class)
@AutoConfigureMockMvc(addFilters = false)
class VoucherControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VoucherService voucherService;

    @Test
    @DisplayName("POST /api/v1/vouchers trả về 201 Created khi tạo voucher thành công")
    void createVoucher_success() throws Exception {
        CreateVoucherRequest req = CreateVoucherRequest.builder()
                .restaurantId(1)
                .code("QUAN20K")
                .discountType("FIXED")
                .discountValue(BigDecimal.valueOf(20000))
                .minOrderValue(BigDecimal.valueOf(50000))
                .expiryDate(LocalDateTime.now().plusDays(20))
                .build();

        VoucherDto resDto = VoucherDto.builder()
                .id(10)
                .restaurantId(1)
                .code("QUAN20K")
                .discountType("FIXED")
                .discountValue(BigDecimal.valueOf(20000))
                .isActive(true)
                .build();

        when(voucherService.createVoucher(any(CreateVoucherRequest.class), eq(3), eq("ROLE_MERCHANT")))
                .thenReturn(resDto);

        mockMvc.perform(post("/api/v1/vouchers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .header("X-User-Id", 3)
                        .header("X-User-Role", "ROLE_MERCHANT"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.data.code").value("QUAN20K"));
    }

    @Test
    @DisplayName("POST /api/v1/vouchers/validate trả về 200 OK kèm kết quả chiết khấu")
    void validateVoucher_success() throws Exception {
        ValidateVoucherRequest req = ValidateVoucherRequest.builder()
                .code("QUAN20K")
                .restaurantId(1)
                .orderAmount(BigDecimal.valueOf(100000))
                .build();

        VoucherValidationResponse validationResponse = VoucherValidationResponse.builder()
                .voucherId(10)
                .code("QUAN20K")
                .discountType("FIXED")
                .discountAmount(BigDecimal.valueOf(20000))
                .isValid(true)
                .message("Áp dụng mã voucher thành công")
                .build();

        when(voucherService.validateVoucher(any(ValidateVoucherRequest.class))).thenReturn(validationResponse);

        mockMvc.perform(post("/api/v1/vouchers/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.isValid").value(true))
                .andExpect(jsonPath("$.data.discountAmount").value(20000));
    }
}
