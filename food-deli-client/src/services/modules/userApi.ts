import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse, PaginatedData } from '@/types';
import type { User } from '@/types/auth.types';

export interface GetUsersParams {
  page?: number;
  size?: number;
  search?: string;
  role?: string;
}

export const userApi = {
  /**
   * Lấy danh sách người dùng phân trang và tìm kiếm theo tên / số điện thoại / vai trò
   * GET /api/v1/users?search=...&role=...&page=0&size=10
   */
  getUsers: async (params?: GetUsersParams): Promise<ApiResponse<PaginatedData<User>>> => {
    return apiClient.get<PaginatedData<User>>(API_ENDPOINTS.USERS.LIST, { params });
  },

  /**
   * Lấy toàn bộ người dùng không phân trang
   * GET /api/v1/users/all
   */
  getAllUsers: async (): Promise<ApiResponse<User[]>> => {
    return apiClient.get<User[]>(API_ENDPOINTS.USERS.ALL);
  },

  /**
   * Lấy chi tiết thông tin người dùng theo ID
   * GET /api/v1/users/{id}
   */
  getUserById: async (id: number | string): Promise<ApiResponse<User>> => {
    return apiClient.get<User>(API_ENDPOINTS.USERS.DETAIL(id));
  },
};

