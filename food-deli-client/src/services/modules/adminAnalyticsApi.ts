import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse } from '@/types';

export interface MonthlyRevenuePoint {
  month: string;
  label?: string;
  revenue: number;
  completedOrdersCount?: number;
}

export interface AdminAnalyticsSummary {
  year?: number;
  totalRevenue: number;
  yearlyRevenue?: number;
  monthlyRevenue: MonthlyRevenuePoint[];
  totalUsersCount: number;
  totalRestaurantsCount: number;
  totalMerchantsCount: number;
  completedOrdersCount: number;
  totalOrdersCount: number;
  orderSuccessRate: number;
  totalFoodItemsCount: number;
  partialData?: boolean;
  warnings?: string[];
}

export const adminAnalyticsApi = {
  /**
   * Lấy báo cáo thống kê tổng thu toàn sàn và 5 chỉ số KPI hệ thống realtime.
   * GET /api/v1/admin/analytics/summary?year=2026
   */
  getSummary: async (year?: number): Promise<ApiResponse<AdminAnalyticsSummary>> => {
    return apiClient.get<AdminAnalyticsSummary>(API_ENDPOINTS.ADMIN.ANALYTICS_SUMMARY, {
      params: year ? { year } : undefined,
    });
  },
};

