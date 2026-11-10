package com.foodthunder.review.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReviewRequest {

    @NotNull(message = "orderId không được để trống")
    private Long orderId;

    @NotNull(message = "customerId không được để trống")
    private Long customerId;

    @NotBlank(message = "targetType không được để trống")
    private String targetType; // RESTAURANT | DRIVER

    @NotNull(message = "targetId không được để trống")
    private Long targetId;

    private Long foodItemId;

    @NotNull(message = "rating không được để trống")
    @Min(1)
    @Max(5)
    private Integer rating;

    private String comment;

    private List<String> images;

    private List<String> quickTags;
}
