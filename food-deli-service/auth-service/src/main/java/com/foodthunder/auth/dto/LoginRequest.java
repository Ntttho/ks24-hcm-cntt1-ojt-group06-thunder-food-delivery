package com.foodthunder.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record LoginRequest(
        @NotBlank(message = "Phone number is required")
        String phone,

        @NotBlank(message = "Password is required")
        String password,

        String role
) {}
