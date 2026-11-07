export const API_ENDPOINTS = {
  // Auth & User Service
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/me',
    USERS_ME: '/users/me',
    UPDATE_PROFILE: '/auth/profile',
  },
  // User Management
  USERS: {
    LIST: '/users',
    DETAIL: (id: number | string) => `/users/${id}`,
    ALL: '/users/all',
  },
  // Customer User Addresses (Sổ địa chỉ)
  ADDRESSES: {
    MINE: '/users/addresses',
    ALTERNATIVE_MINE: '/addresses/mine',
    DETAIL: (id: number | string) => `/users/addresses/${id}`,
    SET_DEFAULT: (id: number | string) => `/users/addresses/${id}/default`,
  },
  // Restaurant & Catalog Service
  RESTAURANTS: {
    LIST: '/restaurants',
    DETAIL: (id: number | string) => `/restaurants/${id}`,
    CATEGORIES: '/categories',
    PRODUCTS: (shopId: number | string) => `/restaurants/${shopId}/products`,
    PRODUCT_DETAIL: (id: number | string) => `/products/${id}`,
    TOPPINGS: (restaurantId: number | string) => `/restaurants/${restaurantId}/toppings`,
  },
  // Toppings & Topping Groups (SP2-MERCH-05 & Customer Selection)
  TOPPINGS: {
    LIST: '/toppings',
    GROUPS: '/toppings/groups',
    DETAIL: (id: number | string) => `/toppings/${id}`,
    STATUS: (id: number | string) => `/toppings/${id}/status`,
    BY_RESTAURANT: (restaurantId: number | string) => `/toppings?restaurantId=${restaurantId}`,
    RESTAURANT_TOPPINGS: (restaurantId: number | string) => `/restaurants/${restaurantId}/toppings`,
    PRODUCT_TOPPINGS: (productId: number | string) => `/products/${productId}/toppings`,
  },
  // Vouchers
  VOUCHERS: {
    LIST: '/vouchers',
    DETAIL: (id: number | string) => `/vouchers/${id}`,
    BY_RESTAURANT: (restaurantId: number | string) => `/vouchers?restaurantId=${restaurantId}`,
    RESTAURANT_VOUCHERS: (restaurantId: number | string) => `/restaurants/${restaurantId}/vouchers`,
  },
  // Cart Service (Redis Sync)
  CART: {
    GET: '/cart',
    ADD_ITEM: '/cart/items',
    UPDATE_ITEM: (itemId: string) => `/cart/items/${itemId}`,
    REMOVE_ITEM: (itemId: string) => `/cart/items/${itemId}`,
    CLEAR: '/cart',
    SYNC: '/cart/sync',
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
  // Payment Service (VietQR Napas 247 & SePay Gateway)
  PAYMENTS: {
    SEPAY_GENERATE: '/payments/sepay/generate',
    ORDER_STATUS: (orderId: number | string) => `/payments/orders/${orderId}/status`,
    COD: '/payments/cod',
  },
} as const;
