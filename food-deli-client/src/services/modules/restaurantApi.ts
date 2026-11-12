import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse, PaginatedData } from '@/types';

export interface Shop {
  id: number;
  ownerId?: number;
  name: string;
  address: string;
  phoneNumber?: string;
  rating?: number;
  imageUrl?: string;
  status?: string;
  isOpen?: boolean;
  isOpenToday?: boolean;
  openingTime?: string;
  closingTime?: string;
  ratingAvg?: number;
  approvalStatus?: string;
  categories?: Array<{
    id: number;
    name: string;
    products: Array<{
      id: number;
      name: string;
      price: number;
      description?: string;
      imageUrl?: string;
      isAvailable?: boolean;
      categoryId?: number;
      categoryName?: string;
    }>;
  }>;
}

export interface CreateRestaurantPayload {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  openingTime?: string;
  closingTime?: string;
  imageUrl?: string;
  initialCategoryName?: string;
}

export interface ProductItem {
  id: number;
  categoryId?: number;
  categoryName?: string;
  restaurantId?: number;
  restaurantName?: string;
  name: string;
  description?: string;
  price: number;
  isAvailable: boolean;
  defaultQuantity?: number;
  currentQuantity?: number;
  imageUrl?: string;
  toppingIds?: number[];
  toppings?: ToppingItem[];
}

export interface MenuCategoryItem {
  id: number;
  name: string;
  restaurantId?: number;
  itemCount?: number;
}

export interface VoucherItem {
  id: number;
  restaurantId?: number;
  code: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  discountAmount?: number;
  maxDiscountAmount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  usedCount?: number;
  startDate?: string;
  expiryDate: string;
  isActive?: boolean;
}

export interface CreateVoucherPayload {
  restaurantId?: number;
  code: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  startDate?: string;
  expiryDate: string;
}

export interface UpdateVoucherPayload {
  discountType?: 'FIXED' | 'PERCENTAGE';
  discountValue?: number;
  maxDiscountAmount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  startDate?: string;
  expiryDate?: string;
  isActive?: boolean;
}

export interface ProductPayload {
  name: string;
  description?: string;
  categoryId: number;
  price: number;
  imageUrl?: string;
  isAvailable?: boolean;
  defaultQuantity?: number;
  toppingIds?: number[];
}

