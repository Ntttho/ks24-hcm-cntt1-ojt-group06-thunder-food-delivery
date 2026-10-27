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
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password",
            "/api/v1/auth/refresh"
    );

    private static final List<String> PATTERN_PUBLIC_PATHS = List.of(
            "/api/v1/auth/login/**",
            "/api/v1/auth/register/**",
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
            "/api/v1/addresses/suggest",
            "/api/v1/addresses/detail/**",
            "/api/v1/addresses/reverse"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        HttpMethod method = request.getMethod();

        // 1. Check if path is public
        if (isPublicPath(path, method)) {
            // Optional: If Authorization header is provided, propagate user claims anyway
            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                if (jwtUtil.validateToken(token)) {
                    Claims claims = jwtUtil.getClaims(token);
                    ServerHttpRequest mutatedRequest = request.mutate()
                            .header("X-User-Id", jwtUtil.extractUserId(claims))
                            .header("X-User-Role", jwtUtil.extractRole(claims))
                            .header("X-User-Phone", jwtUtil.extractPhone(claims))
                            .build();
                    return chain.filter(exchange.mutate().request(mutatedRequest).build());
                }
            }
            return chain.filter(exchange);
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

        ServerHttpRequest mutatedRequest = request.mutate()
                .header("X-User-Id", userId)
                .header("X-User-Role", role)
                .header("X-User-Phone", phone)
                .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
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
