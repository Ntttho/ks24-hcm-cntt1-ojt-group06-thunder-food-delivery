import { ROLES } from '@/constants';

export interface DecodedJwtPayload {
  sub?: string;
  userId?: number;
  phone?: string;
  role?: string;
  roles?: string[];
  exp?: number;
  iat?: number;
  [key: string]: any;
}

/**
 * UTF-8 Safe JWT Decoder for browser environments without external dependencies
 */
export const decodeJwt = (token: string | null | undefined): DecodedJwtPayload | null => {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.warn('[JWT] Failed to decode token:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired (with 10-second buffer for clock skew)
 */
export const isTokenExpired = (token: string | null | undefined): boolean => {
  if (!token) return true;

  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') {
    return false; // If no exp claim, consider valid or let server decide
  }

  const currentTimeInSeconds = Math.floor(Date.now() / 1000);
  return currentTimeInSeconds >= payload.exp - 10;
};

/**
 * Normalize role string to uppercase ROLE_* format
 */
export const normalizeRole = (role?: string | null): string => {
  if (!role) return ROLES.CUSTOMER;
  const upper = role.trim().toUpperCase();
  if (upper.startsWith('ROLE_')) return upper;
  return `ROLE_${upper}`;
};

/**
 * Extract active user role from JWT token or fallback
 */
export const getRoleFromToken = (token: string | null | undefined): string => {
  const payload = decodeJwt(token);
  if (!payload) return ROLES.CUSTOMER;

  if (payload.role) {
    return normalizeRole(payload.role);
  }

  if (Array.isArray(payload.roles) && payload.roles.length > 0) {
    return normalizeRole(payload.roles[0]);
  }

  return ROLES.CUSTOMER;
};
