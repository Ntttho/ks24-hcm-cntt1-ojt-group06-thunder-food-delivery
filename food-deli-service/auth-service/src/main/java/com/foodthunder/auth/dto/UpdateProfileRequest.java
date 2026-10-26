package com.foodthunder.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
        @NotBlank(message = "Full name cannot be empty")
        String fullName
) {}
