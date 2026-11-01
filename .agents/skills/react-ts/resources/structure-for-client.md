---
name: structure-of-client
description: Senior Frontend React/TypeScript Architect & Client Engineering Guide. Defines the standardized modular client structure for Food Thunder Deli (Vite + React 19 + TypeScript + Tailwind CSS), replacing React Context with Zustand Stores (stores/) for high-performance global state management.
---

# ROLE & MISSION
You are a **Senior Frontend React & TypeScript Architect**. Your mission is to provide clean, modular, scalable, and production-ready frontend architecture for the **Food Thunder Deli** client web application (`grapfood/shoopeFood-clone-main/client/fe-flash-food/src/`).

This skill establishes the standardized architecture, conventions, directory layout, and best practices. **Crucially: All global state management uses centralized Zustand Stores (`stores/`) instead of React Context (`context/`)** to prevent unnecessary component re-renders, eliminate Provider hell, and enable granular selector subscriptions.

---

## 🛠️ CORE TECH STACK
- **Core Library:** React 19 (Functional Components, Hooks)
- **Language:** TypeScript 5.x (Strict Typing, Interface Contracts matching Backend DTOs)
- **Build Tool:** Vite 6.x
- **State Management:** **Zustand** (Store Pattern with `persist` middleware) — *Thay thế hoàn toàn React Context*
- **Styling:** Tailwind CSS 4.x, `clsx`, `tailwind-merge`
- **Routing:** React Router DOM v7 (Data Router / Protected Routes / RBAC)
- **HTTP Client:** Axios (Centralized Interceptors, JWT Token Injection, Refresh logic)
- **Realtime:** Socket.IO / STOMP WebSocket (Order Tracking, Live Chat, Push Notifications)
- **Form & Validation:** React Hook Form + Zod
- **Icons & Animation:** Lucide React, Framer Motion
- **Maps:** Leaflet & React-Leaflet (Shipper Tracking & Geolocation)
- **Notifications:** Sonner (Toast system)

---

## 📁 STANDARDIZED CLIENT DIRECTORY STRUCTURE (`src/`)

