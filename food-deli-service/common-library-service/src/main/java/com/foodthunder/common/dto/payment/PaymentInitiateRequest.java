package com.foodthunder.common.dto.payment;

import com.foodthunder.common.enums.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentInitiateRequest {

    @NotNull(message = "Mã đơn hàng không được để trống")
    private Long orderId;

    @NotNull(message = "Số tiền thanh toán không được để trống")
    @DecimalMin(value = "1000", message = "Số tiền thanh toán tối thiểu là 1.000 VNĐ")
    private BigDecimal amount;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    private PaymentMethod paymentMethod;

    private String idempotencyKey;
    private String orderInfo;
    private String clientIp;
    private String returnUrl;
}
