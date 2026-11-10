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
  RestaurantDetailPage,
  RestaurantReviewPage,
  MerchantDashboardPage,
  MerchantMenuPage,
  MerchantCategoryPage,
  MerchantToppingPage,
  MerchantVoucherPage,
  MerchantReviewPage,
  OrdersPage,
  OrderDetailPage,
  AdminUserPage,
  AdminRestaurantReviewsPage,
  AdminDriverReviewsPage,
} from '@/pages';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { APP_ROUTES, ROLES } from '@/constants';

export const router = createBrowserRouter([
  // Main Layout
  {
    path: APP_ROUTES.HOME,
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: APP_ROUTES.RESTAURANTS,
        element: <HomePage />,
      },
      {
        path: APP_ROUTES.RESTAURANT_DETAIL,
        element: <RestaurantDetailPage />,
      },
      {
        path: APP_ROUTES.RESTAURANT_REVIEWS,
        element: <RestaurantReviewPage />,
      },
      {
        path: APP_ROUTES.USERS,
        element: <AdminUserPage />,
      },
      {
        path: APP_ROUTES.ADMIN_USERS,
        element: <AdminUserPage />,
      },
      {
        path: APP_ROUTES.ADMIN_RESTAURANT_REVIEWS,
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminRestaurantReviewsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: APP_ROUTES.ADMIN_DRIVER_REVIEWS,
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminDriverReviewsPage />
          </ProtectedRoute>
        ),
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
            path: APP_ROUTES.PROFILE,
            element: <ProfilePage />,
          },
          {
            path: APP_ROUTES.ADDRESSES,
            element: <AddressManagementPage />,
          },
          {
            path: APP_ROUTES.ADDRESS_MANAGEMENT,
            element: <AddressManagementPage />,
          },
          {
            path: APP_ROUTES.ORDERS,
            element: <OrdersPage />,
          },
          {
            path: APP_ROUTES.ORDER_DETAIL,
            element: <OrderDetailPage />,
          },
        ],
      },
      {
        path: APP_ROUTES.NOT_FOUND,
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
    path: APP_ROUTES.HOME,
    element: <AuthLayout />,
    children: [
      {
        path: APP_ROUTES.LOGIN,
        element: <LoginPage />,
      },
      {
        path: APP_ROUTES.REGISTER,
        element: <RegisterPage />,
      },
    ],
  },
  // Merchant Layout: Merchant Dashboard, Menu & Toppings Management (Chặt chẽ: Chỉ MERCHANT và ADMIN mới được phép truy cập)
  {
    path: APP_ROUTES.MERCHANT_DASHBOARD,
    element: (
      <ProtectedRoute allowedRoles={['ROLE_MERCHANT']}>
        <MerchantLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute allowedRoles={['ROLE_MERCHANT']}>
            <MerchantDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: APP_ROUTES.MERCHANT_MENU,
        element: (
          <ProtectedRoute allowedRoles={['ROLE_MERCHANT']}>
            <MerchantMenuPage />
          </ProtectedRoute>
        ),
      },
      {
        path: APP_ROUTES.MERCHANT_CATEGORIES,
        element: (
          <ProtectedRoute allowedRoles={['ROLE_MERCHANT']}>
            <MerchantCategoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: APP_ROUTES.MERCHANT_TOPPINGS,
        element: (
          <ProtectedRoute allowedRoles={['ROLE_MERCHANT']}>
            <MerchantToppingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: APP_ROUTES.MERCHANT_VOUCHERS,
        element: (
          <ProtectedRoute allowedRoles={['ROLE_MERCHANT']}>
            <MerchantVoucherPage />
          </ProtectedRoute>
        ),
      },
      {
        path: APP_ROUTES.MERCHANT_REVIEWS,
        element: (
          <ProtectedRoute allowedRoles={['ROLE_MERCHANT']}>
            <MerchantReviewPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;
