package com.foodthunder.manager.dto;

import jakarta.validation.constraints.NotNull;

public record BannerStatusRequest(@NotNull Boolean isActive) {
}
