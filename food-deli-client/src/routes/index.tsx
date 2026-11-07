import { createBrowserRouter } from 'react-router-dom';
import { MainLayout, AuthLayout, MerchantLayout, UserLayout } from '@/layouts';
import {
  HomePage,
  LoginPage,
  RegisterPage,
  AddressManagementPage,
  ProfilePage,
  NotFoundPage,
  CartPage,
  CheckoutPage,
  StoreDetailPage,
  StoreReviewPage,
  MerchantDashboardPage,
  MerchantMenuPage,
  MerchantCategoryPage,
  MerchantToppingPage,
  MerchantVoucherPage,
  OrdersPage,
  OrderDetailPage,
  AdminUserPage,
} from '@/pages';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { APP_ROUTES } from '@/constants';

export const router = createBrowserRouter([
  // Main Layout
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'restaurants',
        element: <HomePage />,
      },
      {
        path: 'restaurants/:id',
        element: <StoreDetailPage />,
      },
      {
        path: 'restaurants/:id/reviews',
        element: <StoreReviewPage />,
      },
      {
        path: 'users',
        element: <AdminUserPage />,
      },
      {
        path: 'admin/users',
        element: <AdminUserPage />,
      },
      // User Account Management Layout (Profile, Orders, Addresses)
      {
        element: (
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: 'profile',
            element: <ProfilePage />,
          },
          {
            path: 'profile/addresses',
            element: <AddressManagementPage />,
          },
          {
            path: 'addresses',
            element: <AddressManagementPage />,
          },
          {
            path: 'orders',
            element: <OrdersPage />,
          },
          {
            path: 'orders/:id',
            element: <OrderDetailPage />,
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  // Dedicated Cart Screen
  {
    path: APP_ROUTES.CART,
    element: <CartPage />,
  },
  // Dedicated Checkout Screen (Protected: user must be authenticated)
  {
    path: APP_ROUTES.CHECKOUT,
    element: (
      <ProtectedRoute>
        <CheckoutPage />
      </ProtectedRoute>
    ),
  },
  // Auth Layout: Strictly 1 Login & 1 Register page
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
    ],
  },
  // Merchant Layout: Merchant Dashboard, Menu & Toppings Management (Chặt chẽ: Chỉ MERCHANT và ADMIN mới được phép truy cập)
  {
    path: '/merchant',
    element: (
      <ProtectedRoute allowedRoles={['ROLE_MERCHANT', 'ROLE_ADMIN']}>
        <MerchantLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute allowedRoles={['ROLE_MERCHANT', 'ROLE_ADMIN']}>
            <MerchantDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'menu',
        element: (
          <ProtectedRoute allowedRoles={['ROLE_MERCHANT', 'ROLE_ADMIN']}>
            <MerchantMenuPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'categories',
        element: (
          <ProtectedRoute allowedRoles={['ROLE_MERCHANT', 'ROLE_ADMIN']}>
            <MerchantCategoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'toppings',
        element: (
          <ProtectedRoute allowedRoles={['ROLE_MERCHANT', 'ROLE_ADMIN']}>
            <MerchantToppingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'vouchers',
        element: (
          <ProtectedRoute allowedRoles={['ROLE_MERCHANT', 'ROLE_ADMIN']}>
            <MerchantVoucherPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;
