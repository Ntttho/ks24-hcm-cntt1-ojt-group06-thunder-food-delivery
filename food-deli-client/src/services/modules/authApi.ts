import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    return apiClient.get<User>(API_ENDPOINTS.AUTH.PROFILE);
  },

  logout: async (): Promise<ApiResponse<void>> => {
    return apiClient.post<void>(API_ENDPOINTS.AUTH.LOGOUT);
  },
};
