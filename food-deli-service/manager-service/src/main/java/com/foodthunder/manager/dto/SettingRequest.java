package com.foodthunder.manager.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SettingRequest(
        @NotBlank @Size(max = 50) @Pattern(regexp = "[a-zA-Z0-9._-]+", message = "Key chỉ được chứa chữ, số, dấu chấm, gạch ngang hoặc gạch dưới")
        String configKey,
        @NotNull JsonNode configValue,
        @Size(max = 2000) String description
) {
}
