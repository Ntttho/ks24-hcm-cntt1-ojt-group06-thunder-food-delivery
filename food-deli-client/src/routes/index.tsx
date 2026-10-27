import { createBrowserRouter } from 'react-router-dom';
import { MainLayout, AuthLayout } from '@/layouts';
import {
  HomePage,
  LoginPage,
  RegisterPage,
  AddressManagementPage,
  ProfilePage,
  NotFoundPage,
} from '@/pages';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

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
