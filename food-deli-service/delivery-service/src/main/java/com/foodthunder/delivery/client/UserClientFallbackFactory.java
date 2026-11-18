package com.foodthunder.delivery.client;

import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.delivery.dto.client.RemoteUserDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class UserClientFallbackFactory implements FallbackFactory<UserClient> {

    @Override
    public UserClient create(Throwable cause) {
        return id -> {
            log.warn("Fallback triggered for UserClient.getUserById with id: {}, cause: {}",
                    id, cause != null ? cause.getMessage() : "unknown");
            RemoteUserDto fallbackDto = RemoteUserDto.builder()
                    .id(id)
                    .fullName("Tài xế #" + id)
                    .phone("090000000" + id)
                    .email("driver." + id + "@foodthunder.com")
                    .ratingAvg(java.math.BigDecimal.valueOf(5.00))
                    .build();
            return ResponseEntity.ok(ApiResponse.success("Fallback user profile", fallbackDto));
        };
    }
}
