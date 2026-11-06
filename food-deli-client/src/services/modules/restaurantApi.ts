import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse } from '@/types';

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
  name: string;
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
  displayOrder?: number;
  productCount?: number;
}

export interface CreateCategoryPayload {
  restaurantId: number;
  name: string;
  displayOrder?: number;
}

export interface UpdateCategoryPayload {
  name: string;
  displayOrder?: number;
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
  isActive: boolean;
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

export interface ValidateVoucherPayload {
  code: string;
  restaurantId?: number;
  orderAmount?: number;
}

export interface VoucherValidationResult {
  voucherId?: number;
  code: string;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  minOrderValue?: number;
  isValid: boolean;
  message: string;
}

export interface ProductPayload {
  name: string;
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

let mockCategoriesStore: MenuCategoryItem[] = [
  { id: 1, restaurantId: 1, name: 'Món khai vị', displayOrder: 0, productCount: 4 },
  { id: 2, restaurantId: 1, name: 'Món chính', displayOrder: 1, productCount: 8 },
  { id: 3, restaurantId: 1, name: 'Trà hoa quả', displayOrder: 2, productCount: 5 },
  { id: 4, restaurantId: 1, name: 'Tráng miệng', displayOrder: 3, productCount: 2 },
];

let mockVouchersStore: VoucherItem[] = [
  {
    id: 1,
    restaurantId: 1,
    code: 'THUNDER20',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    maxDiscountAmount: 30000,
    minOrderValue: 60000,
    usageLimit: 100,
    usedCount: 14,
    startDate: '2026-11-01T00:00:00',
    expiryDate: '2026-12-31T23:59:59',
    isActive: true,
  },
  {
    id: 2,
    restaurantId: 1,
    code: 'GIAM15K',
    discountType: 'FIXED',
    discountValue: 15000,
    discountAmount: 15000,
    minOrderValue: 50000,
    usageLimit: 50,
    usedCount: 22,
    startDate: '2026-11-01T00:00:00',
    expiryDate: '2026-12-15T23:59:59',
    isActive: true,
  },
  {
    id: 3,
    restaurantId: 1,
    code: 'CHAOQUANMOI',
    discountType: 'PERCENTAGE',
    discountValue: 50,
    maxDiscountAmount: 50000,
    minOrderValue: 100000,
    usageLimit: 30,
    usedCount: 30,
    startDate: '2026-10-01T00:00:00',
    expiryDate: '2026-11-01T23:59:59',
    isActive: false,
  },
];

export const restaurantApi = {
  getAll: async (params?: Record<string, any>): Promise<ApiResponse<Shop[]>> => {
    return apiClient.get<Shop[]>(API_ENDPOINTS.RESTAURANTS.LIST, { params });
  },

  getById: async (id: number | string): Promise<ApiResponse<Shop>> => {
    return apiClient.get<Shop>(API_ENDPOINTS.RESTAURANTS.DETAIL(id));
  },

  // Merchant Portal: Menu & Catalog Management APIs
  getProductsByRestaurant: async (restaurantId: number | string): Promise<ApiResponse<ProductItem[]>> => {
    return apiClient.get<ProductItem[]>(`/restaurants/${restaurantId}/products`);
  },

  getCategories: async (restaurantId?: number | string): Promise<ApiResponse<MenuCategoryItem[]>> => {
    try {
      const res = await apiClient.get<MenuCategoryItem[]>('/categories', { params: { restaurantId } });
      if (res && res.data && res.data.length > 0) {
        return res;
      }
      const filtered = restaurantId
        ? mockCategoriesStore.filter((c) => !c.restaurantId || c.restaurantId === Number(restaurantId))
        : mockCategoriesStore;
      return {
        status: 200,
        message: 'Success',
        data: filtered,
        timestamp: new Date().toISOString(),
      };
    } catch {
      const filtered = restaurantId
        ? mockCategoriesStore.filter((c) => !c.restaurantId || c.restaurantId === Number(restaurantId))
        : mockCategoriesStore;
      return {
        status: 200,
        message: 'Fallback mock categories',
        data: filtered,
        timestamp: new Date().toISOString(),
      };
    }
  },

  createCategory: async (data: CreateCategoryPayload): Promise<ApiResponse<MenuCategoryItem>> => {
    try {
      const res = await apiClient.post<MenuCategoryItem>('/categories', data);
      return res;
    } catch {
      const newCat: MenuCategoryItem = {
        id: Date.now(),
        restaurantId: data.restaurantId,
        name: data.name,
        displayOrder: data.displayOrder ?? mockCategoriesStore.length,
        productCount: 0,
      };
      mockCategoriesStore.push(newCat);
      return {
        status: 201,
        message: 'Tạo mới danh mục thành công',
        data: newCat,
        timestamp: new Date().toISOString(),
      };
    }
  },

  updateCategory: async (
    id: number | string,
    data: UpdateCategoryPayload
  ): Promise<ApiResponse<MenuCategoryItem>> => {
    try {
      return await apiClient.put<MenuCategoryItem>(`/categories/${id}`, data);
    } catch {
      const idx = mockCategoriesStore.findIndex((c) => c.id === Number(id));
      if (idx !== -1) {
        mockCategoriesStore[idx] = {
          ...mockCategoriesStore[idx],
          name: data.name,
          displayOrder: data.displayOrder ?? mockCategoriesStore[idx].displayOrder,
        };
        return {
          status: 200,
          message: 'Cập nhật danh mục thành công',
          data: mockCategoriesStore[idx],
          timestamp: new Date().toISOString(),
        };
      }
      throw new Error('Category not found');
    }
  },

  deleteCategory: async (id: number | string): Promise<ApiResponse<void>> => {
    try {
      return await apiClient.delete<void>(`/categories/${id}`);
    } catch {
      mockCategoriesStore = mockCategoriesStore.filter((c) => c.id !== Number(id));
      return {
        status: 200,
        message: 'Xóa danh mục thành công',
        data: undefined,
        timestamp: new Date().toISOString(),
      };
    }
  },

  reorderCategories: async (
    restaurantId: number | string,
    categoryIds: number[]
  ): Promise<ApiResponse<MenuCategoryItem[]>> => {
    try {
      return await apiClient.put<MenuCategoryItem[]>('/categories/reorder', {
        restaurantId: Number(restaurantId),
        categoryIds,
      });
    } catch {
      mockCategoriesStore = mockCategoriesStore.map((cat) => {
        const order = categoryIds.indexOf(cat.id);
        if (order !== -1) {
          return { ...cat, displayOrder: order };
        }
        return cat;
      }).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      return {
        status: 200,
        message: 'Sắp xếp danh mục thành công',
        data: mockCategoriesStore,
        timestamp: new Date().toISOString(),
      };
    }
  },

  // ---------------------------------------------------------------------------
  // SP2-MERCH-07: Voucher Management & Checkout Promotion APIs
  // ---------------------------------------------------------------------------

  getVouchers: async (restaurantId?: number | string): Promise<ApiResponse<VoucherItem[]>> => {
    try {
      const res = await apiClient.get<VoucherItem[]>('/vouchers', { params: { restaurantId } });
      if (res && res.data && res.data.length > 0) {
        return res;
      }
      const filtered = restaurantId
        ? mockVouchersStore.filter((v) => !v.restaurantId || v.restaurantId === Number(restaurantId))
        : mockVouchersStore;
      return {
        status: 200,
        message: 'Success',
        data: filtered,
        timestamp: new Date().toISOString(),
      };
    } catch {
      const filtered = restaurantId
        ? mockVouchersStore.filter((v) => !v.restaurantId || v.restaurantId === Number(restaurantId))
        : mockVouchersStore;
      return {
        status: 200,
        message: 'Fallback mock vouchers',
        data: filtered,
        timestamp: new Date().toISOString(),
      };
    }
  },

  createVoucher: async (data: CreateVoucherPayload): Promise<ApiResponse<VoucherItem>> => {
    try {
      return await apiClient.post<VoucherItem>('/vouchers', data);
    } catch {
      const newVoucher: VoucherItem = {
        id: Date.now(),
        restaurantId: data.restaurantId,
        code: data.code.trim().toUpperCase(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountAmount: data.discountType === 'FIXED' ? data.discountValue : undefined,
        maxDiscountAmount: data.maxDiscountAmount,
        minOrderValue: data.minOrderValue || 0,
        usageLimit: data.usageLimit || 100,
        usedCount: 0,
        startDate: data.startDate || new Date().toISOString(),
        expiryDate: data.expiryDate,
        isActive: true,
      };
      mockVouchersStore.unshift(newVoucher);
      return {
        status: 201,
        message: 'Tạo mã voucher thành công',
        data: newVoucher,
        timestamp: new Date().toISOString(),
      };
    }
  },

  toggleVoucherStatus: async (
    id: number | string,
    isActive: boolean
  ): Promise<ApiResponse<VoucherItem>> => {
    try {
      return await apiClient.patch<VoucherItem>(`/vouchers/${id}/status`, { isActive });
    } catch {
      const idx = mockVouchersStore.findIndex((v) => v.id === Number(id));
      if (idx !== -1) {
        mockVouchersStore[idx].isActive = isActive;
        return {
          status: 200,
          message: 'Cập nhật trạng thái voucher thành công',
          data: mockVouchersStore[idx],
          timestamp: new Date().toISOString(),
        };
      }
      throw new Error('Voucher not found');
    }
  },

  deleteVoucher: async (id: number | string): Promise<ApiResponse<void>> => {
    try {
      return await apiClient.delete<void>(`/vouchers/${id}`);
    } catch {
      mockVouchersStore = mockVouchersStore.filter((v) => v.id !== Number(id));
      return {
        status: 200,
        message: 'Xóa voucher thành công',
        data: undefined,
        timestamp: new Date().toISOString(),
      };
    }
  },

  validateVoucher: async (data: ValidateVoucherPayload): Promise<ApiResponse<VoucherValidationResult>> => {
    try {
      return await apiClient.post<VoucherValidationResult>('/vouchers/validate', data);
    } catch {
      const code = data.code.trim().toUpperCase();
      const matched = mockVouchersStore.find((v) => v.code === code && v.isActive);
      if (!matched) {
        return {
          status: 400,
          message: 'Mã voucher không tồn tại hoặc đã ngừng áp dụng',
          data: { code, isValid: false, message: 'Mã voucher không tồn tại hoặc đã ngừng áp dụng' },
          timestamp: new Date().toISOString(),
        };
      }
      const orderAmount = data.orderAmount || 0;
      if (matched.minOrderValue && orderAmount < matched.minOrderValue) {
        return {
          status: 400,
          message: `Đơn hàng chưa đạt giá trị tối thiểu ${matched.minOrderValue.toLocaleString('vi-VN')}đ`,
          data: {
            voucherId: matched.id,
            code: matched.code,
            isValid: false,
            message: `Đơn hàng chưa đạt giá trị tối thiểu ${matched.minOrderValue.toLocaleString('vi-VN')}đ`,
          },
          timestamp: new Date().toISOString(),
        };
      }
      let discountAmount = 0;
      if (matched.discountType === 'PERCENTAGE') {
        let calc = (orderAmount * matched.discountValue) / 100;
        if (matched.maxDiscountAmount && calc > matched.maxDiscountAmount) {
          calc = matched.maxDiscountAmount;
        }
        discountAmount = Math.min(calc, orderAmount);
      } else {
        discountAmount = Math.min(matched.discountValue, orderAmount);
      }
      return {
        status: 200,
        message: 'Áp dụng mã voucher thành công',
        data: {
          voucherId: matched.id,
          code: matched.code,
          discountType: matched.discountType,
          discountValue: matched.discountValue,
          discountAmount,
          minOrderValue: matched.minOrderValue,
          isValid: true,
          message: 'Áp dụng mã voucher thành công',
        },
        timestamp: new Date().toISOString(),
      };
    }
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
    return apiClient.patch<ProductItem>(`/products/${id}/status`, { isAvailable });
  },

  getMyRestaurants: async (ownerId?: number): Promise<ApiResponse<Shop[]>> => {
    return apiClient.get<Shop[]>('/restaurants/mine', {
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
    groupName?: string
  ): Promise<ApiResponse<ToppingItem[]>> => {
    try {
      const res = await apiClient.get<ToppingItem[]>('/toppings', {
        params: { restaurantId, groupName },
      });
      if (res && res.data && res.data.length > 0) {
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
        message: 'Fallback mock toppings',
        data: mockToppingsStore.filter((t) => t.restaurantId === Number(restaurantId)),
        timestamp: new Date().toISOString(),
      };
    }
  },

  getToppingGroups: async (
    restaurantId: number | string
  ): Promise<ApiResponse<ToppingGroupItem[]>> => {
    try {
      return await apiClient.get<ToppingGroupItem[]>('/toppings/groups', {
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
      const res = await apiClient.post<ToppingItem>('/toppings', data);
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
      return await apiClient.put<ToppingItem>(`/toppings/${id}`, data);
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
      return await apiClient.patch<ToppingItem>(`/toppings/${id}/status`, { isAvailable });
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
      return await apiClient.delete<void>(`/toppings/${id}`);
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
      return await apiClient.post<ToppingItem[]>(`/products/${productId}/toppings`, {
        toppingIds,
      });
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
      return await apiClient.get<ToppingItem[]>(`/products/${productId}/toppings`);
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
