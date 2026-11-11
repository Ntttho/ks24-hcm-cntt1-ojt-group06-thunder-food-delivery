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
        ChatMessage message = ChatMessage.builder()
                .orderId(request.getOrderId())
                .senderId(request.getSenderId() != null ? request.getSenderId() : 1L)
                .shopId(request.getShopId())
                .senderRole(request.getSenderRole() != null ? request.getSenderRole().toUpperCase() : "CUSTOMER")
                .message(request.getMessage())
                .isRead(false)
                .build();

        ChatMessage saved = chatMessageRepository.save(message);
        ChatMessageDto dto = mapToDto(saved);

        // Realtime broadcast to 2-way STOMP topic: /topic/chat/{orderId}
        try {
            String destination = "/topic/chat/" + request.getOrderId();
            messagingTemplate.convertAndSend(destination, dto);
            log.info("Broadcasted chat message {} to {}", saved.getId(), destination);

            // Also broadcast to shop channel if shopId is provided
            if (request.getShopId() != null) {
                messagingTemplate.convertAndSend("/topic/shop/" + request.getShopId(), dto);
            }
        } catch (Exception e) {
            log.warn("Failed to broadcast chat message via WebSocket: {}", e.getMessage());
        }

        return dto;
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

