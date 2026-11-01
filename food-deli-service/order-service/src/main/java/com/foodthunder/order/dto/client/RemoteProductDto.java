package com.foodthunder.order.dto.client;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemoteProductDto {
    private Integer id;
    private Integer categoryId;
    private String categoryName;
    private Integer restaurantId;
    private String restaurantName;
    private String name;
    private BigDecimal price;
    private Boolean isAvailable;
    private Integer defaultQuantity;
    private Integer currentQuantity;
    private String imageUrl;

    @Builder.Default
    private List<RemoteToppingDto> toppings = new ArrayList<>();
}
