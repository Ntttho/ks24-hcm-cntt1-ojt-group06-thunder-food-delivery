import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse } from '@/types';

export interface MonthlyRevenuePoint {
  month: number;
  label: string;
  revenue: number;
  orderCount: number;
}

export interface TopRestaurantRevenue {
  restaurantId: number;
  restaurantName: string;
  completedOrders: number;
  revenue: number;
}

export interface AdminAnalyticsSummary {
  year: number;
  totalUsers: number;
  totalMerchants: number;
  totalRestaurants: number;
  totalFoodItems: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  completionRate: number;
  totalGmv: number;
  monthlyRevenue: MonthlyRevenuePoint[];
  topRestaurants: TopRestaurantRevenue[];
}

export const adminAnalyticsApi = {
  /**
   * Admin: Lấy báo cáo phân tích nền tảng & biểu đồ GMV 12 tháng
   * GET /api/v1/admin/analytics/summary?year=2026
   */
  getSummary: async (year?: number): Promise<ApiResponse<AdminAnalyticsSummary>> => {
    return apiClient.get<AdminAnalyticsSummary>(API_ENDPOINTS.ADMIN.ANALYTICS_SUMMARY, {
      params: year ? { year } : undefined,
    });
  },
};