export interface ToppingItem {
  id: number;
  restaurantId: number;
  groupName?: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface ToppingGroupItem {
  groupName: string;
  required: boolean;
  minSelection: number;
  maxSelection: number;
  toppings: ToppingItem[];
}

export interface CreateToppingPayload {
  restaurantId: number;
  groupName?: string;
  name: string;
  price: number;
  isAvailable?: boolean;
}

export interface UpdateToppingPayload {
  groupName?: string;
  name?: string;
  price?: number;
  isAvailable?: boolean;
}

export interface ProductDetailItem extends ProductItem {
  restaurantId?: number;
  restaurantName?: string;
  toppingGroups?: ToppingGroupItem[];
  toppings?: ToppingItem[];
}

// In-memory fallback mock storage for development
let mockToppingsStore: ToppingItem[] = [
  { id: 1, restaurantId: 1, groupName: 'Topping thêm', name: 'Thêm chả lụa chay', price: 10000, isAvailable: true },
  { id: 2, restaurantId: 1, groupName: 'Topping thêm', name: 'Thêm sườn non chay', price: 12000, isAvailable: true },
  { id: 3, restaurantId: 1, groupName: 'Topping thêm', name: 'Thêm cơm', price: 5000, isAvailable: true },
  { id: 4, restaurantId: 1, groupName: 'Size ly', name: 'Size Vừa (M)', price: 0, isAvailable: true },
  { id: 5, restaurantId: 1, groupName: 'Size ly', name: 'Size Lớn (L)', price: 8000, isAvailable: true },
  { id: 6, restaurantId: 1, groupName: 'Độ ngọt', name: '100% đường (Bình thường)', price: 0, isAvailable: true },
  { id: 7, restaurantId: 1, groupName: 'Độ ngọt', name: '50% đường (Ít ngọt)', price: 0, isAvailable: true },
  { id: 8, restaurantId: 1, groupName: 'Topping thêm', name: 'Trân châu đen', price: 7000, isAvailable: true },
  { id: 9, restaurantId: 1, groupName: 'Topping thêm', name: 'Thạch phô mai', price: 9000, isAvailable: true },
  { id: 10, restaurantId: 1, groupName: 'Topping thêm', name: 'Trứng ốp la', price: 8000, isAvailable: true },
];

let mockProductToppingsMap: Record<number, number[]> = {
  1: [1, 2, 3],
  2: [4, 5, 6, 7, 8, 9],
  3: [1, 3],
};

export const restaurantApi = {
  /**
   * Lấy danh sách quán ăn có phân trang và tìm kiếm theo tên / danh mục / trạng thái
   */
  getAll: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    categoryId?: number;
    isOpen?: boolean;
  }): Promise<ApiResponse<PaginatedData<Shop>>> => {
    return apiClient.get<PaginatedData<Shop>>(API_ENDPOINTS.RESTAURANTS.LIST, { params });
  },

  /**
   * Lấy toàn bộ danh sách quán ăn không phân trang (dropdown chọn quán)
   */
  getAllRestaurantsNoPaging: async (): Promise<ApiResponse<Shop[]>> => {
    return apiClient.get<Shop[]>('/restaurants/all');
  },

  getById: async (id: number | string): Promise<ApiResponse<Shop>> => {
    return apiClient.get<Shop>(API_ENDPOINTS.RESTAURANTS.DETAIL(id));
  },

  /**
   * Lấy danh sách món ăn toàn hệ thống hoặc theo quán (hỗ trợ phân trang, tìm kiếm và lọc danh mục qua API)
   */
  getProducts: async (params?: {
    restaurantId?: number | string;
    page?: number;
    size?: number;
    search?: string;
    categoryId?: number;
    categoryName?: string;
    isAvailable?: boolean;
  }): Promise<ApiResponse<PaginatedData<ProductItem>>> => {
    return apiClient.get<PaginatedData<ProductItem>>('/products', { params });
  },

  // Merchant Portal: Menu & Catalog Management APIs
  /**
   * Lấy danh sách món ăn theo quán ăn có phân trang và tìm kiếm
   */
  getProductsByRestaurant: async (
    restaurantId: number | string,
    params?: {
      page?: number;
      size?: number;
      search?: string;
      categoryId?: number;
      isAvailable?: boolean;
    }
  ): Promise<ApiResponse<PaginatedData<ProductItem>>> => {
    return apiClient.get<PaginatedData<ProductItem>>(`/restaurants/${restaurantId}/products`, { params });
  },

  /**
   * Lấy toàn bộ món ăn không phân trang
   */
  getAllProducts: async (restaurantId: number | string): Promise<ApiResponse<ProductItem[]>> => {
    return apiClient.get<ProductItem[]>(`/restaurants/${restaurantId}/products/all`);
  },

  getCategories: async (restaurantId?: number | string): Promise<ApiResponse<MenuCategoryItem[]>> => {
    return apiClient.get<MenuCategoryItem[]>('/categories', { params: { restaurantId } });
  },

  createCategory: async (payload: { restaurantId: number; name: string }): Promise<ApiResponse<MenuCategoryItem>> => {
    return apiClient.post<MenuCategoryItem>('/categories', payload);
  },

  updateCategory: async (id: number | string, payload: { name: string; restaurantId?: number }): Promise<ApiResponse<MenuCategoryItem>> => {
    return apiClient.put<MenuCategoryItem>(`/categories/${id}`, payload);
  },

  deleteCategory: async (id: number | string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/categories/${id}`);
  },

  getVouchers: async (restaurantId?: number | string): Promise<ApiResponse<VoucherItem[]>> => {
    return apiClient.get<VoucherItem[]>('/vouchers', { params: { restaurantId } });
  },

  getVoucherById: async (id: number | string): Promise<ApiResponse<VoucherItem>> => {
    return apiClient.get<VoucherItem>(`/vouchers/${id}`);
  },

  createVoucher: async (payload: CreateVoucherPayload): Promise<ApiResponse<VoucherItem>> => {
    return apiClient.post<VoucherItem>('/vouchers', payload);
  },

  updateVoucher: async (id: number | string, payload: UpdateVoucherPayload): Promise<ApiResponse<VoucherItem>> => {
    return apiClient.put<VoucherItem>(`/vouchers/${id}`, payload);
  },

  deleteVoucher: async (id: number | string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/vouchers/${id}`);
  },

  toggleVoucher: async (id: number | string): Promise<ApiResponse<VoucherItem>> => {
    return apiClient.patch<VoucherItem>(`/vouchers/${id}/toggle`);
  },

  getProductDetail: async (productId: number | string): Promise<ApiResponse<ProductDetailItem>> => {
    try {
      return await apiClient.get<ProductDetailItem>(`/products/${productId}`);
    } catch {
      const assignedIds = mockProductToppingsMap[Number(productId)] || [];
      const assignedToppings = mockToppingsStore.filter((t) => assignedIds.includes(t.id));
      return {
        status: 200,
        message: 'Success',
        data: {
          id: Number(productId),
          name: 'Món ăn',
          price: 45000,
          isAvailable: true,
          toppings: assignedToppings,
          toppingGroups: [
            {
              groupName: 'Topping thêm',
              required: false,
              minSelection: 0,
              maxSelection: assignedToppings.length,
              toppings: assignedToppings,
            },
          ],
        },
        timestamp: new Date().toISOString(),
      };
    }
  },

  createProduct: async (data: ProductPayload): Promise<ApiResponse<ProductItem>> => {
    return apiClient.post<ProductItem>('/products', data);
  },

  updateProduct: async (id: number | string, data: ProductPayload): Promise<ApiResponse<ProductItem>> => {
    return apiClient.put<ProductItem>(`/products/${id}`, data);
  },

  deleteProduct: async (id: number | string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/products/${id}`);
  },

  updateProductStatus: async (id: number | string, isAvailable: boolean): Promise<ApiResponse<ProductItem>> => {
    return apiClient.put<ProductItem>(`/products/${id}/status`, { isAvailable });
  },

  getMyRestaurants: async (
    ownerId?: number,
    params?: { page?: number; size?: number; search?: string }
  ): Promise<ApiResponse<PaginatedData<Shop>>> => {
    return apiClient.get<PaginatedData<Shop>>('/restaurants/mine', {
      params: { ...params, ...(ownerId ? { ownerId } : {}) },
      headers: ownerId ? { 'X-User-Id': String(ownerId) } : undefined,
    });
  },

  getMyRestaurantsAll: async (ownerId?: number): Promise<ApiResponse<Shop[]>> => {
    return apiClient.get<Shop[]>('/restaurants/mine/all', {
      params: ownerId ? { ownerId } : undefined,
      headers: ownerId ? { 'X-User-Id': String(ownerId) } : undefined,
    });
  },

  createRestaurant: async (
    data: CreateRestaurantPayload,
    ownerId?: number
  ): Promise<ApiResponse<Shop>> => {
    return apiClient.post<Shop>('/restaurants', data, {
      params: ownerId ? { ownerId } : undefined,
      headers: ownerId ? { 'X-User-Id': String(ownerId) } : undefined,
    });
  },

  updateRestaurantDetails: async (
    restaurantId: number | string,
    data: CreateRestaurantPayload,
    ownerId?: number
  ): Promise<ApiResponse<Shop>> => {
    return apiClient.post<Shop>(`/restaurants/${restaurantId}/details`, data, {
      params: ownerId ? { ownerId } : undefined,
      headers: ownerId ? { 'X-User-Id': String(ownerId) } : undefined,
    });
  },

  updateRestaurantStatus: async (id: number | string, isOpen: boolean, reason?: string): Promise<ApiResponse<Shop>> => {
    return apiClient.patch<Shop>(`/restaurants/${id}/status`, { isOpen, temporaryClosedReason: reason });
  },

  // ---------------------------------------------------------------------------
  // SP2-MERCH-05: Topping Management & Assignment APIs
  // ---------------------------------------------------------------------------

  getToppingsByRestaurant: async (
    restaurantId: number | string,
    params?: { page?: number; size?: number; search?: string; groupName?: string; isAvailable?: boolean } | string
  ): Promise<ApiResponse<PaginatedData<ToppingItem>>> => {
    const queryParams = typeof params === 'string' ? { groupName: params } : (params || {});
    try {
      const res = await apiClient.get<PaginatedData<ToppingItem>>(API_ENDPOINTS.TOPPINGS.LIST, {
        params: { restaurantId, ...queryParams },
      });
      if (res && res.data) {
        return res;
      }
      return await apiClient.get<PaginatedData<ToppingItem>>(
        API_ENDPOINTS.RESTAURANTS.TOPPINGS(restaurantId),
        { params: queryParams }
      );
    } catch {
      const filtered = mockToppingsStore.filter((t) => t.restaurantId === Number(restaurantId));
      return {
        status: 200,
        message: 'Success',
        data: {
          content: filtered,
          totalElements: filtered.length,
          totalPages: 1,
          pageNumber: 0,
          pageSize: 10,
          last: true,
        },
        timestamp: new Date().toISOString(),
      };
    }
  },

  getAllToppings: async (
    restaurantId: number | string,
    groupName?: string
  ): Promise<ApiResponse<ToppingItem[]>> => {
    try {
      const res = await apiClient.get<ToppingItem[]>(API_ENDPOINTS.RESTAURANTS.TOPPINGS(restaurantId) + '/all', {
        params: groupName ? { groupName } : undefined,
      });
      if (res && res.data) {
        return res;
      }
      return {
        status: 200,
        message: 'Success',
        data: mockToppingsStore.filter((t) => t.restaurantId === Number(restaurantId)),
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 200,
        message: 'Success',
        data: mockToppingsStore.filter((t) => t.restaurantId === Number(restaurantId)),
        timestamp: new Date().toISOString(),
      };
    }
  },

  getToppingGroups: async (
    restaurantId: number | string
  ): Promise<ApiResponse<ToppingGroupItem[]>> => {
    try {
      return await apiClient.get<ToppingGroupItem[]>(API_ENDPOINTS.TOPPINGS.GROUPS, {
        params: { restaurantId },
      });
    } catch {
      const toppings = mockToppingsStore.filter((t) => t.restaurantId === Number(restaurantId));
      const groupMap: Record<string, ToppingItem[]> = {};
      toppings.forEach((t) => {
        const g = t.groupName || 'Topping thêm';
        if (!groupMap[g]) groupMap[g] = [];
        groupMap[g].push(t);
      });
      const groups: ToppingGroupItem[] = Object.entries(groupMap).map(([groupName, items]) => ({
        groupName,
        required: groupName.toLowerCase().includes('size'),
        minSelection: groupName.toLowerCase().includes('size') ? 1 : 0,
        maxSelection: items.length,
        toppings: items,
      }));
      return {
        status: 200,
        message: 'Fallback mock groups',
        data: groups,
        timestamp: new Date().toISOString(),
      };
    }
  },

  createTopping: async (data: CreateToppingPayload): Promise<ApiResponse<ToppingItem>> => {
    try {
      const res = await apiClient.post<ToppingItem>(API_ENDPOINTS.TOPPINGS.LIST, data);
      return res;
    } catch {
      const newTopping: ToppingItem = {
        id: Date.now(),
        restaurantId: data.restaurantId,
        groupName: data.groupName || 'Topping thêm',
        name: data.name,
        price: data.price,
        isAvailable: data.isAvailable ?? true,
      };
      mockToppingsStore.push(newTopping);
      return {
        status: 201,
        message: 'Tạo mới topping thành công',
        data: newTopping,
        timestamp: new Date().toISOString(),
      };
    }
  },

  updateTopping: async (
    id: number | string,
    data: UpdateToppingPayload
  ): Promise<ApiResponse<ToppingItem>> => {
    try {
      return await apiClient.put<ToppingItem>(API_ENDPOINTS.TOPPINGS.DETAIL(id), data);
    } catch {
      const idx = mockToppingsStore.findIndex((t) => t.id === Number(id));
      if (idx !== -1) {
        mockToppingsStore[idx] = {
          ...mockToppingsStore[idx],
          ...data,
        };
        return {
          status: 200,
          message: 'Cập nhật topping thành công',
          data: mockToppingsStore[idx],
          timestamp: new Date().toISOString(),
        };
      }
      throw new Error('Topping not found');
    }
  },

  updateToppingStatus: async (
    id: number | string,
    isAvailable: boolean
  ): Promise<ApiResponse<ToppingItem>> => {
    try {
      return await apiClient.patch<ToppingItem>(API_ENDPOINTS.TOPPINGS.STATUS(id), { isAvailable });
    } catch {
      const idx = mockToppingsStore.findIndex((t) => t.id === Number(id));
      if (idx !== -1) {
        mockToppingsStore[idx].isAvailable = isAvailable;
        return {
          status: 200,
          message: 'Cập nhật trạng thái topping thành công',
          data: mockToppingsStore[idx],
          timestamp: new Date().toISOString(),
        };
      }
      throw new Error('Topping not found');
    }
  },

  deleteTopping: async (id: number | string): Promise<ApiResponse<void>> => {
    try {
      return await apiClient.delete<void>(API_ENDPOINTS.TOPPINGS.DETAIL(id));
    } catch {
      mockToppingsStore = mockToppingsStore.filter((t) => t.id !== Number(id));
      Object.keys(mockProductToppingsMap).forEach((pid) => {
        mockProductToppingsMap[Number(pid)] = mockProductToppingsMap[Number(pid)].filter(
          (tid) => tid !== Number(id)
        );
      });
      return {
        status: 200,
        message: 'Xóa topping thành công',
        data: undefined,
        timestamp: new Date().toISOString(),
      };
    }
  },

  assignToppingsToProduct: async (
    productId: number | string,
    toppingIds: number[]
  ): Promise<ApiResponse<ToppingItem[]>> => {
    try {
      return await apiClient.post<ToppingItem[]>(
        API_ENDPOINTS.TOPPINGS.PRODUCT_TOPPINGS(productId),
        {
          toppingIds,
        }
      );
    } catch {
      mockProductToppingsMap[Number(productId)] = toppingIds;
      const assigned = mockToppingsStore.filter((t) => toppingIds.includes(t.id));
      return {
        status: 200,
        message: 'Gán danh sách topping cho món ăn thành công',
        data: assigned,
        timestamp: new Date().toISOString(),
      };
    }
  },

  getProductToppings: async (
    productId: number | string
  ): Promise<ApiResponse<ToppingItem[]>> => {
    try {
      return await apiClient.get<ToppingItem[]>(API_ENDPOINTS.TOPPINGS.PRODUCT_TOPPINGS(productId));
    } catch {
      const assignedIds = mockProductToppingsMap[Number(productId)] || [];
      const assigned = mockToppingsStore.filter((t) => assignedIds.includes(t.id));
      return {
        status: 200,
        message: 'Success',
        data: assigned,
        timestamp: new Date().toISOString(),
      };
    }
  },
};
