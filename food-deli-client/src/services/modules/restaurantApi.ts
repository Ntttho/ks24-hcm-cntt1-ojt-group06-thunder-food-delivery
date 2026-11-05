import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse } from '@/types';

export interface Shop {
  id: number;
  name: string;
  address: string;
  phoneNumber?: string;
  openingTime?: string;
  closingTime?: string;
  rating?: number;
  ratingAvg?: number;
  imageUrl?: string;
  status?: string;
  isOpen?: boolean;
  isOpenToday?: boolean;
  temporaryClosedReason?: string;
  approvalStatus?: string;
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
  description?: string;
}

export interface ToppingItem {
  id: number;
  restaurantId?: number;
  name: string;
  price: number;
  isAvailable?: boolean;
}

export interface ProductToppingGroup {
  groupName: string;
  required?: boolean;
  minSelection?: number;
  maxSelection?: number;
  toppings: ToppingItem[];
}

export interface ProductDetail extends Omit<ProductItem, 'isAvailable'> {
  isAvailable: boolean;
  restaurantId?: number;
  restaurantName?: string;
  toppingGroups?: ProductToppingGroup[];
  toppings?: ToppingItem[];
}

export interface RestaurantDetail extends Shop {
  categories?: Array<{
    id: number;
    name: string;
    products: ProductItem[];
  }>;
}

export interface RestaurantPage {
  content: Shop[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface MenuCategoryItem {
  id: number;
  name: string;
  restaurantId?: number;
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

export const restaurantApi = {
  getAll: async (params?: Record<string, string | number | boolean>): Promise<ApiResponse<RestaurantPage>> => {
    return apiClient.get<RestaurantPage>(API_ENDPOINTS.RESTAURANTS.LIST, { params });
  },

  getById: async (id: number | string): Promise<ApiResponse<RestaurantDetail>> => {
    return apiClient.get<RestaurantDetail>(API_ENDPOINTS.RESTAURANTS.DETAIL(id));
  },

  // Merchant Portal: Menu & Catalog Management APIs
  getProductsByRestaurant: async (restaurantId: number | string): Promise<ApiResponse<ProductItem[]>> => {
    return apiClient.get<ProductItem[]>(`/restaurants/${restaurantId}/products`);
  },

  getProductDetail: async (productId: number | string): Promise<ApiResponse<ProductDetail>> => {
    return apiClient.get<ProductDetail>(API_ENDPOINTS.RESTAURANTS.PRODUCT_DETAIL(productId));
  },

  getCategories: async (restaurantId?: number | string): Promise<ApiResponse<MenuCategoryItem[]>> => {
    return apiClient.get<MenuCategoryItem[]>('/categories', { params: { restaurantId } });
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
    return apiClient.get<Shop[]>('/restaurants/mine', { params: { ownerId } });
  },

  updateRestaurantStatus: async (id: number | string, isOpen: boolean, reason?: string): Promise<ApiResponse<Shop>> => {
    return apiClient.patch<Shop>(`/restaurants/${id}/status`, { isOpen, temporaryClosedReason: reason });
  },
};
