package com.foodthunder.order.controller;

import com.foodthunder.order.dto.ApiResponse;
import com.foodthunder.order.dto.ChatMessageDto;
import com.foodthunder.order.dto.SendMessageRequest;
import com.foodthunder.order.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final ChatService chatService;

    /**
     * Lấy lịch sử chat theo mã đơn hàng
     * GET /api/v1/chat/orders/{orderId}
     */
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getOrderChatHistory(@PathVariable Long orderId) {
        List<ChatMessageDto> history = chatService.getOrderChatHistory(orderId);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử chat thành công", history));
    }

    /**
     * Gửi tin nhắn mới qua REST API
     * POST /api/v1/chat
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ChatMessageDto>> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestHeader(value = "X-User-Role", required = false) String headerUserRole
    ) {
        if (request.getSenderId() == null && headerUserId != null) {
            request.setSenderId(headerUserId);
        }
        if ((request.getSenderRole() == null || request.getSenderRole().isBlank()) && headerUserRole != null) {
            request.setSenderRole(headerUserRole);
        }

        ChatMessageDto response = chatService.sendMessage(request);
        return ResponseEntity.ok(ApiResponse.success("Gửi tin nhắn thành công", response));
    }

    /**
     * Xử lý gửi tin nhắn trực tiếp qua STOMP WebSocket: /app/chat.send hoặc /app/chat.sendMessage
     */
    @MessageMapping({"/chat.send", "/chat.sendMessage"})
    public void handleWebSocketChatMessage(@Payload SendMessageRequest request) {
        log.info("Received WebSocket chat message for order {}: {}", request.getOrderId(), request.getMessage());
        chatService.sendMessage(request);
    }
}
