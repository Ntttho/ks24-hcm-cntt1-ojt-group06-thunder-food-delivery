package com.foodthunder.manager.dto;

import java.time.LocalDateTime;

public record BannerResponse(
        Long id,
        String title,
        String description,
        String imageUrl,
        String targetUrl,
        Long campaignId,
        String status,
        boolean isActive,
        Integer displayOrder,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
