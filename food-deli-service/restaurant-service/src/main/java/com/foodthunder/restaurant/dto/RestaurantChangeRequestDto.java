package com.foodthunder.restaurant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantChangeRequestDto {
    private Integer id;
    private Integer restaurantId;
    private String restaurantName;
    private Integer requestedBy;
    private String payload;
    private Map<String, Object> payloadData;
    private String status;
    private Integer reviewedBy;
    private LocalDateTime reviewedAt;
    private String rejectReason;
    private LocalDateTime createdAt;
}

