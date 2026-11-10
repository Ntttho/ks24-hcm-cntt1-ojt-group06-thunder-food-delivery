import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse, PaginatedData } from '@/types';
import type { User } from '@/types/auth.types';

export interface GetUsersParams {
  page?: number;
  size?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface CreateUserPayload {
  phone: string;
  fullName: string;
  email?: string;
  password: string;
  role?: string;
  roles?: string[];
  status?: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  phone?: string;
  email?: string;
  password?: string;
  role?: string;
  roles?: string[];
  status?: string;
}

export interface UpdateUserStatusPayload {
  status?: string;
  isActive?: boolean;
}

export const userApi = {
  /**
   * Lấy danh sách người dùng phân trang và tìm kiếm theo tên / số điện thoại / email / vai trò / trạng thái
   * GET /api/v1/users?search=...&role=...&status=...&page=0&size=10
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

  /**
   * Thêm người dùng mới (POST /api/v1/users)
   */
  createUser: async (payload: CreateUserPayload): Promise<ApiResponse<User>> => {
    return apiClient.post<User>(API_ENDPOINTS.USERS.LIST, payload);
  },

  /**
   * Cập nhật thông tin và vai trò người dùng (PUT /api/v1/users/{id})
   */
  updateUser: async (id: number | string, payload: UpdateUserPayload): Promise<ApiResponse<User>> => {
    return apiClient.put<User>(API_ENDPOINTS.USERS.DETAIL(id), payload);
  },

  /**
   * Cập nhật trạng thái Khóa / Mở khóa người dùng (PUT /api/v1/users/{id}/status)
   */
  updateUserStatus: async (
    id: number | string,
    payload: UpdateUserStatusPayload | string
  ): Promise<ApiResponse<User>> => {
    const body = typeof payload === 'string' ? { status: payload } : payload;
    return apiClient.put<User>(API_ENDPOINTS.USERS.STATUS(id), body);
  },

  /**
   * Xóa tài khoản người dùng (DELETE /api/v1/users/{id})
   */
  deleteUser: async (id: number | string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(API_ENDPOINTS.USERS.DETAIL(id));
  },
};
