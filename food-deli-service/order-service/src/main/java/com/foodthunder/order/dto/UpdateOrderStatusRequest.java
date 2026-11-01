package com.foodthunder.order.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrderStatusRequest {

    @NotBlank(message = "Mã trạng thái mới (statusCode) không được để trống")
    private String statusCode;

    private String reason;
}
