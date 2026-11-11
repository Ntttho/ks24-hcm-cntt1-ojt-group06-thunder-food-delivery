package com.foodthunder.order.client;

import com.foodthunder.common.dto.response.ApiResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "chat-notification-service", path = "/api/v1/notifications")
public interface NotificationClient {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class BroadcastRequest {
        private String topic;
        private Object data;
    }

    @PostMapping("/broadcast")
    ApiResponse<Void> broadcastEvent(@RequestBody BroadcastRequest request);
}

