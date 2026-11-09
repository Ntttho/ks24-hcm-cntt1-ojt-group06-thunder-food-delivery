package com.foodthunder.review.dto.client;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderClientDto {
    private Long id;
    private String orderCode;
    private Integer customerId;
    private Integer restaurantId;
    private Integer driverId;
    private String statusCode;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime createdAt;

    @Builder.Default
    private List<OrderItemClientDto> items = new ArrayList<>();

    @Builder.Default
    private List<OrderStatusLogClientDto> statusLogs = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemClientDto {
        private Long id;
        private Long foodId;
        private String foodName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderStatusLogClientDto {
        private String statusCode;

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        private LocalDateTime createdAt;
    }
}

