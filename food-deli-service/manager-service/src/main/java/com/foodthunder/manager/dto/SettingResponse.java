package com.foodthunder.manager.dto;

import java.time.LocalDateTime;

public record SettingResponse(
        Integer id,
        String configKey,
        Object configValue,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
