package com.foodthunder.auth.dto;

public record UpdateUserStatusRequest(
        String status, // "ACTIVE" or "LOCKED"
        Boolean isActive
) {}
