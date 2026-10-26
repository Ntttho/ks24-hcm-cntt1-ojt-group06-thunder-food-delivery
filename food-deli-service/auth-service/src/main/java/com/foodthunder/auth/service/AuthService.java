package com.foodthunder.auth.service;

import com.foodthunder.auth.dto.AuthResponse;
import com.foodthunder.auth.dto.LoginRequest;
import com.foodthunder.auth.dto.RegisterRequest;
import com.foodthunder.auth.dto.UpdateProfileRequest;
import com.foodthunder.auth.dto.UserDto;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(RegisterRequest request);
    UserDto getProfile(Long userId);
    UserDto updateProfile(Long userId, UpdateProfileRequest request);
}
