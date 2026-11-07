package com.foodthunder.order.dto.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncCartRequest {
    private Long shopId;
    private String shopName;

    @Builder.Default
    private List<CartItemDto> items = new ArrayList<>();
}

