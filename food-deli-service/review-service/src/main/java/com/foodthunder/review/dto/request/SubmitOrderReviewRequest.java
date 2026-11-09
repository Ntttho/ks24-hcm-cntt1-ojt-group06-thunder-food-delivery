package com.foodthunder.review.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
public class SubmitOrderReviewRequest {

    @NotNull(message = "Mã đơn hàng không được để trống")
    private Long orderId;

    @Valid
    @NotNull(message = "Đánh giá nhà hàng là bắt buộc")
    private TargetReviewItem restaurantReview;

    @Valid
    private TargetReviewItem driverReview;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TargetReviewItem {
        @NotNull(message = "Số sao đánh giá không được để trống")
        @Min(value = 1, message = "Đánh giá tối thiểu là 1 sao")
        @Max(value = 5, message = "Đánh giá tối đa là 5 sao")
        private Integer rating;

        private String comment;

        private Long foodItemId;

        private List<String> images;
    }
}

