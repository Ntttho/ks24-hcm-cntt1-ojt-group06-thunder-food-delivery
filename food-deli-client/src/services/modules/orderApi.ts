import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse } from '@/types';

export interface CreateOrderItemPayload {
  foodId: number;
  quantity: number;
  toppings?: Array<{
    toppingId: number;
    quantity?: number;
  }>;
}

export interface CreateOrderPayload {
  restaurantId: number;
  receiverAddress: string;
  receiverLat?: number;
  receiverLng?: number;
  distanceKm?: number;
  voucherId?: number;
  idempotencyKey?: string;
  items: CreateOrderItemPayload[];
  paymentMethod?: 'COD' | 'MOMO' | 'VNPAY' | 'WALLET';
  note?: string;
}

export interface UpdateOrderStatusPayload {
  statusCode: string;
  reason?: string;
}

export const orderApi = {
  create: async (data: CreateOrderPayload): Promise<ApiResponse<any>> => {
    return apiClient.post(API_ENDPOINTS.ORDERS.CREATE, data);
  },

  getMyOrders: async (params?: { page?: number; size?: number }): Promise<ApiResponse<any>> => {
    return apiClient.get('/orders/my-orders', { params });
  },

  getAll: async (params?: Record<string, any>): Promise<ApiResponse<any>> => {
    return apiClient.get(API_ENDPOINTS.ORDERS.LIST, { params });
  },

  getById: async (id: number | string): Promise<ApiResponse<any>> => {
    return apiClient.get(API_ENDPOINTS.ORDERS.DETAIL(id));
  },

  updateStatus: async (id: number | string, data: UpdateOrderStatusPayload): Promise<ApiResponse<any>> => {
    return apiClient.put(API_ENDPOINTS.ORDERS.STATUS(id), data);
  },
};
