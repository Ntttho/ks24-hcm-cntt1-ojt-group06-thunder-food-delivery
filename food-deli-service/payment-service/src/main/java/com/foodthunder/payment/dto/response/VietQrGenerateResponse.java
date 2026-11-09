package com.foodthunder.payment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VietQrGenerateResponse {

    private Long orderId;
    private BigDecimal amount;
    private String qrCodeUrl;
    private String bankBin;
    private String bankName;
    private String accountNo;
    private String accountName;
    private String paymentContent;
    private String status;
    private Instant expiresAt;
}

