package com.foodthunder.delivery.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemoteUpdateOrderStatusRequest {
    private String statusCode;
    private String reason;
}
