package com.foodthunder.delivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverWalletTransactionResponse {

    private String id;
    private Long orderId;
    private String orderCode;
    private String type;          // DELIVERY_FEE, COD_COLLECTED, BONUS, WITHDRAWAL, COD_SETTLED
    private String typeLabel;     // "Tiền cước giao hàng", "Thu hộ tiền mặt COD", v.v.
    private String direction;     // "IN", "HOLDING", "OUT"
    private Double amount;
    private Double balanceAfter;
    private String description;
    private LocalDateTime createdAt;
}

