package com.foodthunder.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record RegisterRequest(
        @NotBlank(message = "Phone number is required")
        String phone,

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        String password,

        @NotBlank(message = "Full name is required")
        String fullName,

        @Email(message = "Invalid email format")
        String email,

        String role
) {
    public RegisterRequest(String phone, String password, String fullName, String role) {
        this(phone, password, fullName, null, role);
    }
}
