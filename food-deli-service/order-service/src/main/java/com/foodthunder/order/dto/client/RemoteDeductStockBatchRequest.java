package com.foodthunder.order.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemoteDeductStockBatchRequest {
    private List<RemoteDeductStockItemRequest> items;
    private List<Integer> toppingIds;

    public RemoteDeductStockBatchRequest(List<RemoteDeductStockItemRequest> items) {
        this.items = items;
        this.toppingIds = new ArrayList<>();
    }
}

