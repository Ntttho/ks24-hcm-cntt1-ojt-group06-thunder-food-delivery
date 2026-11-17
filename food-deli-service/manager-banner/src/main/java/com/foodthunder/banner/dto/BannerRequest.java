package com.foodthunder.banner.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BannerRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 2000) String description,
        @NotBlank @Size(max = 2048) String imageUrl,
        @Size(max = 2048) String targetUrl,
        Long campaignId,
        @NotNull Boolean isActive,
        @NotNull @Min(1) Integer displayOrder
) {
}
