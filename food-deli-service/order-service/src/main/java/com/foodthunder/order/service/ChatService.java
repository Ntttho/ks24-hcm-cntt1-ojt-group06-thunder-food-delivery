package com.foodthunder.order.service;

import com.foodthunder.order.dto.ChatMessageDto;
import com.foodthunder.order.dto.SendMessageRequest;

import java.util.List;

public interface ChatService {
    List<ChatMessageDto> getOrderChatHistory(Long orderId);
    ChatMessageDto sendMessage(SendMessageRequest request);
}
