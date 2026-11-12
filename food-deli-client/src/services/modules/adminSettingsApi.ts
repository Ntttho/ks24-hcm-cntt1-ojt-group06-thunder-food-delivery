import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse } from '@/types';

export interface OrderCostConfig {
  baseKm: number;
  baseFee: number;
  extraPerKm: number;
  priorityFee: number;
  serviceFee: number;
  vatRate: number;
  vatIncluded: boolean;
}

export interface SystemSettingsConfig extends OrderCostConfig {
  platformCommissionPercent: number;
}

export type UpdateSystemSettingsPayload = SystemSettingsConfig;

export const DEFAULT_ORDER_COST_CONFIG: OrderCostConfig = {
  baseKm: 2,
  baseFee: 15000,
  extraPerKm: 5000,
  priorityFee: 5000,
  serviceFee: 3000,
  vatRate: 0.08,
  vatIncluded: true,
};

export const adminSettingsApi = {
  /**
   * Admin: Lấy đầy đủ cấu hình tham số toàn sàn & chi phí Order
   * GET /api/v1/admin/settings
   */
  getAdminSettings: async (): Promise<ApiResponse<SystemSettingsConfig>> => {
    return apiClient.get<SystemSettingsConfig>(API_ENDPOINTS.ADMIN.SETTINGS);
  },

  /**
   * Admin: Cập nhật cấu hình tham số toàn sàn & chi phí Order
   * PUT /api/v1/admin/settings
   */
  updateAdminSettings: async (
    payload: UpdateSystemSettingsPayload
  ): Promise<ApiResponse<SystemSettingsConfig>> => {
    return apiClient.put<SystemSettingsConfig>(API_ENDPOINTS.ADMIN.SETTINGS, payload);
  },

  /**
   * Public: Lấy cấu hình chi phí Order & giao hàng hiện hành cho Checkout
   * GET /api/v1/settings/order-fees
   */
  getPublicOrderFeeConfig: async (): Promise<ApiResponse<OrderCostConfig>> => {
    return apiClient.get<OrderCostConfig>(API_ENDPOINTS.SETTINGS.ORDER_FEES);
  },
};

