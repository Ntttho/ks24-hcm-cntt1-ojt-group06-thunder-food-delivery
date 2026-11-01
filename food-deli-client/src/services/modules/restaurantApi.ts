import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse } from '@/types';

export interface Shop {
  id: number;
  name: string;
  address: string;
  phoneNumber?: string;
  rating?: number;
  imageUrl?: string;
  status?: string;
}

export const restaurantApi = {
  getAll: async (params?: Record<string, any>): Promise<ApiResponse<Shop[]>> => {
    return apiClient.get<Shop[]>(API_ENDPOINTS.RESTAURANTS.LIST, { params });
  },

  getById: async (id: number | string): Promise<ApiResponse<Shop>> => {
    return apiClient.get<Shop>(API_ENDPOINTS.RESTAURANTS.DETAIL(id));
  },
};
