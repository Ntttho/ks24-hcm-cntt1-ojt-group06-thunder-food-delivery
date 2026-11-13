package com.foodthunder.auth.security;

import com.foodthunder.auth.exception.UnauthorizedException;
import org.springframework.security.access.AccessDeniedException;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Tiện ích kiểm tra phân quyền vai trò từ header X-User-Role của API Gateway.
 */
public final class RoleGuard {

    private RoleGuard() {
    }

    public static void requireAdmin(String roleHeader, String deniedMessage) {
        if (roleHeader == null || roleHeader.isBlank()) {
            throw new UnauthorizedException("Thiếu thông tin phân quyền vai trò người dùng");
        }
        Set<String> roles = Arrays.stream(roleHeader.split("[,\\s]+"))
                .map(String::trim)
                .map(String::toUpperCase)
                .collect(Collectors.toSet());
        if (!roles.contains("ROLE_ADMIN") && !roles.contains("ADMIN")) {
            throw new AccessDeniedException(deniedMessage);
        }
    }
}

