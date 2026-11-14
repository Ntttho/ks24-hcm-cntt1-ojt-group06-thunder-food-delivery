package com.foodthunder.restaurant.dto.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeductStockBatchRequest {

    @NotEmpty(message = "Danh sách món ăn không được để trống")
    @Valid
    private List<DeductStockItemRequest> items;
}

