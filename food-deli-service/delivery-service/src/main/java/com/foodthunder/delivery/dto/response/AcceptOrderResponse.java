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
public class AcceptOrderResponse {
    private Long offerId;
    private Long orderId;
    private Integer driverId;
    private String status;
    private LocalDateTime respondedAt;
}
