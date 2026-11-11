package com.foodthunder.auth.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Builder
public record UserDto(
        Long id,
        String phone,
        String email,
        String fullName,
        BigDecimal ratingAvg,
        String licensePlate,
        Set<String> roles,
        String role,
        String status,
        LocalDateTime createdAt,
        LocalDateTime deletedAt
) {}
