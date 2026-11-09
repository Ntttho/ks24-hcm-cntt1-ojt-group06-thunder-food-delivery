package com.foodthunder.review.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderReviewStatusDto {
    private Long orderId;
    private Boolean hasDriver;
    private Long driverId;
    private Boolean isRestaurantReviewed;
    private Boolean isDriverReviewed;
    private Boolean canReviewRestaurant;
    private Boolean canReviewDriver;
    private Long remainingSeconds;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime completedAt;

    private String message;
}

