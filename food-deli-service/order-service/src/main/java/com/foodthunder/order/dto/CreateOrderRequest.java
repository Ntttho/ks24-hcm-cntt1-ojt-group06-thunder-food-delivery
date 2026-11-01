package com.foodthunder.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    @NotNull(message = "Mã quán ăn (restaurantId) không được để trống")
    private Integer restaurantId;

    private Integer voucherId;

    @NotBlank(message = "Địa chỉ nhận hàng (receiverAddress) không được để trống")
    private String receiverAddress;

    private Double receiverLat;

    private Double receiverLng;

    private Double distanceKm;

    private String idempotencyKey;

    @NotEmpty(message = "Danh sách món ăn không được để trống")
    @Valid
    @Builder.Default
    private List<CreateOrderItemRequest> items = new ArrayList<>();
}
