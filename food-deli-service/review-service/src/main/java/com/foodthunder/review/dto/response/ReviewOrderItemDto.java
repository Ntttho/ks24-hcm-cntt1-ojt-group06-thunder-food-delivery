package com.foodthunder.review.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewOrderItemDto {
    private Long foodId;
    private String foodName;
    private Integer quantity;
}
