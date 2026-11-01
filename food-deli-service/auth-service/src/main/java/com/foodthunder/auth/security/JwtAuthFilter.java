package com.foodthunder.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            // 1. Check Gateway-forwarded headers
            String headerUserId = request.getHeader("X-User-Id");
            String headerUserRole = request.getHeader("X-User-Role");
            String headerUserPhone = request.getHeader("X-User-Phone");

            if (headerUserId != null && !headerUserId.isBlank()) {
                Long userId = Long.valueOf(headerUserId);
                String role = (headerUserRole != null && !headerUserRole.isBlank()) ? headerUserRole : "CUSTOMER";
                String phone = (headerUserPhone != null) ? headerUserPhone : "";

                UserPrincipal principal = UserPrincipal.create(userId, phone, role, List.of(role));
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        principal, null, principal.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);

                filterChain.doFilter(request, response);
                return;
            }

            // 2. Fallback: Parse Bearer token directly
            String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                if (jwtProvider.validateToken(token)) {
                    Long userId = jwtProvider.getUserIdFromToken(token);
                    String phone = jwtProvider.getPhoneFromToken(token);
                    String role = jwtProvider.getRoleFromToken(token);
                    List<String> roles = jwtProvider.getRolesFromToken(token);

                    UserPrincipal principal = UserPrincipal.create(userId, phone, role, roles);
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            principal, null, principal.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context: {}", ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
