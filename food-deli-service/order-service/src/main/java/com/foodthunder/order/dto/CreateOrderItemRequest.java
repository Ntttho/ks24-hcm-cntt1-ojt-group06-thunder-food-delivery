package com.foodthunder.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderItemRequest {

    @NotNull(message = "Mã món ăn (foodId) không được để trống")
    private Integer foodId;

    @NotNull(message = "Số lượng món không được để trống")
    @Min(value = 1, message = "Số lượng món tối thiểu là 1")
    private Integer quantity;

    @Valid
    @Builder.Default
    private List<CreateOrderItemToppingRequest> toppings = new ArrayList<>();
}