```
src/
├── assets/                  # Static assets (images, logos, svg icons, fonts)
│   ├── images/              # Banners, default avatars, placeholders
│   └── icons/               # Custom SVGs
│
├── components/              # Shared & Reusable UI Components
│   ├── Button/              # Primary, secondary, outline, ghost buttons
│   ├── Input/               # Text input, number input, search bar
│   ├── Modal/               # Reusable dialogs, confirmation modals
│   ├── Card/                # FoodCard, RestaurantCard, VoucherCard
│   ├── Loading/             # Skeleton loaders, Spinner, PageLoading
│   ├── Cart/                # MiniCart drawer, CartItem, QuantitySelector
│   ├── Chat/                # Floating chat widget, MessageList, ChatBubble
│   ├── Review/              # StarRating, ReviewItem, ReviewModal
│   ├── AiAssistant/         # Floating AI Chatbot assistant widget
│   └── FlashSale/           # Countdown timer, Discount badges
│
├── constants/               # Global constants & application configuration
│   ├── apiEndpoints.ts      # Gateway API path constants (/api/v1/...)
│   ├── routes.ts            # Route path constants (e.g., ROUTES.HOME, ROUTES.CHECKOUT)
│   ├── roles.ts             # Roles: ANONYMOUS, CUSTOMER, MERCHANT, DRIVER, ADMIN
│   └── storageKeys.ts       # LocalStorage/SessionStorage key names
│
├── stores/                  # ⭐ ZUSTAND STORES (Thay thế hoàn toàn context/)
│   ├── useAuthStore.ts      # Authentication, user profile, JWT token, active role
│   ├── useCartStore.ts      # Shopping cart (single-restaurant lock, items, toppings)
│   ├── useRestaurantStore.ts# Selected shop, active restaurant for merchant portal
│   ├── useThemeStore.ts     # Dark/Light mode theme state
│   ├── useChatStore.ts      # Active chat thread, unread badge, realtime messages
│   ├── useDriverStore.ts    # Driver online/offline status, current coordinates
│   └── index.ts             # Barrel export of all stores
│
├── features/                # Domain-Driven Feature Modules
│   ├── auth/                # Login, Register, Forgot Password, Profile
│   │   ├── components/      # LoginForm, RegisterForm, OTPInput
│   │   ├── hooks/           # useAuthMutation, useProfile
│   │   └── pages/           # LoginPage, RegisterPage, ProfilePage
│   ├── restaurant/          # Merchant & Restaurant Management
│   │   ├── components/      # MenuList, FoodItemEditor, ToppingGroupModal
│   │   ├── hooks/           # useRestaurantDetail, useMenuQuery
│   │   └── pages/           # RestaurantDetailPage, MerchantDashboardPage
│   ├── order/               # Cart, Checkout, Order Tracking
│   │   ├── components/      # OrderTimeline, TrackingMap, OrderSummary
│   │   ├── hooks/           # useCheckout, useOrderTracking
│   │   └── pages/           # CheckoutPage, OrderHistoryPage, TrackingPage
│   ├── driver/              # Shipper Web Hub & Virtual Delivery
│   │   ├── components/      # OrderFeedCard, VirtualStepNavigator, IncomeChart
│   │   ├── hooks/           # useDriverFeed, useVirtualDelivery
│   │   └── pages/           # DriverHubPage, DeliveryWorkflowPage
│   └── admin/               # System Admin Portal
│       ├── components/      # UserTable, RestaurantApprovalTable, StatCard
│       ├── hooks/           # useAdminUsers, useAdminApprovals
│       └── pages/           # AdminDashboardPage, UserManagementPage
│
├── hooks/                   # Generic Custom React Hooks
│   ├── useDebounce.ts       # Debounce input for search queries
│   ├── useGeolocation.ts    # Browser Geolocation coordinates hook
│   ├── useMediaQuery.ts     # Responsive breakpoint detector (Mobile/Desktop)
│   └── useClickOutside.ts   # Detect click outside dropdown/modal
│
├── layouts/                 # Application Layout Wrappers
│   ├── MainLayout.tsx       # Public header, navigation, footer, cart drawer
│   ├── AuthLayout.tsx       # Centered layout for Login/Register pages
│   ├── MerchantLayout.tsx   # Sidebar & header for Shop Management Portal
│   ├── DriverLayout.tsx     # Mobile-optimized bottom-nav for Shipper
│   └── AdminLayout.tsx      # Sidebar & topbar for System Administration
│
├── routes/                  # Navigation & Routing Setup
│   ├── AppRoutes.tsx        # React Router tree configuration
│   ├── ProtectedRoute.tsx   # Guard checking isAuthenticated & role permissions
│   ├── PublicRoute.tsx      # Redirect authenticated users away from /login
│   └── index.ts             # Route exports
│
├── services/                # API Client & Backend Communication Layer
│   ├── apiClient.ts         # Axios instance with Base URL, Bearer Interceptor
│   └── api/                 # Endpoint-specific service modules
│       ├── auth.ts          # /api/v1/auth/*
│       ├── address.ts       # /api/v1/addresses/*
│       ├── restaurants.ts   # /api/v1/restaurants/*
│       ├── foods.ts         # /api/v1/foods/*
│       ├── categories.ts    # /api/v1/categories/*
│       ├── toppings.ts      # /api/v1/toppings/*
│       ├── order.ts         # /api/v1/orders/*
│       ├── driver.ts        # /api/v1/drivers/*
│       ├── review.ts        # /api/v1/reviews/*
│       ├── voucher.ts       # /api/v1/vouchers/*
│       ├── chat.ts          # /api/v1/chat/* & WebSocket
│       └── index.ts         # Barrel export of all API modules
│
├── styles/                  # Global CSS & Tailwind Configurations
│   └── index.css            # Tailwind directives, animations, font definitions
│
├── types/                   # Centralized TypeScript Contracts (DTOs)
│   ├── api.ts               # ApiResponse<T>, PaginatedResponse<T>
│   ├── auth.ts              # User, Role, LoginRequest, RegisterRequest
│   ├── restaurant.ts        # Restaurant, Category, Food, Topping
│   ├── order.ts             # Order, OrderItem, OrderStatus, Tracking
│   ├── driver.ts            # DriverProfile, DriverMetrics, DriverLocation
│   └── review.ts            # Review, RatingSummary
│
└── utils/                   # Helper & Utility Functions
    ├── formatters.ts        # formatVND(100000) -> "100.000 ₫", formatDate()
    ├── calculateDistance.ts # Haversine formula calculation for distance
    └── storage.ts           # Safe localStorage wrapper
```

