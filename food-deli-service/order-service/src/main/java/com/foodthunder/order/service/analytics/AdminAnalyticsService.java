package com.foodthunder.order.service.analytics;

import com.foodthunder.order.dto.analytics.AdminAnalyticsSummaryResponse;

public interface AdminAnalyticsService {
    AdminAnalyticsSummaryResponse getAnalyticsSummary(Integer year);
}

