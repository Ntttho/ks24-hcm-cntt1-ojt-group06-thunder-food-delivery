package com.foodthunder.chat.service.impl;

import com.foodthunder.chat.dto.ChatMessageDto;
import com.foodthunder.chat.dto.SendMessageRequest;
import com.foodthunder.chat.entity.ChatMessage;
import com.foodthunder.chat.repository.ChatMessageRepository;
import com.foodthunder.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageDto> getOrderChatHistory(Long orderId) {
        return chatMessageRepository.findByOrderIdOrderByCreatedAtAsc(orderId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageDto> getShopChatHistory(Long shopId) {
        return chatMessageRepository.findByShopIdOrderByCreatedAtAsc(shopId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ChatMessageDto sendMessage(SendMessageRequest request) {
        Long resolvedShopId = request.getShopId();
        if (resolvedShopId == null && request.getOrderId() != null) {
            resolvedShopId = chatMessageRepository.findFirstByOrderIdAndShopIdIsNotNull(request.getOrderId())
                    .map(ChatMessage::getShopId)
                    .orElse(null);
        }

        ChatMessage message = ChatMessage.builder()
                .orderId(request.getOrderId())
                .senderId(request.getSenderId() != null ? request.getSenderId() : 1L)
                .shopId(resolvedShopId)
                .senderRole(request.getSenderRole() != null ? request.getSenderRole().toUpperCase() : "CUSTOMER")
                .message(request.getMessage())
                .isRead(false)
                .build();

        ChatMessage saved = chatMessageRepository.save(message);
        ChatMessageDto dto = mapToDto(saved);

        // Realtime broadcast to 2-way STOMP topic: /topic/chat/{orderId}
        try {
            if (request.getOrderId() != null) {
                String destination = "/topic/chat/" + request.getOrderId();
                messagingTemplate.convertAndSend(destination, dto);
                log.info("Broadcasted chat message {} to {}", saved.getId(), destination);
            }

            // Also broadcast to shop channel if shopId is resolved
            if (resolvedShopId != null) {
                messagingTemplate.convertAndSend("/topic/shop/" + resolvedShopId, dto);
                log.info("Broadcasted chat message {} to shop channel /topic/shop/{}", saved.getId(), resolvedShopId);
            }
        } catch (Exception e) {
            log.warn("Failed to broadcast chat message via WebSocket: {}", e.getMessage());
        }

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public long getOrderUnreadCount(Long orderId, String readerRole) {
        if (orderId == null) return 0;
        String role = readerRole != null ? readerRole.toUpperCase() : "CUSTOMER";
        return chatMessageRepository.countByOrderIdAndSenderRoleNotAndIsReadFalse(orderId, role);
    }

    @Override
    @Transactional(readOnly = true)
    public long getShopUnreadCount(Long shopId, String readerRole) {
        if (shopId == null) return 0;
        String role = readerRole != null ? readerRole.toUpperCase() : "MERCHANT";
        return chatMessageRepository.countByShopIdAndSenderRoleNotAndIsReadFalse(shopId, role);
    }

    @Override
    @Transactional
    public void markOrderChatAsRead(Long orderId, String readerRole) {
        if (orderId == null) return;
        String role = readerRole != null ? readerRole.toUpperCase() : "CUSTOMER";
        List<ChatMessage> unreadMessages = chatMessageRepository.findByOrderIdAndSenderRoleNotAndIsReadFalse(orderId, role);
        if (!unreadMessages.isEmpty()) {
            unreadMessages.forEach(m -> m.setIsRead(true));
            chatMessageRepository.saveAll(unreadMessages);
            log.info("Marked {} messages as read for order {}", unreadMessages.size(), orderId);

            // Broadcast read event to /topic/chat/{orderId}/read
            try {
                messagingTemplate.convertAndSend("/topic/chat/" + orderId + "/read", 
                        Map.of("orderId", orderId, "readerRole", role, "status", "READ"));
            } catch (Exception e) {
                log.warn("Failed to broadcast read event: {}", e.getMessage());
            }
        }
    }

    @Override
    @Transactional
    public void markShopChatAsRead(Long shopId, String readerRole) {
        if (shopId == null) return;
        String role = readerRole != null ? readerRole.toUpperCase() : "MERCHANT";
        List<ChatMessage> unreadMessages = chatMessageRepository.findByShopIdAndSenderRoleNotAndIsReadFalse(shopId, role);
        if (!unreadMessages.isEmpty()) {
            unreadMessages.forEach(m -> m.setIsRead(true));
            chatMessageRepository.saveAll(unreadMessages);
            log.info("Marked {} messages as read for shop {}", unreadMessages.size(), shopId);

            // Broadcast read event to /topic/shop/{shopId}/read
            try {
                messagingTemplate.convertAndSend("/topic/shop/" + shopId + "/read", 
                        Map.of("shopId", shopId, "readerRole", role, "status", "READ"));
            } catch (Exception e) {
                log.warn("Failed to broadcast shop read event: {}", e.getMessage());
            }
        }
    }

    @Override
    public void broadcastTopicMessage(String topic, Object payload) {
        try {
            messagingTemplate.convertAndSend(topic, payload);
            log.info("Broadcasted generic event to topic: {}", topic);
        } catch (Exception e) {
            log.warn("Failed to broadcast to topic {}: {}", topic, e.getMessage());
        }
    }

    private ChatMessageDto mapToDto(ChatMessage entity) {
        return ChatMessageDto.builder()
                .id(entity.getId())
                .orderId(entity.getOrderId())
                .senderId(entity.getSenderId())
                .shopId(entity.getShopId())
                .senderRole(entity.getSenderRole())
                .message(entity.getMessage())
                .isRead(entity.getIsRead())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}

