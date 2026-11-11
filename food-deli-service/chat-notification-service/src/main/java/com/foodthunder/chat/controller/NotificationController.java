package com.foodthunder.chat.controller;

import com.foodthunder.chat.service.ChatService;
import com.foodthunder.common.dto.response.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final ChatService chatService;

    @Data
    public static class BroadcastEventRequest {
        private String topic;
        private Object data;
    }

    /**
     * POST /api/v1/notifications/broadcast
     * Cho phép các service khác bắn sự kiện qua WebSocket Hub
     */
    @PostMapping("/broadcast")
    public ResponseEntity<ApiResponse<Void>> broadcastEvent(@RequestBody BroadcastEventRequest request) {
        log.info("Broadcasting event to topic: {}", request.getTopic());
        chatService.broadcastTopicMessage(request.getTopic(), request.getData());
        return ResponseEntity.ok(ApiResponse.success("Phát sự kiện thành công", null));
    }
}

