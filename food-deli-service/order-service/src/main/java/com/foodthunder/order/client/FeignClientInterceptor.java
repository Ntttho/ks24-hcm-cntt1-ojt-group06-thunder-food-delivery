package com.foodthunder.order.client;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
public class FeignClientInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate template) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && !authHeader.isBlank()) {
                template.header(HttpHeaders.AUTHORIZATION, authHeader);
            }
            String userId = request.getHeader("X-User-Id");
            if (userId != null) {
                template.header("X-User-Id", userId);
            }
            String userRole = request.getHeader("X-User-Role");
            if (userRole != null) {
                template.header("X-User-Role", userRole);
            }
        }
    }
}
