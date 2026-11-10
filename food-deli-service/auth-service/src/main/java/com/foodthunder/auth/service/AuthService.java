package com.foodthunder.auth.service;

import com.foodthunder.auth.dto.*;

import java.math.BigDecimal;
import java.util.List;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(RegisterRequest request);
    UserDto getProfile(Long userId);
    UserDto updateProfile(Long userId, UpdateProfileRequest request);
    PageResponse<UserDto> getUsers(String search, String role, int page, int size);
    List<UserDto> getAllUsers();
    UserDto updateRating(Long userId, BigDecimal ratingAvg);
}
