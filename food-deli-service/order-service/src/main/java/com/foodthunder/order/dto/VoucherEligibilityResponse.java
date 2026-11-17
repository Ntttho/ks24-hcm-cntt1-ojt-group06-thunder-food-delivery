package com.foodthunder.order.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherEligibilityResponse {
    @JsonProperty("isNewUser")
    private Boolean isNewUser;
    private Long priorOrderCount;
}

