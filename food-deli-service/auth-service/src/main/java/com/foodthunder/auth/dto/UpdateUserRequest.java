package com.foodthunder.auth.dto;

import java.util.List;

public record UpdateUserRequest(
        String fullName,
        String phone,
        String email,
        String password,
        List<String> roles,
        String role,
        String status
) {}
