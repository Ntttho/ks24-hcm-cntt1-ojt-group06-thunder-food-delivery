import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ThunderboltFilled } from '@ant-design/icons';
import { APP_ROUTES } from '@/constants';
import { AuthHeroShowcase } from '@/pages/auth/components';

export const AuthLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isLoginPage = location.pathname === APP_ROUTES.LOGIN;
  const isRegisterPage = location.pathname === APP_ROUTES.REGISTER;

  return (
    <div className="min-h-screen w-full bg-slate-900/5 flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
      {/* Main Glassmorphic Split-Screen Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-slate-300/60 overflow-hidden border border-slate-100 grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Column: Interactive Story & Visual Hero (5 Cols) */}
        <div className="hidden lg:block lg:col-span-5 h-full">
          <AuthHeroShowcase />
        </div>

        {/* Right Column: Dynamic Form Engine (7 Cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative bg-white">
          {/* Top Bar Switcher for Demo / Easy navigation */}
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <Link to={APP_ROUTES.HOME} className="flex items-center gap-2 lg:hidden">
                <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold">
                  <ThunderboltFilled />
                </div>
                <span className="font-extrabold text-slate-900 tracking-tight">THUNDER FOOD</span>
              </Link>

              <div className="ml-auto flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => navigate(APP_ROUTES.LOGIN, { state: location.state })}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    isLoginPage
                      ? 'bg-white text-orange-600 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => navigate(APP_ROUTES.REGISTER, { state: location.state })}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    isRegisterPage
                      ? 'bg-white text-orange-600 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Đăng ký
                </button>
              </div>
            </div>

            {/* Dynamic Routed Page Content */}
            <Outlet />
          </div>

          {/* Footer Support info */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400 flex items-center justify-center gap-4">
            <a href="#help" className="hover:text-slate-600 transition">
              Trung tâm trợ giúp
            </a>
            <span>•</span>
            <a href="#privacy" className="hover:text-slate-600 transition">
              Bảo mật & Quyền riêng tư
            </a>
            <span>•</span>
            <a href="tel:19006868" className="hover:text-slate-600 transition">
              Hotline: 1900 6868
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
