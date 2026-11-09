import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse } from '@/types';

export interface BackendCartItemTopping {
  id: number;
  name: string;
  price: number;
}

export interface BackendCartItem {
  id: string;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  shopId: number;
  shopName?: string;
  toppings?: BackendCartItemTopping[];
}

export interface BackendCart {
  userId?: number;
  shopId?: number | null;
  shopName?: string | null;
  items: BackendCartItem[];
  totalQuantity: number;
  totalAmount: number;
  updatedAt?: string;
}

export interface AddItemToCartPayload {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  shopId: number;
  shopName?: string;
  toppings?: BackendCartItemTopping[];
  replaceCart?: boolean;
}

export const cartApi = {
  /**
   * Lấy giỏ hàng đồng bộ từ Redis
   * GET /api/v1/cart
   */
  getCart: async (userId?: number): Promise<ApiResponse<BackendCart>> => {
    return apiClient.get<BackendCart>(API_ENDPOINTS.CART.GET, {
      params: userId ? { userId } : undefined,
    });
  },

  /**
   * Thêm món vào giỏ hàng trên Redis (Áp dụng Single-Shop Constraint)
   * POST /api/v1/cart/items
   */
  addItem: async (payload: AddItemToCartPayload, userId?: number): Promise<ApiResponse<BackendCart>> => {
    return apiClient.post<BackendCart>(API_ENDPOINTS.CART.ADD_ITEM, payload, {
      params: userId ? { userId } : undefined,
    });
  },

  /**
   * Cập nhật số lượng món trong giỏ hàng trên Redis
   * PUT /api/v1/cart/items/{itemId}
   */
  updateQuantity: async (
    itemId: string,
    quantity: number,
    userId?: number
  ): Promise<ApiResponse<BackendCart>> => {
    return apiClient.put<BackendCart>(
      API_ENDPOINTS.CART.UPDATE_ITEM(itemId),
      { quantity },
      { params: userId ? { userId } : undefined }
    );
  },

  /**
   * Xóa một món ăn khỏi giỏ hàng trên Redis
   * DELETE /api/v1/cart/items/{itemId}
   */
  removeItem: async (itemId: string, userId?: number): Promise<ApiResponse<BackendCart>> => {
    return apiClient.delete<BackendCart>(API_ENDPOINTS.CART.REMOVE_ITEM(itemId), {
      params: userId ? { userId } : undefined,
    });
  },

  /**
   * Xóa toàn bộ giỏ hàng trên Redis
   * DELETE /api/v1/cart
   */
  clearCart: async (userId?: number): Promise<ApiResponse<BackendCart>> => {
    return apiClient.delete<BackendCart>(API_ENDPOINTS.CART.CLEAR, {
      params: userId ? { userId } : undefined,
    });
  },

  /**
   * Đồng bộ toàn bộ giỏ hàng từ Redux lên Redis
   * POST /api/v1/cart/sync
   */
  syncCart: async (
    shopId: number | null,
    shopName: string | null,
    items: BackendCartItem[],
    userId?: number
  ): Promise<ApiResponse<BackendCart>> => {
    return apiClient.post<BackendCart>(
      API_ENDPOINTS.CART.SYNC,
      { shopId, shopName, items },
      { params: userId ? { userId } : undefined }
    );
  },
};