---

## ⚡ TẠI SAO SỬ DỤNG `stores/` THAY VÌ `context/`?

1. **Hiệu năng vượt trội (Zero Unnecessary Re-renders):**  
   React Context buộc toàn bộ component con bên trong Provider re-render bất cứ khi nào một giá trị trong context thay đổi. Zustand Store hỗ trợ **Atomic Selectors**: component chỉ re-render khi trường dữ liệu mà nó đăng ký thực sự thay đổi.
   ```tsx
   // ✅ Component chỉ re-render khi số lượng items thay đổi
   const cartItemCount = useCartStore((state) => state.items.length);
   ```
2. **Không còn "Provider Hell":**  
   Không cần lồng 10 lớp `<AuthProvider><CartProvider><RestaurantProvider>...` vào `main.tsx` hay `App.tsx`.
3. **Truy cập State ngoài React Component:**  
   Zustand cho phép đọc và gọi action của Store ngay trong Axios Interceptor hoặc file utility thông thường mà không cần Hook:
   ```ts
   // Trong apiClient.ts
   const token = useAuthStore.getState().token;
   ```
4. **Tích hợp sẵn Middleware Persist:**  
   Tự động lưu state (như Token, Giỏ hàng) vào `localStorage` an toàn và khôi phục khi reload trang.

---

## 📐 THIẾT KẾ ZUSTAND STORE MẪU (CODE EXAMPLES)

### 1. `stores/useAuthStore.ts`
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthUserDto } from '../types/auth';

