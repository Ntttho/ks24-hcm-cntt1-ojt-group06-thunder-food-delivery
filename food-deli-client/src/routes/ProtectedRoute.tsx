import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';
import type { UserRole } from '@/types';
import { normalizeRole } from '@/utils/jwt';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  showForbiddenResult?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo,
  showForbiddenResult = true,
}) => {
  const { isAuthenticated, user, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // 1. Phải đăng nhập: Khách vãng lai chưa đăng nhập bị chuyển hướng đến /login
  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // 2. Kiểm tra phân quyền RBAC: Bắt buộc role của người dùng phải thuộc allowedRoles
  if (allowedRoles && allowedRoles.length > 0) {
    const activeRole = normalizeRole(user?.role || role);
    const userRoles: string[] = [
      activeRole,
      ...(user?.roles || []).map((r: string) => normalizeRole(r)),
    ];

    const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));
    const hasPermission = normalizedAllowed.some((allowed) =>
      userRoles.includes(allowed)
    );

    if (!hasPermission) {
      if (redirectTo) {
        return <Navigate to={redirectTo} replace />;
      }

      if (showForbiddenResult) {
        const isDriverArea = normalizedAllowed.includes('ROLE_DRIVER') || normalizedAllowed.includes('ROLE_SHIPPER');
        const forbiddenMessage = isDriverArea
          ? 'Tài khoản của bạn không có quyền truy cập vào phân hệ này. Cổng làm việc này chỉ dành riêng cho Đối tác Tài xế (Driver / Shipper).'
          : 'Tài khoản của bạn không có quyền truy cập vào phân hệ này. Khu vực này chỉ dành riêng cho Đối tác Quán ăn (Merchant) hoặc Quản trị viên (Admin).';

        return (
          <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50">
            <Result
              status="403"
              title="403 - Quyền truy cập bị từ chối"
              subTitle={forbiddenMessage}
              extra={
                <Link to={APP_ROUTES.HOME}>
                  <Button type="primary" className="bg-orange-500 hover:bg-orange-600 font-bold rounded-xl shadow-xs">
                    Quay về Trang chủ
                  </Button>
                </Link>
              }
            />
          </div>
        );
      }

      return <Navigate to={APP_ROUTES.HOME} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
