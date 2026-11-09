package com.foodthunder.review.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewSummaryDto {
    private Long targetId;
    private String targetType;
    private Long totalReviews;
    private Double averageRating;

    @Builder.Default
    private Map<Integer, Long> ratingBreakdown = new HashMap<>();

    private List<ReviewResponseDto> recentReviews;
}

