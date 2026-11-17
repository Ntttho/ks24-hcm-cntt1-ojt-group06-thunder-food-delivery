package com.foodthunder.banner.dto;

import jakarta.validation.constraints.NotNull;

public record BannerStatusRequest(@NotNull Boolean isActive) {
}
