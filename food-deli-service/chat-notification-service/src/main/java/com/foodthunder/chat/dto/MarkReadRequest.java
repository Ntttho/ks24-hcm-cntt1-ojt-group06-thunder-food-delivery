package com.foodthunder.chat.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarkReadRequest {
    private Long orderId;
    private Long shopId;
    private String readerRole;
}
