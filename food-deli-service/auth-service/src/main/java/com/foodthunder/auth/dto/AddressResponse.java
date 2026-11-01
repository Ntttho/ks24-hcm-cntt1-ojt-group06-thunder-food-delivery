package com.foodthunder.auth.dto;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record AddressResponse(
        Long id,
        Long userId,
        String address,
        Double latitude,
        Double longitude,
        Boolean isDefault,
        String label,
        LocalDateTime createdAt
) {}
