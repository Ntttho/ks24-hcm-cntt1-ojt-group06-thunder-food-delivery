export type UserRole = 'ROLE_ADMIN' | 'ROLE_MERCHANT' | 'ROLE_SHIPPER' | 'ROLE_CUSTOMER' | 'ADMIN' | 'MERCHANT' | 'SHIPPER' | 'CUSTOMER';

export interface User {
  id: number | string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: UserRole;
  status?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  role?: 'CUSTOMER' | 'MERCHANT' | 'SHIPPER';
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
