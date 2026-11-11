package com.foodthunder.auth.dto;

import lombok.Builder;

/**
 * Thống kê số lượng người dùng và đối tác kinh doanh (Merchants) phục vụ Admin Analytics Dashboard.
 */
@Builder
public record UserAnalyticsCountsDto(
        long totalUsersCount,
        long totalMerchantsCount
) {}

