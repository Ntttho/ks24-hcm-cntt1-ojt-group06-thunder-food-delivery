package com.foodthunder.gateway.filter;

import com.foodthunder.gateway.util.JwtUtil;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class JwtAuthenticationFilterTest {

    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    private JwtAuthenticationFilter filter;
    private SecretKey signingKey;

    @BeforeEach
    void setUp() {
        JwtUtil jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", TEST_SECRET);
        jwtUtil.init();
        byte[] keyBytes;
        try {
            keyBytes = io.jsonwebtoken.io.Decoders.BASE64.decode(TEST_SECRET);
        } catch (Exception ex) {
            keyBytes = TEST_SECRET.getBytes(StandardCharsets.UTF_8);
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.filter = new JwtAuthenticationFilter(jwtUtil);
    }

    @Test
    @DisplayName("Chặn request giả mạo X-User-Role=ADMIN không có JWT tới /api/v1/users/admin/analytics-counts (401)")
    void filter_unauthenticatedSpoofedUserAdminStats_returns401() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/v1/users/admin/analytics-counts")
                        .header("X-User-Role", "ADMIN")
                        .build()
        );

        AtomicReference<Boolean> chainInvoked = new AtomicReference<>(false);
        GatewayFilterChain chain = ex -> {
            chainInvoked.set(true);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(chainInvoked.get()).isFalse();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Chặn request giả mạo X-User-Role=ADMIN không có JWT tới /api/v1/restaurants/admin/analytics-counts (401)")
    void filter_unauthenticatedSpoofedRestaurantAdminStats_returns401() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/v1/restaurants/admin/analytics-counts")
                        .header("X-User-Role", "ADMIN")
                        .build()
        );

        AtomicReference<Boolean> chainInvoked = new AtomicReference<>(false);
        GatewayFilterChain chain = ex -> {
            chainInvoked.set(true);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(chainInvoked.get()).isFalse();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Chặn JWT của CUSTOMER khi gọi /api/v1/admin/analytics/summary hoặc /api/v1/restaurants/admin/analytics-counts (403)")
    void filter_customerJwtAccessingAdminAnalytics_returns403() {
        String customerToken = buildToken("10", "CUSTOMER", List.of("ROLE_CUSTOMER"));
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/v1/restaurants/admin/analytics-counts")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken)
                        .build()
        );

        AtomicReference<Boolean> chainInvoked = new AtomicReference<>(false);
        GatewayFilterChain chain = ex -> {
            chainInvoked.set(true);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(chainInvoked.get()).isFalse();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Cho phép JWT có ROLE_ADMIN trong danh sách roles đi qua /api/v1/admin/analytics/summary và chuẩn hóa header X-User-Role")
    void filter_multiRoleAdminJwt_normalizesRoleAndPasses() {
        String multiRoleAdminToken = buildToken("5", "CUSTOMER", List.of("CUSTOMER", "ROLE_ADMIN"));
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/v1/admin/analytics/summary")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + multiRoleAdminToken)
                        .build()
        );

        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
        GatewayFilterChain chain = ex -> {
            forwarded.set(ex);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(forwarded.get()).isNotNull();
        assertThat(forwarded.get().getRequest().getHeaders().getFirst("X-User-Id")).isEqualTo("5");
        assertThat(forwarded.get().getRequest().getHeaders().getFirst("X-User-Role")).isEqualTo("ADMIN");
    }

    @Test
    @DisplayName("Gỡ bỏ header X-User-Role giả mạo trên public endpoint khi không có JWT")
    void filter_publicEndpointWithoutJwt_stripsSpoofedIdentityHeaders() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/v1/restaurants")
                        .header("X-User-Role", "ADMIN")
                        .header("X-User-Id", "1")
                        .build()
        );

        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
        GatewayFilterChain chain = ex -> {
            forwarded.set(ex);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(forwarded.get()).isNotNull();
        assertThat(forwarded.get().getRequest().getHeaders().getFirst("X-User-Role")).isNull();
        assertThat(forwarded.get().getRequest().getHeaders().getFirst("X-User-Id")).isNull();
    }

    @Test
    @DisplayName("Vẫn cho phép POST /api/v1/auth/login/admin đi qua không cần JWT")
    void filter_adminLoginEndpoint_remainsPublic() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/auth/login/admin").build()
        );

        AtomicReference<Boolean> chainInvoked = new AtomicReference<>(false);
        GatewayFilterChain chain = ex -> {
            chainInvoked.set(true);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(chainInvoked.get()).isTrue();
    }

    private String buildToken(String userId, String primaryRole, List<String> roles) {
        return Jwts.builder()
                .subject("0900000005")
                .claim("userId", userId)
                .claim("role", primaryRole)
                .claim("roles", roles)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(signingKey)
                .compact();
    }
}

