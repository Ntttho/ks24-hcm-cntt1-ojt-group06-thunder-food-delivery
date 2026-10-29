import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse, UserAddress, AddressRequest } from '@/types';

export const addressApi = {
  getMyAddresses: async (): Promise<ApiResponse<UserAddress[]>> => {
    return apiClient.get<UserAddress[]>(API_ENDPOINTS.ADDRESSES.MINE);
  },

  createAddress: async (data: AddressRequest): Promise<ApiResponse<UserAddress>> => {
    return apiClient.post<UserAddress>(API_ENDPOINTS.ADDRESSES.MINE, data);
  },

  updateAddress: async (
    id: number | string,
    data: AddressRequest
  ): Promise<ApiResponse<UserAddress>> => {
    return apiClient.put<UserAddress>(API_ENDPOINTS.ADDRESSES.DETAIL(id), data);
  },

  setDefaultAddress: async (id: number | string): Promise<ApiResponse<UserAddress>> => {
    return apiClient.patch<UserAddress>(API_ENDPOINTS.ADDRESSES.SET_DEFAULT(id));
  },

  deleteAddress: async (id: number | string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(API_ENDPOINTS.ADDRESSES.DETAIL(id));
  },
};
