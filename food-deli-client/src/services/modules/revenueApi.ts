import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse } from '@/types';

export interface MerchantRevenueSummary {
  restaurantId?: number;
  restaurantName?: string;
  period: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  successfulOrders: number;
  totalOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  totalDiscount: number;
  completionRate: number;
}

export interface RevenueDataPoint {
  label: string;
  date: string;
  revenue: number;
  orderCount: number;
  cancelledCount: number;
}

export interface RevenueChartData {
  restaurantId?: number;
  period: string;
  totalPeriodRevenue: number;
  totalPeriodOrders: number;
  points: RevenueDataPoint[];
}

export interface TopSellingFood {
  foodId: number;
  foodName: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface MultiBranchRevenue {
  restaurantId: number;
  restaurantName: string;
  totalRevenue: number;
  completedOrders: number;
  cancelledOrders: number;
  contributionPercentage: number;
}

export interface RevenueQueryParams {
  restaurantId?: number;
  restaurantIds?: number[];
  period?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM' | string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const revenueApi = {
  getSummary: async (params?: RevenueQueryParams): Promise<ApiResponse<MerchantRevenueSummary>> => {
    const p: Record<string, any> = { ...params };
    if (params?.restaurantIds && params.restaurantIds.length > 0) {
      p.restaurantIds = params.restaurantIds.join(',');
    }
    return apiClient.get(API_ENDPOINTS.REVENUE.SUMMARY, { params: p });
  },

  getChart: async (params?: RevenueQueryParams): Promise<ApiResponse<RevenueChartData>> => {
    const p: Record<string, any> = { ...params };
    if (params?.restaurantIds && params.restaurantIds.length > 0) {
      p.restaurantIds = params.restaurantIds.join(',');
    }
    return apiClient.get(API_ENDPOINTS.REVENUE.CHART, { params: p });
  },

  getTopFoods: async (params?: RevenueQueryParams): Promise<ApiResponse<TopSellingFood[]>> => {
    const p: Record<string, any> = { ...params };
    if (params?.restaurantIds && params.restaurantIds.length > 0) {
      p.restaurantIds = params.restaurantIds.join(',');
    }
    return apiClient.get(API_ENDPOINTS.REVENUE.TOP_FOODS, { params: p });
  },

  getBranches: async (restaurantIds: number[], period?: string, startDate?: string, endDate?: string): Promise<ApiResponse<MultiBranchRevenue[]>> => {
    return apiClient.get(API_ENDPOINTS.REVENUE.BRANCHES, {
      params: {
        restaurantIds: restaurantIds.join(','),
        period: period || 'MONTH',
        startDate,
        endDate,
      },
    });
  },
};

