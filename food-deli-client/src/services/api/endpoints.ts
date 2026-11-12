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
    STATUS: (id: number | string) => `/users/${id}/status`,
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
  REVENUE: {
    SUMMARY: '/orders/revenue/summary',
    CHART: '/orders/revenue/chart',
    TOP_FOODS: '/orders/revenue/top-foods',
    BRANCHES: '/orders/revenue/branches',
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
    SUBMIT: '/reviews',
    SUBMIT_RESTAURANT: '/reviews/restaurant',
    SUBMIT_DRIVER: '/reviews/driver',
    ORDER_STATUS: (orderId: number | string) => `/reviews/orders/${orderId}/status`,
    ORDER_ELIGIBILITY: (orderId: number | string) => `/reviews/orders/${orderId}/eligibility`,
    RESTAURANT_REVIEWS: (restaurantId: number | string) => `/reviews/restaurants/${restaurantId}`,
    RESTAURANT_SUMMARY: (restaurantId: number | string) => `/reviews/restaurants/${restaurantId}/summary`,
    MERCHANT_MINE: '/reviews/merchant/mine',
    DRIVER_MINE: '/reviews/driver/mine',
    DRIVER_SUMMARY: '/reviews/driver/summary',
    ADMIN_ALL: '/reviews/admin',
    ADMIN_DETAIL: (id: number | string) => `/reviews/admin/${id}`,
  },
  // Payment Service (VietQR Napas 247 & SePay Gateway)
  PAYMENTS: {
    SEPAY_GENERATE: '/payments/sepay/generate',
    ORDER_STATUS: (orderId: number | string) => `/payments/orders/${orderId}/status`,
    COD: '/payments/cod',
  },
  // Admin Portal & Approvals (SP3-ADM-02)
  ADMIN: {
    CHANGE_REQUESTS: '/restaurants/change-requests',
    CHANGE_REQUEST_DETAIL: (id: number | string) => `/restaurants/change-requests/${id}`,
    APPROVE_CHANGE_REQUEST: (id: number | string) => `/restaurants/change-requests/${id}/approve`,
    REJECT_CHANGE_REQUEST: (id: number | string) => `/restaurants/change-requests/${id}/reject`,
    DRIVER_APPROVALS: '/drivers/approvals',
    DRIVER_APPROVAL_DETAIL: (userId: number | string) => `/drivers/${userId}/approval`,
    APPROVE_DRIVER: (userId: number | string) => `/drivers/${userId}/approve`,
    REJECT_DRIVER: (userId: number | string) => `/drivers/${userId}/reject`,
    SETTINGS: '/admin/settings',
    ANALYTICS_SUMMARY: '/admin/analytics/summary',
  },
  // Public Platform Settings (Order Fees & Shipping)
  SETTINGS: {
    ORDER_FEES: '/settings/order-fees',
    SHIPPING: '/settings/shipping',
  },
} as const;
