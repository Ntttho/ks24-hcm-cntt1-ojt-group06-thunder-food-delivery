package com.foodthunder.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Thống kê tóm tắt số lượng người dùng và đối tác kinh doanh cho Admin Analytics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsSummaryDto {
    private long totalUsers;
    private long totalMerchants;
}

