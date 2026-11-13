package com.foodthunder.order.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemoteUserStatsDto {
    private long totalUsers;
    private long totalMerchants;
}

