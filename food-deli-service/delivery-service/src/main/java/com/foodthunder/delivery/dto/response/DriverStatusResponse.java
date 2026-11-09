package com.foodthunder.delivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverStatusResponse {
    private Integer userId;
    private String licensePlate;
    private String vehicleType;
    private String approvalStatus;
    private Boolean isOnline;
}
