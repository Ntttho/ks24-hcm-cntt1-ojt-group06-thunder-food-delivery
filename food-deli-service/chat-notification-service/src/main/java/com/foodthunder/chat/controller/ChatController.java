package com.foodthunder.chat.controller;

import com.foodthunder.chat.dto.ChatMessageDto;
import com.foodthunder.chat.dto.SendMessageRequest;
import com.foodthunder.chat.service.ChatService;
import com.foodthunder.common.dto.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;

    /**
     * GET /api/v1/chat/orders/{orderId}
     * Lấy toàn bộ lịch sử tin nhắn của một đơn hàng
     */
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getOrderChatHistory(@PathVariable Long orderId) {
        log.info("Fetching chat history for orderId: {}", orderId);
        List<ChatMessageDto> history = chatService.getOrderChatHistory(orderId);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử chat thành công", history));
    }

    /**
     * GET /api/v1/chat/shops/{shopId}
     * Lấy toàn bộ lịch sử tin nhắn của một quán ăn
     */
    @GetMapping("/shops/{shopId}")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getShopChatHistory(@PathVariable Long shopId) {
        log.info("Fetching chat history for shopId: {}", shopId);
        List<ChatMessageDto> history = chatService.getShopChatHistory(shopId);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử chat quán ăn thành công", history));
    }

    /**
     * POST /api/v1/chat
     * Gửi tin nhắn mới qua HTTP REST (kèm lưu DB + WebSocket broadcast)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ChatMessageDto>> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        if (userId != null && request.getSenderId() == null) {
            request.setSenderId(userId);
        }
        if (userRole != null && request.getSenderRole() == null) {
            request.setSenderRole(userRole);
        }

        log.info("Sending chat message for orderId: {}, senderId: {}, role: {}",
                request.getOrderId(), request.getSenderId(), request.getSenderRole());

        ChatMessageDto result = chatService.sendMessage(request);
        return ResponseEntity.ok(ApiResponse.success("Gửi tin nhắn thành công", result));
    }

    /**
     * WebSocket Message Handler: /app/chat.send
     * Nhận tin nhắn gửi trực tiếp qua giao thức STOMP
     */
    @MessageMapping({"/chat.send", "/chat.sendMessage"})
    public void sendViaSocket(@Payload SendMessageRequest request) {
        log.info("Received WebSocket chat message via STOMP for orderId: {}", request.getOrderId());
        chatService.sendMessage(request);
    }
}

