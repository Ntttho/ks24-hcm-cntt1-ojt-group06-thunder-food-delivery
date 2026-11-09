package com.foodthunder.delivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private Double totalEarnings;
    private Double ratingAvg;
}
