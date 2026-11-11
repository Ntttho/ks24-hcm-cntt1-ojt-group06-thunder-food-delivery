import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse } from '@/types';

export interface RestaurantChangeRequestItem {
  id: number;
  restaurantId: number;
  restaurantName?: string;
  requestedBy: number;
  payload: string;
  payloadData?: Record<string, any>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  reviewedBy?: number | null;
  reviewedAt?: string | null;
  rejectReason?: string | null;
  createdAt: string;
}

export interface DriverApprovalItem {
  userId: number;
  licensePlate: string;
  idCardNumber: string;
  vehicleType: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  rejectReason?: string | null;
  isOnline?: boolean;
}

export const adminApprovalApi = {
  /**
   * Lấy danh sách yêu cầu thay đổi / mở quán ăn
   * GET /api/v1/restaurants/change-requests?status=...
   */
  getRestaurantChangeRequests: async (status?: string): Promise<ApiResponse<RestaurantChangeRequestItem[]>> => {
    return apiClient.get<RestaurantChangeRequestItem[]>(API_ENDPOINTS.ADMIN.CHANGE_REQUESTS, {
      params: status && status !== 'ALL' ? { status } : undefined,
    });
  },

  /**
   * Lấy chi tiết yêu cầu thay đổi / mở quán ăn theo ID
   * GET /api/v1/restaurants/change-requests/{id}
   */
  getRestaurantChangeRequestDetail: async (id: number | string): Promise<ApiResponse<RestaurantChangeRequestItem>> => {
    return apiClient.get<RestaurantChangeRequestItem>(API_ENDPOINTS.ADMIN.CHANGE_REQUEST_DETAIL(id));
  },

  /**
   * Phê duyệt yêu cầu mở quán / thay đổi thông tin quán (APPROVED)
   * PUT /api/v1/restaurants/change-requests/{id}/approve
   */
  approveRestaurantChangeRequest: async (id: number | string): Promise<ApiResponse<RestaurantChangeRequestItem>> => {
    return apiClient.put<RestaurantChangeRequestItem>(API_ENDPOINTS.ADMIN.APPROVE_CHANGE_REQUEST(id));
  },

  /**
   * Từ chối yêu cầu mở quán / thay đổi thông tin quán (REJECTED) kèm lý do
   * PUT /api/v1/restaurants/change-requests/{id}/reject
   */
  rejectRestaurantChangeRequest: async (
    id: number | string,
    rejectReason: string
  ): Promise<ApiResponse<RestaurantChangeRequestItem>> => {
    return apiClient.put<RestaurantChangeRequestItem>(API_ENDPOINTS.ADMIN.REJECT_CHANGE_REQUEST(id), {
      rejectReason,
    });
  },

  /**
   * Lấy danh sách hồ sơ tài xế chờ duyệt
   * GET /api/v1/drivers/approvals?status=...
   */
  getDriverApprovals: async (status?: string): Promise<ApiResponse<DriverApprovalItem[]>> => {
    return apiClient.get<DriverApprovalItem[]>(API_ENDPOINTS.ADMIN.DRIVER_APPROVALS, {
      params: status && status !== 'ALL' ? { status } : undefined,
    });
  },

  /**
   * Lấy chi tiết hồ sơ tài xế theo userId
   * GET /api/v1/drivers/{userId}/approval
   */
  getDriverApprovalDetail: async (userId: number | string): Promise<ApiResponse<DriverApprovalItem>> => {
    return apiClient.get<DriverApprovalItem>(API_ENDPOINTS.ADMIN.DRIVER_APPROVAL_DETAIL(userId));
  },

  /**
   * Phê duyệt hồ sơ tài xế (APPROVED)
   * PUT /api/v1/drivers/{userId}/approve
   */
  approveDriver: async (userId: number | string): Promise<ApiResponse<DriverApprovalItem>> => {
    return apiClient.put<DriverApprovalItem>(API_ENDPOINTS.ADMIN.APPROVE_DRIVER(userId));
  },

  /**
   * Từ chối hồ sơ tài xế (REJECTED) kèm lý do
   * PUT /api/v1/drivers/{userId}/reject
   */
  rejectDriver: async (
    userId: number | string,
    rejectReason: string
  ): Promise<ApiResponse<DriverApprovalItem>> => {
    return apiClient.put<DriverApprovalItem>(API_ENDPOINTS.ADMIN.REJECT_DRIVER(userId), {
      rejectReason,
    });
  },
};
