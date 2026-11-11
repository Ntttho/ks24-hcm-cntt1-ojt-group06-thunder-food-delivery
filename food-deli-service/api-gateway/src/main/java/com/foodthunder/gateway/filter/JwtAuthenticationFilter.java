package com.foodthunder.gateway.filter;

import com.foodthunder.gateway.util.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    private static final List<String> EXACT_PUBLIC_PATHS = List.of(
            "/ws",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password",
            "/api/v1/auth/refresh"
    );

    private static final List<String> PATTERN_PUBLIC_PATHS = List.of(
            "/ws/**",
            "/ws-food-deli/**",
            "/api/v1/chat/**",
            "/api/v1/notifications/**",
            "/api/v1/auth/login/**",
            "/api/v1/auth/register/**",
            "/api/v1/payments/**",
            "/actuator/**",
            "/eureka/**",
            "/fallback/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/webjars/**"
    );

    private static final List<String> PUBLIC_GET_PATTERNS = List.of(
            "/api/v1/restaurants/**",
            "/api/v1/shops/**",
            "/api/v1/categories/**",
            "/api/v1/products/**",
            "/api/v1/foods/**",
            "/api/v1/toppings/**",
            "/api/v1/vouchers/**",
            "/api/v1/reviews/restaurants/**",
            "/api/v1/reviews/shops/**",
            "/api/v1/users/**",
            "/api/v1/cart/**",
            "/api/v1/addresses/suggest",
            "/api/v1/addresses/detail/**",
            "/api/v1/addresses/reverse",
            "/api/v1/deliveries/orders/**/location",
            "/api/v1/delivery/orders/**/location",
            "/api/v1/drivers/**/location"
    );

    private static final List<String> ADMIN_ONLY_PATTERNS = List.of(
            "/api/v1/admin/**",
            "/api/v1/users/admin/**",
            "/api/v1/restaurants/admin/**",
            "/api/v1/reviews/admin",
            "/api/v1/reviews/admin/**"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        HttpMethod method = request.getMethod();

        // 1. Check if path is public (admin endpoints must never bypass JWT validation)
        if (!isAdminPath(path) && isPublicPath(path, method)) {
            // Optional: If Authorization header is provided, propagate trusted user claims
            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                if (jwtUtil.validateToken(token)) {
                    Claims claims = jwtUtil.getClaims(token);
                    ServerHttpRequest mutatedRequest = mutateWithIdentity(
                            request,
                            jwtUtil.extractUserId(claims),
                            jwtUtil.extractRole(claims),
                            jwtUtil.extractPhone(claims)
                    );
                    return chain.filter(exchange.mutate().request(mutatedRequest).build());
                }
            }
            // Strip spoofable internal identity headers from unauthenticated client requests
            ServerHttpRequest sanitizedRequest = request.mutate()
                    .headers(headers -> {
                        headers.remove("X-User-Id");
                        headers.remove("X-User-Role");
                        headers.remove("X-User-Phone");
                    })
                    .build();
            return chain.filter(exchange.mutate().request(sanitizedRequest).build());
        }

        // 2. Protected endpoint: Require valid Bearer token
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Missing or invalid Authorization header for path: {}", path);
            return onError(exchange, HttpStatus.UNAUTHORIZED, "Unauthorized: Bearer token is missing");
        }

        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            log.warn("Invalid or expired JWT token for path: {}", path);
            return onError(exchange, HttpStatus.UNAUTHORIZED, "Unauthorized: Token is invalid or expired");
        }

        Claims claims = jwtUtil.getClaims(token);
        String userId = jwtUtil.extractUserId(claims);
        String role = jwtUtil.extractRole(claims);
        String phone = jwtUtil.extractPhone(claims);

        if (isAdminPath(path)) {
            if (!jwtUtil.hasAdminRole(claims)) {
                log.warn("Forbidden access attempt to admin path {} by userId={}, role={}", path, userId, role);
                return onError(exchange, HttpStatus.FORBIDDEN, "Forbidden: Admin privileges required");
            }
            if (!jwtUtil.isAdminRoleName(role)) {
                role = "ADMIN";
            }
        }

        ServerHttpRequest mutatedRequest = mutateWithIdentity(request, userId, role, phone);
        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    private ServerHttpRequest mutateWithIdentity(ServerHttpRequest request, String userId, String role, String phone) {
        return request.mutate()
                .headers(headers -> {
                    headers.set("X-User-Id", userId);
                    headers.set("X-User-Role", role);
                    headers.set("X-User-Phone", phone);
                })
                .build();
    }

    private boolean isAdminPath(String path) {
        for (String pattern : ADMIN_ONLY_PATTERNS) {
            if (pathMatcher.match(pattern, path)) {
                return true;
            }
        }
        return false;
    }

    private boolean isPublicPath(String path, HttpMethod method) {
        if (EXACT_PUBLIC_PATHS.contains(path)) {
            return true;
        }

        for (String pattern : PATTERN_PUBLIC_PATHS) {
            if (pathMatcher.match(pattern, path)) {
                return true;
            }
        }

        if (HttpMethod.GET.equals(method)) {
            for (String pattern : PUBLIC_GET_PATTERNS) {
                if (pathMatcher.match(pattern, path)) {
                    return true;
                }
            }
        }

        return false;
    }

    private Mono<Void> onError(ServerWebExchange exchange, HttpStatus status, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String jsonResponse = String.format(
                "{\"status\":%d,\"message\":\"%s\",\"data\":null,\"timestamp\":\"%s\"}",
                status.value(), message, Instant.now().toString()
        );

        byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return -1; // Execute before routing filters
    }
}
