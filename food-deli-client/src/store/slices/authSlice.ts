import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '@/services/modules/authApi';
import { storage } from '@/utils/storage';
import { isTokenExpired, getRoleFromToken } from '@/utils/jwt';
import type {
  AuthResponse,
  AuthState,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  User,
} from '@/types';

// Load initial state from localStorage if available and not expired
const rawToken = storage.getToken();
const rawUser = storage.getUser();
const tokenIsExpired = isTokenExpired(rawToken);

if (rawToken && tokenIsExpired) {
  storage.removeToken();
  storage.removeUser();
}

const storedToken = tokenIsExpired ? null : rawToken;
const storedUser = tokenIsExpired ? null : rawUser;

const initialState: AuthState = {
  user: storedUser,
  token: storedToken,
  isAuthenticated: Boolean(storedToken && storedUser),
  isLoading: false,
  error: null,
};

// Async thunk for login
export const loginThunk = createAsyncThunk<AuthResponse, LoginRequest, { rejectValue: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      return response.data;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin!';
      return rejectWithValue(msg);
    }
  }
);

// Async thunk for register
export const registerThunk = createAsyncThunk<AuthResponse, RegisterRequest, { rejectValue: string }>(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authApi.register(data);
      return response.data;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin!';
      return rejectWithValue(msg);
    }
  }
);

// Async thunk for fetching current profile
export const fetchProfileThunk = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getProfile();
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể tải thông tin người dùng';
      return rejectWithValue(msg);
    }
  }
);

// Async thunk for updating current profile
export const updateProfileThunk = createAsyncThunk<User, UpdateProfileRequest, { rejectValue: string }>(
  'auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authApi.updateProfile(data);
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Cập nhật hồ sơ thất bại';
      return rejectWithValue(msg);
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      const { user, token } = action.payload;
      const roleFromJwt = getRoleFromToken(token);
      const enrichedUser = {
        ...user,
        role: (user.role || roleFromJwt) as any,
      };
      state.user = enrichedUser;
      state.token = token;
      state.isAuthenticated = true;
      state.error = null;
      storage.setToken(token);
      storage.setUser(enrichedUser);
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      storage.setUser(action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      storage.removeToken();
      storage.removeUser();
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      const token = action.payload.token;
      const roleFromJwt = getRoleFromToken(token);
      const user = {
        ...action.payload.user,
        role: (action.payload.user?.role || roleFromJwt) as any,
      };

      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = token;
      state.user = user;
      storage.setToken(token);
      storage.setUser(user);
    });
    builder.addCase(loginThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Đăng nhập thất bại';
    });

    // Register
    builder.addCase(registerThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerThunk.fulfilled, (state, action) => {
      const token = action.payload.token;
      const roleFromJwt = getRoleFromToken(token);
      const user = {
        ...action.payload.user,
        role: (action.payload.user?.role || roleFromJwt) as any,
      };

      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = token;
      state.user = user;
      storage.setToken(token);
      storage.setUser(user);
    });
    builder.addCase(registerThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Đăng ký thất bại';
    });

    // Profile
    builder.addCase(fetchProfileThunk.fulfilled, (state, action) => {
      state.user = action.payload;
      storage.setUser(action.payload);
    });

    // Update Profile
    builder.addCase(updateProfileThunk.fulfilled, (state, action) => {
      state.user = action.payload;
      storage.setUser(action.payload);
    });
  },
});

export const { setCredentials, setUser, logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
