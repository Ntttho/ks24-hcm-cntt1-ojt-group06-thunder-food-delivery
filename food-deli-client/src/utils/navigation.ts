import { APP_ROUTES, ROLES } from '@/constants';
import { normalizeRole } from './jwt';

/**
 * Điều hướng từng role về trang chính của họ:
 * - ADMIN: /admin/dashboard
 * - MERCHANT: /merchant
 * - DRIVER / SHIPPER: /shipper
 * - CUSTOMER: /
 */
export const getRoleDefaultPath = (role?: string | null): string => {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case 'ROLE_ADMIN':
    case ROLES.ADMIN:
      return APP_ROUTES.ADMIN_DASHBOARD; // '/admin/dashboard'
    case 'ROLE_MERCHANT':
    case ROLES.MERCHANT:
      return APP_ROUTES.MERCHANT_DASHBOARD; // '/merchant'
    case 'ROLE_DRIVER':
    case 'ROLE_SHIPPER':
    case ROLES.DRIVER:
    case ROLES.SHIPPER:
      return APP_ROUTES.SHIPPER_DASHBOARD; // '/shipper'
    case 'ROLE_CUSTOMER':
    case ROLES.CUSTOMER:
    default:
      return APP_ROUTES.HOME; // '/'
  }
};

/**
 * Tên hiển thị vai trò người dùng tiếng Việt chuẩn hóa
 */
export const getRoleDisplayName = (role?: string | null): string => {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case 'ROLE_ADMIN':
    case ROLES.ADMIN:
      return 'Quản trị viên (Admin)';
    case 'ROLE_MERCHANT':
    case ROLES.MERCHANT:
      return 'Đối tác Quán (Merchant)';
    case 'ROLE_DRIVER':
    case 'ROLE_SHIPPER':
    case ROLES.DRIVER:
    case ROLES.SHIPPER:
      return 'Tài xế giao vận (Driver)';
    case 'ROLE_CUSTOMER':
    case ROLES.CUSTOMER:
    default:
      return 'Khách hàng';
  }
};

/**
 * Màu sắc hiển thị Tag Ant Design cho từng vai trò
 */
export const getRoleBadgeColor = (role?: string | null): string => {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case 'ROLE_ADMIN':
    case ROLES.ADMIN:
      return 'red';
    case 'ROLE_MERCHANT':
    case ROLES.MERCHANT:
      return 'purple';
    case 'ROLE_DRIVER':
    case 'ROLE_SHIPPER':
    case ROLES.DRIVER:
    case ROLES.SHIPPER:
      return 'blue';
    default:
      return 'green';
  }
};

