import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse } from '@/types';

export interface SystemSettings {
  defaultShippingFee: number;
  defaultShippingFeeUpdatedAt: string | null;
  shippingFeePerKilometer: number;
  shippingFeePerKilometerUpdatedAt: string | null;
  platformCommissionRate: number | null;
  platformCommissionRateUpdatedAt: string | null;
}

export interface ShippingSettings {
  defaultShippingFee: number;
  shippingFeePerKilometer: number;
}

export interface UpdateSystemSettings {
  defaultShippingFee: number;
  shippingFeePerKilometer: number;
  platformCommissionRate: number;
}

export const systemSettingsApi = {
  getAdminSettings: (): Promise<ApiResponse<SystemSettings>> =>
    apiClient.get<SystemSettings>(API_ENDPOINTS.ADMIN.SYSTEM_SETTINGS),

  updateAdminSettings: (settings: UpdateSystemSettings): Promise<ApiResponse<SystemSettings>> =>
    apiClient.put<SystemSettings>(API_ENDPOINTS.ADMIN.SYSTEM_SETTINGS, settings),

  getShippingSettings: (): Promise<ApiResponse<ShippingSettings>> =>
    apiClient.get<ShippingSettings>(API_ENDPOINTS.SYSTEM_SETTINGS.SHIPPING),
};
