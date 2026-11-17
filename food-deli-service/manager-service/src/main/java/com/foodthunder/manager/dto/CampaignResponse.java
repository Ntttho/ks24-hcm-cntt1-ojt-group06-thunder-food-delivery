package com.foodthunder.manager.dto;

import java.time.LocalDateTime;

public record CampaignResponse(
        Long id,
        String name,
        String description,
        LocalDateTime startDate,
        LocalDateTime endDate,
        CampaignStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
