import { apiClient } from './axiosClient';
import { API_ENDPOINTS } from './endpoints';
import type { ApiResponse, PaginatedData } from '@/types/api.types';

export interface SubmitRestaurantReviewPayload {
  orderId: number;
  rating: number;
  comment?: string;
  foodItemId?: number;
  images?: string[];
}

export interface SubmitDriverReviewPayload {
  orderId: number;
  rating: number;
  comment?: string;
  quickTags?: string[];
}

export interface OrderReviewStatusDto {
  orderId: number;
  hasDriver: boolean;
  driverId?: number;
  isRestaurantReviewed: boolean;
  isDriverReviewed: boolean;
  canReviewRestaurant: boolean;
  canReviewDriver: boolean;
  remainingSeconds: number;
  completedAt?: string;
  message?: string;
}

export interface SubmitOrderReviewPayload {
  orderId: number;
  restaurantReview: {
    rating: number;
    comment?: string;
    foodItemId?: number;
    images?: string[];
  };
  driverReview?: {
    rating?: number;
    comment?: string;
  };
}

export interface ReviewItemDto {
  id: number;
  orderId: number;
  customerId: number;
  customerName?: string;
  customerAvatar?: string;
  targetType: 'RESTAURANT' | 'DRIVER';
  targetId: number;
  foodItemId?: number;
  foodName?: string;
  rating: number;
  comment?: string;
  images?: string[];
  createdAt: string;
}

export interface ReviewSummaryDto {
  targetId: number;
  targetType: string;
  totalReviews: number;
  averageRating: number;
  ratingBreakdown: Record<number, number>;
}

export interface OrderReviewEligibilityDto {
  orderId: number;
  canReview: boolean;
  isReviewed: boolean;
  remainingSeconds: number;
  completedAt?: string;
  message?: string;
}

export const reviewApi = {
  // 1. Customer APIs (Separate & Combined)
  submitRestaurantReview: async (payload: SubmitRestaurantReviewPayload): Promise<ApiResponse<ReviewItemDto>> => {
    return apiClient.post<ReviewItemDto>(API_ENDPOINTS.REVIEWS.SUBMIT_RESTAURANT, payload);
  },

  submitDriverReview: async (payload: SubmitDriverReviewPayload): Promise<ApiResponse<ReviewItemDto>> => {
    return apiClient.post<ReviewItemDto>(API_ENDPOINTS.REVIEWS.SUBMIT_DRIVER, payload);
  },

  getOrderReviewStatus: async (orderId: number | string): Promise<ApiResponse<OrderReviewStatusDto>> => {
    return apiClient.get<OrderReviewStatusDto>(API_ENDPOINTS.REVIEWS.ORDER_STATUS(orderId));
  },

  submitOrderReview: async (payload: SubmitOrderReviewPayload): Promise<ApiResponse<ReviewItemDto[]>> => {
    return apiClient.post<ReviewItemDto[]>(API_ENDPOINTS.REVIEWS.SUBMIT, payload);
  },

  checkOrderEligibility: async (orderId: number | string): Promise<ApiResponse<OrderReviewEligibilityDto>> => {
    return apiClient.get<OrderReviewEligibilityDto>(
      API_ENDPOINTS.REVIEWS.ORDER_ELIGIBILITY(orderId)
    );
  },

  getRestaurantReviews: async (
    restaurantId: number | string,
    params?: { foodItemId?: number; rating?: number; keyword?: string; page?: number; size?: number }
  ): Promise<ApiResponse<PaginatedData<ReviewItemDto>>> => {
    return apiClient.get<PaginatedData<ReviewItemDto>>(
      API_ENDPOINTS.REVIEWS.RESTAURANT_REVIEWS(restaurantId),
      { params }
    );
  },

  getRestaurantSummary: async (restaurantId: number | string): Promise<ApiResponse<ReviewSummaryDto>> => {
    return apiClient.get<ReviewSummaryDto>(
      API_ENDPOINTS.REVIEWS.RESTAURANT_SUMMARY(restaurantId)
    );
  },

  // 2. Merchant APIs (Read-Only)
  getMerchantReviews: async (params: {
    restaurantId: number;
    foodItemId?: number;
    rating?: number;
    keyword?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedData<ReviewItemDto>>> => {
    return apiClient.get<PaginatedData<ReviewItemDto>>(
      API_ENDPOINTS.REVIEWS.MERCHANT_MINE,
      { params }
    );
  },

  // 3. Driver APIs (Read-Only)
  getDriverReviews: async (params?: {
    fromDate?: string;
    toDate?: string;
    rating?: number;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedData<ReviewItemDto>>> => {
    return apiClient.get<PaginatedData<ReviewItemDto>>(
      API_ENDPOINTS.REVIEWS.DRIVER_MINE,
      { params }
    );
  },

  getDriverSummary: async (): Promise<ApiResponse<ReviewSummaryDto>> => {
    return apiClient.get<ReviewSummaryDto>(API_ENDPOINTS.REVIEWS.DRIVER_SUMMARY);
  },

  // 4. Admin APIs
  getAdminReviews: async (params?: {
    targetType?: string;
    targetId?: number;
    rating?: number;
    keyword?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedData<ReviewItemDto>>> => {
    return apiClient.get<PaginatedData<ReviewItemDto>>(
      API_ENDPOINTS.REVIEWS.ADMIN_ALL,
      { params }
    );
  },

  deleteAdminReview: async (id: number | string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(API_ENDPOINTS.REVIEWS.ADMIN_DETAIL(id));
  },
};
