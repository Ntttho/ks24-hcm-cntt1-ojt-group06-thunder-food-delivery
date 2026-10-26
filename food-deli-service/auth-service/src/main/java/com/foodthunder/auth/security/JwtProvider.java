package com.foodthunder.auth.security;

import com.foodthunder.auth.model.Role;
import com.foodthunder.auth.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtProvider {

    @Value("${application.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String secret;

    @Value("${application.jwt.expiration-ms:86400000}")
    private long expirationMs; // 24 hours default

    private SecretKey key;

    @PostConstruct
    public void init() {
        byte[] keyBytes;
        try {
            keyBytes = io.jsonwebtoken.io.Decoders.BASE64.decode(secret);
        } catch (Exception e) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(User user, String activeRole) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        String roleToUse = activeRole != null && !activeRole.isBlank()
                ? activeRole
                : (roleNames.isEmpty() ? "CUSTOMER" : roleNames.iterator().next());

        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("userId", user.getId())
                .claim("phone", user.getPhone())
                .claim("role", roleToUse)
                .claim("roles", roleNames)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = getClaims(token);
        Object userId = claims.get("userId");
        if (userId != null) {
            return Long.valueOf(String.valueOf(userId));
        }
        return Long.valueOf(claims.getSubject());
    }

    public String getPhoneFromToken(String token) {
        Claims claims = getClaims(token);
        Object phone = claims.get("phone");
        return phone != null ? String.valueOf(phone) : "";
    }

    public String getRoleFromToken(String token) {
        Claims claims = getClaims(token);
        Object role = claims.get("role");
        return role != null ? String.valueOf(role) : "CUSTOMER";
    }

    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        Claims claims = getClaims(token);
        Object roles = claims.get("roles");
        if (roles instanceof List<?>) {
            return (List<String>) roles;
        }
        return List.of(getRoleFromToken(token));
    }
}
