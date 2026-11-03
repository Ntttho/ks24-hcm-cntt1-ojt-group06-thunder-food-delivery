package com.foodthunder.payment.dto.client;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemoteUpdateOrderStatusRequest {

    @NotBlank(message = "Mã trạng thái mới không được để trống")
    private String statusCode;

    private String reason;
}
