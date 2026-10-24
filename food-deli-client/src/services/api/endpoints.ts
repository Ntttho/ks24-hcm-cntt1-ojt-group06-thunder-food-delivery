export const API_ENDPOINTS = {
  // Auth & User Service
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/users/me',
    UPDATE_PROFILE: '/users/me',
  },
  // Restaurant & Catalog Service
  RESTAURANTS: {
    LIST: '/restaurants',
    DETAIL: (id: number | string) => `/restaurants/${id}`,
    CATEGORIES: '/categories',
    PRODUCTS: (shopId: number | string) => `/restaurants/${shopId}/products`,
    PRODUCT_DETAIL: (id: number | string) => `/products/${id}`,
  },
  // Order Service
  ORDERS: {
    CREATE: '/orders',
    LIST: '/orders',
    DETAIL: (id: number | string) => `/orders/${id}`,
    CANCEL: (id: number | string) => `/orders/${id}/cancel`,
    STATUS: (id: number | string) => `/orders/${id}/status`,
  },
  // Delivery & Shipper Service
  DELIVERY: {
    AVAILABLE_ORDERS: '/delivery/available',
    ACCEPT: (orderId: number | string) => `/delivery/orders/${orderId}/accept`,
    UPDATE_STATUS: (orderId: number | string) => `/delivery/orders/${orderId}/status`,
    EARNINGS: '/delivery/earnings',
  },
  // Review Service
  REVIEWS: {
    SHOP_REVIEWS: (shopId: number | string) => `/reviews/shops/${shopId}`,
    CREATE: '/reviews',
  },
} as const;
