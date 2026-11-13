package com.foodthunder.delivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverApprovalDto {
    private Integer userId;
    private String licensePlate;
    private String idCardNumber;
    private String vehicleType;
    private String approvalStatus;
    private String rejectReason;
    private Boolean isOnline;
}

