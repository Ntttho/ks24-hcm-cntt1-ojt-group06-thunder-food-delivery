export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'thunder_access_token',
  REFRESH_TOKEN: 'thunder_refresh_token',
  USER_INFO: 'thunder_user_info',
  CART: 'thunder_cart',
} as const;

export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  RESTAURANTS: '/restaurants',
  RESTAURANT_DETAIL: '/restaurants/:id',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',
  PROFILE: '/profile',
  ADMIN_DASHBOARD: '/admin',
  MERCHANT_DASHBOARD: '/merchant',
  SHIPPER_DASHBOARD: '/shipper',
  NOT_FOUND: '*',
} as const;

export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  MERCHANT: 'ROLE_MERCHANT',
  SHIPPER: 'ROLE_SHIPPER',
  CUSTOMER: 'ROLE_CUSTOMER',
} as const;
