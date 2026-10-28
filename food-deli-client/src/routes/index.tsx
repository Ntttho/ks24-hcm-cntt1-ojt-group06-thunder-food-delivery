import { createBrowserRouter } from 'react-router-dom';
import { MainLayout, AuthLayout } from '@/layouts';
import {
  HomePage,
  LoginPage,
  RegisterPage,
  NotFoundPage,
  CartPage,
  CheckoutPage,
} from '@/pages';
import { APP_ROUTES } from '@/constants';

export const router = createBrowserRouter([
  // Main Layout: Index Route
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
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
