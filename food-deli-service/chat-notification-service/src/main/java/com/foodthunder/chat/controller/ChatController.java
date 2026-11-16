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
     * GET /api/v1/chat/orders/{orderId}/unread-count
     * Lấy số tin nhắn chưa đọc của đơn hàng
     */
    @GetMapping("/orders/{orderId}/unread-count")
    public ResponseEntity<ApiResponse<Long>> getOrderUnreadCount(
            @PathVariable Long orderId,
            @RequestParam(required = false, defaultValue = "CUSTOMER") String role
    ) {
        long count = chatService.getOrderUnreadCount(orderId, role);
        return ResponseEntity.ok(ApiResponse.success("Lấy số tin nhắn chưa đọc thành công", count));
    }

    /**
     * PUT /api/v1/chat/orders/{orderId}/read
     * Đánh dấu toàn bộ tin nhắn trong đơn hàng là đã đọc
     */
    @PutMapping("/orders/{orderId}/read")
    public ResponseEntity<ApiResponse<Void>> markOrderChatAsRead(
            @PathVariable Long orderId,
            @RequestParam(required = false, defaultValue = "CUSTOMER") String readerRole
    ) {
        chatService.markOrderChatAsRead(orderId, readerRole);
        return ResponseEntity.ok(ApiResponse.success("Đánh dấu đã đọc thành công", null));
    }

    /**
     * GET /api/v1/chat/shops/{shopId}/unread-count
     * Lấy số tin nhắn chưa đọc của quán ăn
     */
    @GetMapping("/shops/{shopId}/unread-count")
    public ResponseEntity<ApiResponse<Long>> getShopUnreadCount(
            @PathVariable Long shopId,
            @RequestParam(required = false, defaultValue = "MERCHANT") String role
    ) {
        long count = chatService.getShopUnreadCount(shopId, role);
        return ResponseEntity.ok(ApiResponse.success("Lấy số tin nhắn chưa đọc của quán thành công", count));
    }

    /**
     * PUT /api/v1/chat/shops/{shopId}/read
     * Đánh dấu toàn bộ tin nhắn trong quán là đã đọc
     */
    @PutMapping("/shops/{shopId}/read")
    public ResponseEntity<ApiResponse<Void>> markShopChatAsRead(
            @PathVariable Long shopId,
            @RequestParam(required = false, defaultValue = "MERCHANT") String readerRole
    ) {
        chatService.markShopChatAsRead(shopId, readerRole);
        return ResponseEntity.ok(ApiResponse.success("Đánh dấu đã đọc tin quán thành công", null));
    }

    /**
     * WebSocket Message Handler: /app/chat.send
     * Nhận tin nhắn gửi trực tiếp qua giao thức STOMP
     */
    @MessageMapping({"/chat.send", "/chat.sendMessage"})
    public void sendViaSocket(@Payload SendMessageRequest request) {
        log.info("Received WebSocket chat message via STOMP for orderId: {}, shopId: {}", 
                request.getOrderId(), request.getShopId());
        chatService.sendMessage(request);
    }

    /**
     * WebSocket Message Handler: /app/chat.markRead
     * Nhận sự kiện đánh dấu đã đọc qua STOMP
     */
    @MessageMapping({"/chat.markRead", "/chat.read"})
    public void markReadViaSocket(@Payload com.foodthunder.chat.dto.MarkReadRequest request) {
        log.info("Received WebSocket mark-read via STOMP for orderId: {}, shopId: {}", 
                request.getOrderId(), request.getShopId());
        if (request.getOrderId() != null) {
            chatService.markOrderChatAsRead(request.getOrderId(), request.getReaderRole());
        }
        if (request.getShopId() != null) {
            chatService.markShopChatAsRead(request.getShopId(), request.getReaderRole());
        }
    }
}

