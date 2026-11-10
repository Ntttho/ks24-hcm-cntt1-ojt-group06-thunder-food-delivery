package com.foodthunder.auth.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Builder
public record UserDto(
        Long id,
        String phone,
        String fullName,
        BigDecimal ratingAvg,
        String licensePlate,
        Set<String> roles,
        String role,
        LocalDateTime createdAt
) {}
