package com.foodthunder.delivery.client;

import com.foodthunder.common.dto.response.ApiResponse;
import com.foodthunder.delivery.dto.client.RemoteUserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "auth-service", fallbackFactory = UserClientFallbackFactory.class)
public interface UserClient {

    @GetMapping("/api/v1/users/{id}")
    ResponseEntity<ApiResponse<RemoteUserDto>> getUserById(@PathVariable("id") Long id);
}
