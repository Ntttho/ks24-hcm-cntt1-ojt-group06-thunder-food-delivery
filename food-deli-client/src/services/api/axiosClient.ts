import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { message } from 'antd';
import { appConfig } from '@/config/appConfig';
import { storage } from '@/utils/storage';
import type { ApiResponse } from '@/types/api.types';

// Create custom Axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: appConfig.defaultTimeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach JWT Token & Correlation Headers
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global Error Handling & Data Normalization
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiResponse<any>>) => {
    const status = error.response?.status;
    const responseData = error.response?.data;
    const errorMessage =
      responseData?.message || error.message || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';

    switch (status) {
      case 401:
        storage.removeToken();
        storage.removeUser();
        if (!window.location.pathname.includes('/login')) {
          message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        break;
      case 403:
        message.error('Bạn không có quyền thực hiện thao tác này (403 Forbidden).');
        break;
      case 404:
        console.warn('[API 404 Not Found]:', error.config?.url, errorMessage);
        break;
      case 500:
      case 502:
      case 503:
        message.error('Hệ thống máy chủ đang bận hoặc gặp sự cố. Vui lòng thử lại sau.');
        break;
      default:
        break;
    }

    return Promise.reject(error);
  }
);

/**
 * Custom typed API Client Wrapper
 */
export const apiClient = {
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const res = await axiosInstance.get<ApiResponse<T>>(url, config);
    return res.data;
  },

  post: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const res = await axiosInstance.post<ApiResponse<T>>(url, data, config);
    return res.data;
  },

  put: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const res = await axiosInstance.put<ApiResponse<T>>(url, data, config);
    return res.data;
  },

  patch: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const res = await axiosInstance.patch<ApiResponse<T>>(url, data, config);
    return res.data;
  },

  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const res = await axiosInstance.delete<ApiResponse<T>>(url, config);
    return res.data;
  },
};

export default axiosInstance;
