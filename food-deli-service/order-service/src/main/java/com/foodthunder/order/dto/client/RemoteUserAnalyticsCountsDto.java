package com.foodthunder.order.dto.client;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO nhận số lượng thống kê Users và Merchants từ auth-service qua OpenFeign.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemoteUserAnalyticsCountsDto {
    private long totalUsersCount;
    private long totalMerchantsCount;

    @JsonIgnore
    @Builder.Default
    private boolean fallback = false;
}

