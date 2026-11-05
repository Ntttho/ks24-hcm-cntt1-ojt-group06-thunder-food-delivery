import { createBrowserRouter } from 'react-router-dom';
import { MainLayout, AuthLayout, MerchantLayout } from '@/layouts';
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
  MerchantToppingPage,
  OrdersPage,
  OrderDetailPage,
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
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile/addresses',
        element: (
          <ProtectedRoute>
            <AddressManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'addresses',
        element: (
          <ProtectedRoute>
            <AddressManagementPage />
          </ProtectedRoute>
        ),
      },
      // Customer Orders Route: Protected
      {
        path: 'orders',
        element: (
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        ),
      },
      // Customer Order Detail & Live Tracking Route: Protected
      {
        path: 'orders/:id',
        element: (
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        ),
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
        path: 'toppings',
        element: (
          <ProtectedRoute allowedRoles={['ROLE_MERCHANT', 'ROLE_ADMIN']}>
            <MerchantToppingPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;
