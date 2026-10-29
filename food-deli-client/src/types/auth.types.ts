export type UserRole =
  | 'ROLE_ADMIN'
  | 'ROLE_MERCHANT'
  | 'ROLE_SHIPPER'
  | 'ROLE_DRIVER'
  | 'ROLE_CUSTOMER'
  | 'ADMIN'
  | 'MERCHANT'
  | 'SHIPPER'
  | 'DRIVER'
  | 'CUSTOMER';

export interface User {
  id: number | string;
  phone: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  ratingAvg?: number;
  roles?: string[];
  role: UserRole;
  status?: string;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
}

export interface LoginRequest {
  phone: string;
  password: string;
  role?: string;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  fullName: string;
  email?: string;
  role?: 'CUSTOMER' | 'MERCHANT' | 'SHIPPER' | 'DRIVER';
}

export interface UpdateProfileRequest {
  fullName: string;
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
