package com.foodthunder.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendMessageRequest {

    private Long orderId;

    private Long senderId;

    private Long shopId;

    private String senderRole;

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    private String message;
}

