package com.foodthunder.order.service.analytics;

import com.foodthunder.order.dto.analytics.AdminAnalyticsSummaryResponse;

public interface AdminAnalyticsService {

    /**
     * Tổng hợp doanh thu toàn sàn 12 tháng theo năm và 5 chỉ số KPI cốt lõi.
     */
    AdminAnalyticsSummaryResponse getPlatformAnalyticsSummary(Integer year);
}

