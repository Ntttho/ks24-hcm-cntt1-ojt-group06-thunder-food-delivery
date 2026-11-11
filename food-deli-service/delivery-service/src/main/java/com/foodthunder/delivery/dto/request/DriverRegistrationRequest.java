package com.foodthunder.delivery.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverRegistrationRequest {
    private String licensePlate;
    private String idCardNumber;
    private String vehicleType;
}
