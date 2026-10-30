import { createBrowserRouter } from 'react-router-dom';
import { MainLayout, AuthLayout } from '@/layouts';
import {
  HomePage,
  ExplorePage,
  LoginPage,
  RegisterPage,
  AddressManagementPage,
  ProfilePage,
  NotFoundPage,
  CartPage,
  CheckoutPage,
  RestaurantDetailPage,
} from '@/pages';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { APP_ROUTES } from '@/constants';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  // Main Layout
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: 'explore',
        element: <ExplorePage />,
      },
      {
        path: APP_ROUTES.RESTAURANT_DETAIL.slice(1),
        element: <RestaurantDetailPage />,
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
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  // Dedicated Cart & Checkout Screens (with full mobile-first sticky bars)
  {
    path: APP_ROUTES.CART,
    element: <CartPage />,
  },
  {
    path: APP_ROUTES.CHECKOUT,
    element: <CheckoutPage />,
  },
  // Auth Layout: Login & Register
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
]);
