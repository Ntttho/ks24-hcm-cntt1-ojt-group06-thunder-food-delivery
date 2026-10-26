package com.foodthunder.auth.dto;

import lombok.Builder;

@Builder
public record AuthResponse(
        String token,
        UserDto user
) {}
