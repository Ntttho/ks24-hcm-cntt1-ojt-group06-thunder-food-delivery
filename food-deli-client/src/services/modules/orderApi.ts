import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse } from '@/types';

export interface CreateOrderPayload {
  shopId: number;
  items: Array<{
    productId: number;
    quantity: number;
    toppingIds?: number[];
  }>;
  deliveryAddress: string;
  paymentMethod: 'COD' | 'MOMO' | 'VNPAY' | 'WALLET';
  note?: string;
}

export const orderApi = {
  create: async (data: CreateOrderPayload): Promise<ApiResponse<any>> => {
    return apiClient.post(API_ENDPOINTS.ORDERS.CREATE, data);
  },

  getAll: async (params?: Record<string, any>): Promise<ApiResponse<any[]>> => {
    return apiClient.get(API_ENDPOINTS.ORDERS.LIST, { params });
  },

  getById: async (id: number | string): Promise<ApiResponse<any>> => {
    return apiClient.get(API_ENDPOINTS.ORDERS.DETAIL(id));
  },
};
