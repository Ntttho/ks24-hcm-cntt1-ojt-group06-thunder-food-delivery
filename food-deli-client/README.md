# Thunder Food Delivery - Client Base Project

Frontend ứng dụng đặt đồ ăn trực tuyến xây dựng với kiến trúc React, TypeScript và các công nghệ hiện đại.

---

## 🛠️ Công nghệ cốt lõi (Tech Stack)

- **Core**: React 19, TypeScript
- **Bundler**: Vite 8+ (Cấu hình chạy tại `http://localhost:3000/`)
- **UI Framework & Styling**:
  - [Ant Design (antd)](https://ant.design/) (ConfigProvider theme tùy biến cho thương hiệu Thunder Food)
  - [Tailwind CSS v4](https://tailwindcss.com/)
  - [@ant-design/icons](https://ant.design/components/icon)
- **State Management**:
  - [Redux Toolkit (@reduxjs/toolkit)](https://redux-toolkit.js.org/)
  - [React-Redux](https://react-redux.js.org/)
- **HTTP Client**:
  - [Axios](https://axios-http.com/) với custom interceptors, tự động gắn JWT Bearer token và xử lý lỗi tập trung
- **Routing**:
  - [React Router DOM v7](https://reactrouter.com/) (`createBrowserRouter`, `MainLayout`, `AuthLayout`, `ProtectedRoute`)

---

## 📁 Cấu trúc thư mục dự án (Folder Structure)

```
food-deli-client/
├── .env                  # Cấu hình biến môi trường (PORT=3000, API_BASE_URL)
├── .env.example          # Mẫu cấu hình môi trường
├── index.html            # File HTML chính (Google Fonts Plus Jakarta Sans)
├── package.json          # Quản lý dependencies & scripts
├── tsconfig.json         # TypeScript configuration
├── tsconfig.app.json     # TypeScript app config & alias @/* -> ./src/*
├── vite.config.ts        # Vite config (port 3000, Tailwind plugin, alias)
└── src/
    ├── assets/           # Icons, hình ảnh tĩnh
    ├── components/       # Các React components dùng chung
    │   └── common/       # LoadingSpinner, ErrorBoundary, PageHeader...
    ├── config/           # Cấu hình hệ thống & Ant Design theme tokens
    │   └── appConfig.ts
    ├── constants/        # Hằng số, API Routes, Storage keys, Roles
    │   └── index.ts
    ├── hooks/            # Custom React Hooks
    │   ├── useAppDispatch.ts
    │   ├── useAppSelector.ts
    │   ├── useAuth.ts
    │   ├── useDebounce.ts
    │   └── index.ts
    ├── layouts/          # Layout bọc các trang
    │   ├── MainLayout.tsx  # Header brand, navbar, giỏ hàng, thông tin user, footer
    │   ├── AuthLayout.tsx  # Layout chuyên dụng cho Login / Register
    │   └── index.ts
    ├── pages/            # Các trang cơ bản (Index, Login, Register)
    │   ├── home/         # HomePage (Index)
    │   ├── auth/         # LoginPage, RegisterPage
    │   ├── not-found/    # NotFoundPage (404)
    │   └── index.ts
    ├── routes/           # Cấu hình React Router & ProtectedRoute
    │   ├── ProtectedRoute.tsx
    │   └── index.tsx
    ├── services/         # Custom API Client & API Modules
    │   ├── api/
    │   │   ├── axiosClient.ts  # Axios instance + JWT Interceptors + Error handlers
    │   │   ├── endpoints.ts    # Danh sách endpoints kết nối Spring Boot Microservices
    │   │   └── index.ts
    │   └── modules/            # authApi, restaurantApi, orderApi...
    ├── store/            # Redux Toolkit Store
    │   ├── slices/
    │   │   ├── authSlice.ts    # Auth state, loginThunk, profileThunk, token persistence
    │   │   ├── uiSlice.ts      # Global loading, theme, sidebar state
    │   │   └── cartSlice.ts    # Giỏ hàng, tính tổng tiền, lưu trữ localStorage
    │   ├── rootReducer.ts
    │   └── index.ts
    ├── types/            # TypeScript interfaces & types (ApiResponse, User, Role...)
    │   ├── api.types.ts
    │   ├── auth.types.ts
    │   └── index.ts
    ├── utils/            # Helper functions (storage, formatters VND, date...)
    │   ├── storage.ts
    │   ├── formatters.ts
    │   └── index.ts
    ├── App.tsx           # ConfigProvider, Redux Provider, RouterProvider
    └── main.tsx          # Điểm khởi chạy ứng dụng
```

---

## 🚀 Hướng dẫn khởi chạy

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Khởi chạy môi trường phát triển (Dev Server)
```bash
npm run dev
```
Ứng dụng sẽ tự động chạy tại: **`http://localhost:3000/`**

### 3. Build mã nguồn Production
```bash
npm run build
```
Build hoàn tất tại thư mục `dist/`.
