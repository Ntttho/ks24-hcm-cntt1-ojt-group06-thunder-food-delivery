package com.foodthunder.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderItemToppingRequest {

    @NotNull(message = "Mã topping không được để trống")
    private Integer toppingId;

    @Min(value = 1, message = "Số lượng topping tối thiểu là 1")
    @Builder.Default
    private Integer quantity = 1;
}
