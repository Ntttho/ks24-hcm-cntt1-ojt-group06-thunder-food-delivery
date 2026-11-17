package com.foodthunder.manager.security;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;

public final class AdminRoleGuard {
    private AdminRoleGuard() {
    }

    public static void requireAdmin(String roleHeader) {
        if (roleHeader == null || roleHeader.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Thiếu thông tin vai trò người dùng");
        }
        boolean admin = Arrays.stream(roleHeader.split("[,\\s]+"))
                .anyMatch(role -> "ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role));
        if (!admin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Chỉ quản trị viên mới được quản lý cấu hình hệ thống");
        }
    }
}
