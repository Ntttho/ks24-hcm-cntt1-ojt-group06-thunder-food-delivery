package com.foodthunder.review.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponseDto {
    private Long id;
    private Long orderId;
    private Long customerId;
    private String customerName;
    private String customerAvatar;
    private String targetType;
    private Long targetId;
    private Long foodItemId;
    private String foodName;
    private Integer rating;
    private String comment;
    private List<String> images;
    private List<String> quickTags;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime createdAt;
}