interface AuthState {
  token: string | null;
  user: AuthUserDto | null;
  currentRole: string;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (token: string, user: AuthUserDto) => void;
  updateUser: (user: Partial<AuthUserDto>) => void;
  setActiveRole: (role: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      currentRole: 'ANONYMOUS',
      isAuthenticated: false,

      setAuth: (token, user) => set({
        token,
        user,
        currentRole: user.role || user.roles?.[0] || 'CUSTOMER',
        isAuthenticated: true,
      }),

      updateUser: (updatedFields) => set((state) => ({
        user: state.user ? { ...state.user, ...updatedFields } : null,
      })),

      setActiveRole: (role) => set({ currentRole: role }),

      logout: () => {
        set({
          token: null,
          user: null,
          currentRole: 'ANONYMOUS',
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'food-thunder-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

---

### 2. `stores/useCartStore.ts` (Khóa 1 quán ăn duy nhất)
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartTopping {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItem {
  id: string; // unique item uuid (foodId + topping hash)
  foodId: number;
  foodName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  toppings: CartTopping[];
}

interface CartState {
  restaurantId: number | null;
  restaurantName: string | null;
  items: CartItem[];

  // Actions
  addItem: (restaurantId: number, restaurantName: string, item: Omit<CartItem, 'id'>) => boolean;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: null,
      items: [],

      addItem: (restaurantId, restaurantName, item) => {
        const state = get();
        // Kiểm tra ràng buộc 1 quán duy nhất
        if (state.restaurantId && state.restaurantId !== restaurantId) {
          return false; // Báo hiệu xung đột quán ăn để UI hiện Modal xác nhận đổi quán
        }

        const itemId = `${item.foodId}-${item.toppings.map(t => `${t.id}x${t.quantity}`).sort().join('_')}`;
        const existingIndex = state.items.findIndex(i => i.id === itemId);

        if (existingIndex > -1) {
          const updatedItems = [...state.items];
          updatedItems[existingIndex].quantity += item.quantity;
          set({ items: updatedItems });
        } else {
          set({
            restaurantId,
            restaurantName,
            items: [...state.items, { ...item, id: itemId }],
          });
        }
        return true;
      },

      removeItem: (itemId) => {
        const remaining = get().items.filter(i => i.id !== itemId);
        set({
          items: remaining,
          restaurantId: remaining.length === 0 ? null : get().restaurantId,
          restaurantName: remaining.length === 0 ? null : get().restaurantName,
        });
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set({
          items: get().items.map(i => i.id === itemId ? { ...i, quantity } : i),
        });
      },

      clearCart: () => set({ restaurantId: null, restaurantName: null, items: [] }),

      getTotalAmount: () => {
        return get().items.reduce((total, item) => {
          const toppingTotal = item.toppings.reduce((sum, t) => sum + t.price * t.quantity, 0);
          return total + (item.price + toppingTotal) * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'food-thunder-cart',
    }
  )
);
```

---

## 🌐 TỔ CHỨC TẦNG DỊCH VỤ API (`services/`)

### 1. `services/apiClient.ts`
```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Tự động đính kèm Bearer JWT từ Zustand Store
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Bắt lỗi 401 Unauthorized và tự động đăng xuất
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
```

### 2. `services/api/address.ts`
```typescript
import { apiClient } from '../apiClient';
import { ApiResponse } from '../../types/api';

export interface UserAddress {
  id: number;
  userId: number;
  address: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  label?: string;
}

export interface CreateAddressPayload {
  address: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  label?: string;
}

export const addressApi = {
  getMine: async (): Promise<UserAddress[]> => {
    const res = await apiClient.get<ApiResponse<UserAddress[]>>('/addresses/mine');
    return res.data.data;
  },

  createMine: async (payload: CreateAddressPayload): Promise<UserAddress> => {
    const res = await apiClient.post<ApiResponse<UserAddress>>('/addresses/mine', payload);
    return res.data.data;
  },

  updateMine: async (id: number, payload: CreateAddressPayload): Promise<UserAddress> => {
    const res = await apiClient.put<ApiResponse<UserAddress>>(`/addresses/mine/${id}`, payload);
    return res.data.data;
  },

  deleteMine: async (id: number): Promise<void> => {
    await apiClient.delete(`/addresses/mine/${id}`);
  },

  suggest: async (query: string) => {
    const res = await apiClient.get<ApiResponse<any[]>>('/addresses/suggest', {
      params: { query },
    });
    return res.data.data;
  },
};
```

---

## 🛡️ PHÂN QUYỀN VÀ BẢO VỆ ROUTE (`routes/ProtectedRoute.tsx`)

```tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const location = useLocation();
  const { isAuthenticated, currentRole } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
```

---

## 📋 QUY TRÌNH CHUYỂN ĐỔI (MIGRATION CHECKLIST TỪ `context/` SANG `stores/`)

Khi tái cấu trúc từ code cũ sang cấu trúc chuẩn mới:
1. **Xóa/Thay thế thư mục `src/context/`:**
   - `AuthContext.ts` / `AuthProvider.tsx` $\rightarrow$ Chuyển thành `src/stores/useAuthStore.ts`
   - `CartContext.ts` / `CartProvider.tsx` $\rightarrow$ Chuyển thành `src/stores/useCartStore.ts`
   - `RestaurantContext.ts` $\rightarrow$ Chuyển thành `src/stores/useRestaurantStore.ts`
   - `ThemeContext.ts` $\rightarrow$ Chuyển thành `src/stores/useThemeStore.ts`
2. **Cập nhật `App.tsx` & `main.tsx`:**  
   Gỡ bỏ toàn bộ các Provider bao bọc bên ngoài (`<AuthProvider>`, `<CartProvider>`).
3. **Cập nhật các Components/Pages tiêu thụ:**  
   Thay đổi `const { user } = useContext(AuthContext)` thành `const user = useAuthStore(state => state.user)`.
