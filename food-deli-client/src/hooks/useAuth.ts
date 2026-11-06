import { useEffect } from 'react';
import { message } from 'antd';
import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import {
  loginThunk,
  registerThunk,
  fetchProfileThunk,
  updateProfileThunk,
  logout as logoutAction,
  clearAuthError,
} from '@/store/slices/authSlice';
import type { LoginRequest, RegisterRequest, UpdateProfileRequest } from '@/types';
import { ROLES } from '@/constants';
import { isTokenExpired, normalizeRole, getRoleFromToken } from '@/utils/jwt';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  );

  // Proactive real-time token expiration check (ticks every 2s)
  useEffect(() => {
    if (!token) return;

    const checkExpiration = () => {
      if (isTokenExpired(token)) {
        dispatch(logoutAction());
        message.warning({
          content: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          key: 'token-expired-toast',
        });
      }
    };

    checkExpiration();
    const timer = setInterval(checkExpiration, 2000);

    return () => clearInterval(timer);
  }, [token, dispatch]);

  const login = async (credentials: LoginRequest) => {
    return dispatch(loginThunk(credentials)).unwrap();
  };

  const register = async (data: RegisterRequest) => {
    return dispatch(registerThunk(data)).unwrap();
  };

  const fetchProfile = async () => {
    return dispatch(fetchProfileThunk()).unwrap();
  };

  const updateProfile = async (data: UpdateProfileRequest) => {
    return dispatch(updateProfileThunk(data)).unwrap();
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  const clearError = () => {
    dispatch(clearAuthError());
  };

  // Determine user role with fallback to JWT decoded claims
  const rawRole = user?.role || (token ? getRoleFromToken(token) : null);
  const normalizedRole = normalizeRole(rawRole);

  const isAdmin = normalizedRole === ROLES.ADMIN || normalizedRole === 'ROLE_ADMIN';
  const isMerchant = normalizedRole === ROLES.MERCHANT || normalizedRole === 'ROLE_MERCHANT';
  const isShipper =
    normalizedRole === ROLES.SHIPPER ||
    normalizedRole === 'ROLE_SHIPPER' ||
    normalizedRole === ROLES.DRIVER ||
    normalizedRole === 'ROLE_DRIVER';
  const isCustomer =
    normalizedRole === ROLES.CUSTOMER ||
    normalizedRole === 'ROLE_CUSTOMER' ||
    (!isAdmin && !isMerchant && !isShipper);

  return {
    user,
    token,
    isAuthenticated: isAuthenticated && !isTokenExpired(token),
    isLoading,
    error,
    role: normalizedRole,
    rawRole,
    isAdmin,
    isMerchant,
    isShipper,
    isCustomer,
    login,
    register,
    fetchProfile,
    updateProfile,
    logout,
    clearError,
  };
};
