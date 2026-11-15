package com.foodthunder.chat.service;

import com.foodthunder.chat.dto.ChatMessageDto;
import com.foodthunder.chat.dto.SendMessageRequest;

import java.util.List;

public interface ChatService {
    List<ChatMessageDto> getOrderChatHistory(Long orderId);
    List<ChatMessageDto> getShopChatHistory(Long shopId);
    ChatMessageDto sendMessage(SendMessageRequest request);
    void broadcastTopicMessage(String topic, Object payload);

    long getOrderUnreadCount(Long orderId, String readerRole);
    long getShopUnreadCount(Long shopId, String readerRole);
    void markOrderChatAsRead(Long orderId, String readerRole);
    void markShopChatAsRead(Long shopId, String readerRole);
}

