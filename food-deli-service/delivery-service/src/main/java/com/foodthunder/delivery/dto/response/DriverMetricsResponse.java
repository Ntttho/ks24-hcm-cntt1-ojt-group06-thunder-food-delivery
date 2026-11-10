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
public class DriverMetricsResponse {

    private Integer driverId;
    private Long totalOrders;
    private Long completedOrders;
    private Long cancelledOrders;
    private Double completionRate;
    private Double acceptanceRate;
    private Double cancellationRate;
    private Double totalEarnings;
    private Double ratingAvg;

    // Rolling window metrics (tối đa 100 giao dịch gần nhất theo PRD)
    private Long rollingWindowOffers;
    private Long rollingWindowAccepted;
    private Long rollingWindowCancelled;

    // Chi tiết xử phạt & Tự động tạm khóa nhận cuốc
    private Boolean isSuspended;
    private String penaltyType;
    private String penaltyReason;
    private LocalDateTime penaltyEndsAt;
    private String performanceStatus; // GOOD, WARNING, DANGER
}


