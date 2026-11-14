import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';
import { getRoleDefaultPath } from '@/utils/navigation';
import { AdminNavbar } from './components/AdminNavbar';

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Spin size="large" />
      </div>
    );
  }

  // Not logged in -> Redirect to dedicated Admin Login page
  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.ADMIN_LOGIN} replace />;
  }

  // Logged in but not an Admin -> Redirect them to their own role's main page!
  if (!isAdmin) {
    return <Navigate to={getRoleDefaultPath(user?.role)} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900">
      {/* Dedicated Admin Portal Navigation Bar */}
      <AdminNavbar />

      {/* Main Admin Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Sleek Admin Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span>⚡ Thunder Food Delivery</span>
            <span className="text-slate-300">•</span>
            <span className="text-red-600 font-semibold">Cổng Quản Trị Hệ Thống (Admin Portal)</span>
          </div>
          <div>Phiên bản 1.0.0 • Hoạt động ổn định trên toàn quốc</div>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;

