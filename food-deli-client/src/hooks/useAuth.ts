import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import { loginThunk, logout as logoutAction, clearAuthError } from '@/store/slices/authSlice';
import type { LoginRequest } from '@/types';
import { ROLES } from '@/constants';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  );

  const login = async (credentials: LoginRequest) => {
    return dispatch(loginThunk(credentials)).unwrap();
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  const clearError = () => {
    dispatch(clearAuthError());
  };

  const role = user?.role;
  const isAdmin = role === ROLES.ADMIN || role === 'ADMIN';
  const isMerchant = role === ROLES.MERCHANT || role === 'MERCHANT';
  const isShipper = role === ROLES.SHIPPER || role === 'SHIPPER';
  const isCustomer = role === ROLES.CUSTOMER || role === 'CUSTOMER' || (!isAdmin && !isMerchant && !isShipper);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    role,
    isAdmin,
    isMerchant,
    isShipper,
    isCustomer,
    login,
    logout,
    clearError,
  };
};
