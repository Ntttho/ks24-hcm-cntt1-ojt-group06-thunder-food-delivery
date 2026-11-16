package com.foodthunder.chat.repository;

import com.foodthunder.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByOrderIdOrderByCreatedAtAsc(Long orderId);
    List<ChatMessage> findByShopIdOrderByCreatedAtAsc(Long shopId);

    java.util.Optional<ChatMessage> findFirstByOrderIdAndShopIdIsNotNull(Long orderId);

    long countByOrderIdAndSenderRoleNotAndIsReadFalse(Long orderId, String senderRole);
    long countByShopIdAndSenderRoleNotAndIsReadFalse(Long shopId, String senderRole);

    List<ChatMessage> findByOrderIdAndSenderRoleNotAndIsReadFalse(Long orderId, String senderRole);
    List<ChatMessage> findByShopIdAndSenderRoleNotAndIsReadFalse(Long shopId, String senderRole);
}

