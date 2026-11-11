package com.foodthunder.chat.repository;

import com.foodthunder.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByOrderIdOrderByCreatedAtAsc(Long orderId);
    List<ChatMessage> findByShopIdOrderByCreatedAtAsc(Long shopId);
}

