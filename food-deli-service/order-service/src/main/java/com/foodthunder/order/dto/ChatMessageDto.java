package com.foodthunder.order.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {
    private Long id;
    private Long orderId;
    private Long senderId;
    private Long shopId;
    private String senderRole;
    private String message;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
