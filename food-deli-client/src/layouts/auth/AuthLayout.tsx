import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ThunderboltFilled } from '@ant-design/icons';
import { APP_ROUTES } from '@/constants';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-amber-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to={APP_ROUTES.HOME} className="inline-flex items-center gap-2 group">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
            <ThunderboltFilled className="text-2xl" />
          </div>
          <div className="text-left">
            <span className="font-extrabold text-2xl tracking-tight bg-linear-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent block">
              Thunder Food
            </span>
            <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase block">
              Giao đồ ăn nhanh sấm sét
            </span>
          </div>
        </Link>
      </div>

      {/* Auth Card Outlet */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-orange-500/5 rounded-2xl border border-gray-100 sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
