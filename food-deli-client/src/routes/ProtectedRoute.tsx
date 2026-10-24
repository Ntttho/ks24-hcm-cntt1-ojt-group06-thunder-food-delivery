import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null; // Or a spinner
  }

  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && user) {
    const hasRole = allowedRoles.includes(user.role);
    if (!hasRole) {
      return <Navigate to={APP_ROUTES.HOME} replace />;
    }
  }

  return children;
};
