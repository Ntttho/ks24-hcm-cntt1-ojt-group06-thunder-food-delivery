package com.foodthunder.gateway.util;

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

@Slf4j
@Component
public class JwtUtil {

    @Value("${application.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String secret;

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

    public String extractUserId(Claims claims) {
        Object userId = claims.get("userId");
        if (userId != null) {
            return String.valueOf(userId);
        }
        return claims.getSubject();
    }

    public String extractPhone(Claims claims) {
        Object phone = claims.get("phone");
        return phone != null ? String.valueOf(phone) : "";
    }

    public String extractRole(Claims claims) {
        Object role = claims.get("role");
        if (role != null) {
            return String.valueOf(role);
        }
        Object roles = claims.get("roles");
        if (roles instanceof java.util.List<?> list && !list.isEmpty()) {
            return String.valueOf(list.get(0));
        }
        return "CUSTOMER";
    }
}
