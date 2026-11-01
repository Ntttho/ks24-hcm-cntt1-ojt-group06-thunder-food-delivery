package com.foodthunder.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record AddressRequest(
        @NotBlank(message = "Address text is required")
        String address,

        Double latitude,

        Double longitude,

        Boolean isDefault,

        String label
) {}
