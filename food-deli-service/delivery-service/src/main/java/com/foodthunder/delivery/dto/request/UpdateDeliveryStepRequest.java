package com.foodthunder.delivery.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDeliveryStepRequest {

    @NotBlank(message = "Bước chuyển trạng thái (step) không được để trống")
    private String step; // PICKING_UP, DELIVERING, COMPLETED

    private String note;

    private Double currentLat;

    private Double currentLng;
}

