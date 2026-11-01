package com.foodthunder.auth.service.impl;

import com.foodthunder.auth.dto.*;
import com.foodthunder.auth.exception.ConflictException;
import com.foodthunder.auth.exception.ResourceNotFoundException;
import com.foodthunder.auth.exception.UnauthorizedException;
import com.foodthunder.auth.model.Role;
import com.foodthunder.auth.model.User;
import com.foodthunder.auth.repository.RoleRepository;
import com.foodthunder.auth.repository.UserRepository;
import com.foodthunder.auth.security.JwtProvider;
import com.foodthunder.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByPhone(request.phone())
                .orElseThrow(() -> new UnauthorizedException("Invalid phone number or password"));

        boolean matches = passwordEncoder.matches(request.password(), user.getPassword());
        // Support legacy plain text migration if seed data was inserted unhashed
        if (!matches && request.password().equals(user.getPassword())) {
            log.info("Migrating plain-text password to BCrypt for user: {}", user.getPhone());
            user.setPassword(passwordEncoder.encode(request.password()));
            userRepository.save(user);
            matches = true;
        }

        if (!matches) {
            throw new UnauthorizedException("Invalid phone number or password");
        }

        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        String targetRole = request.role();
        if (targetRole != null && !targetRole.isBlank()) {
            targetRole = targetRole.toUpperCase();
            if ("SHIPPER".equals(targetRole)) {
                targetRole = "DRIVER";
            }
            if (!roleNames.contains(targetRole)) {
                log.warn("User {} attempted login with unauthorized role: {}", user.getPhone(), targetRole);
                throw new UnauthorizedException("Tài khoản chưa được cấp quyền truy cập với vai trò: " + targetRole);
            }
        } else {
            targetRole = roleNames.contains("CUSTOMER") ? "CUSTOMER"
                    : (roleNames.isEmpty() ? "CUSTOMER" : roleNames.iterator().next());
        }

        String token = jwtProvider.generateToken(user, targetRole);

        UserDto userDto = toUserDto(user, targetRole);
        log.info("User {} successfully logged in with role: {}", user.getPhone(), targetRole);

        return AuthResponse.builder()
                .token(token)
                .user(userDto)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByPhone(request.phone())) {
            throw new ConflictException("Phone number " + request.phone() + " is already registered");
        }

        String rawRole = (request.role() != null && !request.role().isBlank())
                ? request.role().toUpperCase()
                : "CUSTOMER";

        if ("SHIPPER".equals(rawRole)) {
            rawRole = "DRIVER";
        }

        if ("ADMIN".equals(rawRole)) {
            throw new com.foodthunder.auth.exception.BadRequestException("Không được phép tự đăng ký tài khoản Quản trị viên (ADMIN)");
        }

        final String roleName = rawRole;
        Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(Role.builder().name(roleName).build()));

        User user = User.builder()
                .phone(request.phone())
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .ratingAvg(new BigDecimal("5.00"))
                .build();

        user.addRole(role);
        User savedUser = userRepository.save(user);

        String token = jwtProvider.generateToken(savedUser, roleName);
        UserDto userDto = toUserDto(savedUser, roleName);

        log.info("New user registered successfully: id={}, phone={}, role={}", savedUser.getId(), savedUser.getPhone(), roleName);

        return AuthResponse.builder()
                .token(token)
                .user(userDto)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return toUserDto(user, null);
    }

    @Override
    @Transactional
    public UserDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setFullName(request.fullName());
        User updatedUser = userRepository.save(user);

        log.info("Updated profile for user id: {}", userId);
        return toUserDto(updatedUser, null);
    }

    private UserDto toUserDto(User user, String activeRole) {
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        String currentRole = activeRole != null ? activeRole
                : (roleNames.contains("CUSTOMER") ? "CUSTOMER"
                : (roleNames.isEmpty() ? "CUSTOMER" : roleNames.iterator().next()));

        return UserDto.builder()
                .id(user.getId())
                .phone(user.getPhone())
                .fullName(user.getFullName())
                .ratingAvg(user.getRatingAvg())
                .roles(roleNames)
                .role(currentRole)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
