import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '@/services/modules/authApi';
import { storage } from '@/utils/storage';
import type { AuthResponse, AuthState, LoginRequest, User } from '@/types';

// Load initial state from localStorage if available
const storedToken = storage.getToken();
const storedUser = storage.getUser();

const initialState: AuthState = {
  user: storedUser,
  token: storedToken,
  isAuthenticated: Boolean(storedToken),
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
      const msg = err.response?.data?.message || 'Đăng nhập không thành công';
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

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.error = null;
      storage.setToken(token);
      storage.setUser(user);
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
      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      storage.setToken(action.payload.token);
      storage.setUser(action.payload.user);
    });
    builder.addCase(loginThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Đăng nhập thất bại';
    });

    // Profile
    builder.addCase(fetchProfileThunk.fulfilled, (state, action) => {
      state.user = action.payload;
      storage.setUser(action.payload);
    });
  },
});

export const { setCredentials, logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
