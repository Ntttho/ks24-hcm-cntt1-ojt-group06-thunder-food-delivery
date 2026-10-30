import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  LogOut,
  Search,
  MapPin,
  ChevronDown,
  Menu,
  X,
  Tag,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';
import { HeaderCartPanel } from '@/components/common';
import { toast } from 'sonner';

const AUTH_ROLES = [
  { role: 'CUSTOMER', label: 'Khách hàng', emoji: '👤' },
  { role: 'MERCHANT', label: 'Chủ quán', emoji: '🏪' },
  { role: 'DRIVER', label: 'Đối tác tài xế', emoji: '🛵' },
] as const;

export const MainLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isRegisterMenuOpen, setIsRegisterMenuOpen] = useState(false);
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất tài khoản an toàn!');
    navigate(APP_ROUTES.LOGIN);
    setIsUserMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-slate-100 transition-all">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex h-16 md:h-20 items-center justify-between gap-4">
            {/* Logo & Location (Left) */}
            <div className="flex items-center gap-6">
              <Link to={APP_ROUTES.EXPLORE} className="flex items-center gap-2 group">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-6 w-6 text-primary" />
                  <span className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 group-hover:opacity-90 transition-opacity">
                    Thunder<span className="text-primary">Food</span>
                  </span>
                </div>
              </Link>

              {/* Location Picker */}
              <div className="hidden md:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 transition-colors px-3 py-1.5 rounded-full cursor-pointer border border-slate-200">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-slate-700 max-w-[150px] truncate">
                  TP. Hồ Chí Minh
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Global Search Bar (Middle) - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-auto">
              <div className="relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  className="w-full bg-slate-100 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-full py-2.5 pl-11 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all outline-none"
                  placeholder="Tìm món ăn, quán ăn, trà sữa..."
                />
              </div>
            </div>

            {/* Actions (Right) */}
            <div className="flex items-center gap-3 md:gap-4">
              {/* Voucher Wallet Button */}
              <button
                className="relative flex items-center gap-1.5 px-3.5 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors font-bold text-sm cursor-pointer border border-rose-100 shadow-xs"
                title="Ưu đãi & Mã giảm giá"
              >
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Ưu đãi</span>
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              </button>

              <HeaderCartPanel />

              {/* User Nav Control */}
              <div className="hidden md:flex items-center">
                {isAuthenticated && user ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 rounded-full bg-white px-4 py-2 border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-sm font-bold text-slate-700">
                        {user?.fullName || user?.phone || 'Tài khoản'}
                      </span>
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                        <UserIcon className="h-4 w-4" />
                      </div>
                    </button>
                    {isUserMenuOpen && (
                      <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-sm font-bold text-slate-800 truncate">{user?.fullName || 'Người dùng'}</p>
                          <p className="text-xs text-slate-500 truncate">{user?.phone || user?.email}</p>
                        </div>
                        <Link
                          to={APP_ROUTES.PROFILE}
                          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <UserIcon className="h-4 w-4" />
                          Thông tin cá nhân
                        </Link>
                        <Link
                          to={APP_ROUTES.ADDRESSES}
                          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <MapPin className="h-4 w-4" />
                          Sổ địa chỉ
                        </Link>
                        <div className="border-t border-slate-100">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    {/* Đăng ký dropdown */}
                    <div
                      className="relative"
                      onMouseEnter={() => setIsRegisterMenuOpen(true)}
                      onMouseLeave={() => setIsRegisterMenuOpen(false)}
                    >
                      <button className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-primary transition-colors">
                        Đăng ký
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </button>
                      {isRegisterMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                          {AUTH_ROLES.map((item) => (
                            <Link
                              key={item.role}
                              to={`${APP_ROUTES.REGISTER}?role=${item.role}`}
                              className="px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors flex items-center gap-2"
                            >
                              <span>{item.emoji}</span>
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Đăng nhập dropdown */}
                    <div
                      className="relative"
                      onMouseEnter={() => setIsLoginMenuOpen(true)}
                      onMouseLeave={() => setIsLoginMenuOpen(false)}
                    >
                      <button className="flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary-hover hover:shadow-lg transition-all">
                        Đăng nhập
                        <ChevronDown className="h-4 w-4 text-white/70" />
                      </button>
                      {isLoginMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                          {AUTH_ROLES.map((item) => (
                            <Link
                              key={item.role}
                              to={`${APP_ROUTES.LOGIN}?role=${item.role}`}
                              className="px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors flex items-center gap-2"
                            >
                              <span>{item.emoji}</span>
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="lg:hidden pb-4 pt-2">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="w-full bg-slate-100 border-none focus:ring-2 focus:ring-primary rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder-slate-500 outline-none"
                placeholder="Tìm món ăn..."
              />
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-2">
            {isAuthenticated && user ? (
              <>
                <div className="px-3 py-2 bg-slate-50 rounded-xl">
                  <p className="text-sm font-bold text-slate-800">{user?.fullName}</p>
                  <p className="text-xs text-slate-500">{user?.phone || user?.email}</p>
                </div>
                <Link to={APP_ROUTES.PROFILE} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-primary rounded-lg hover:bg-slate-50" onClick={() => setIsMobileMenuOpen(false)}>
                  <UserIcon className="h-4 w-4" /> Thông tin cá nhân
                </Link>
                <Link to={APP_ROUTES.ADDRESSES} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-primary rounded-lg hover:bg-slate-50" onClick={() => setIsMobileMenuOpen(false)}>
                  <MapPin className="h-4 w-4" /> Sổ địa chỉ
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-lg">
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </button>
              </>
            ) : (
              <>
                <p className="px-3 pt-1 text-xs font-bold uppercase tracking-wider text-slate-400">Đăng nhập</p>
                {AUTH_ROLES.map((item) => (
                  <Link
                    key={`login-${item.role}`}
                    to={`${APP_ROUTES.LOGIN}?role=${item.role}`}
                    className="block px-3 py-2.5 text-sm font-semibold text-slate-700 hover:text-primary rounded-lg hover:bg-slate-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.emoji} {item.label}
                  </Link>
                ))}
                <p className="px-3 pt-2 text-xs font-bold uppercase tracking-wider text-slate-400">Đăng ký</p>
                {AUTH_ROLES.map((item) => (
                  <Link
                    key={`register-${item.role}`}
                    to={`${APP_ROUTES.REGISTER}?role=${item.role}`}
                    className="block px-3 py-2.5 text-sm font-semibold text-slate-700 hover:text-primary rounded-lg hover:bg-slate-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.emoji} {item.label}
                  </Link>
                ))}
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-50/50">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-12 pb-8">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-1">
              <Link to="/" className="inline-block mb-4">
                <span className="text-2xl font-black tracking-tighter text-slate-900">
                  Thunder<span className="text-primary">Food</span>
                </span>
              </Link>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
                Đặt món trực tuyến giao hàng siêu tốc. Thưởng thức hàng ngàn món ngon từ các nhà
                hàng yêu thích của bạn.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-sm">
                Về ThunderFood
              </h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-500 hover:text-primary text-sm font-medium transition-colors">Giới thiệu</a></li>
                <li><a href="#" className="text-slate-500 hover:text-primary text-sm font-medium transition-colors">Tuyển dụng</a></li>
                <li><a href="#" className="text-slate-500 hover:text-primary text-sm font-medium transition-colors">Tin tức & Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-sm">
                Dịch vụ
              </h4>
              <ul className="space-y-3">
                <li><Link to={APP_ROUTES.EXPLORE} className="text-slate-500 hover:text-primary text-sm font-medium transition-colors">Đặt món trực tuyến</Link></li>
                <li><a href="#" className="text-slate-500 hover:text-primary text-sm font-medium transition-colors">Dành cho Nhà hàng</a></li>
                <li><a href="#" className="text-slate-500 hover:text-primary text-sm font-medium transition-colors">Dành cho Tài xế</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-sm">
                Liên hệ
              </h4>
              <ul className="space-y-3">
                <li><a href="mailto:support@thunderfood.vn" className="text-slate-500 hover:text-primary text-sm font-medium transition-colors">support@thunderfood.vn</a></li>
                <li><a href="tel:19001234" className="text-slate-500 hover:text-primary text-sm font-medium transition-colors">Hotline: 1900 1234</a></li>
                <li><span className="text-slate-500 text-sm font-medium block">TP. Hồ Chí Minh, Việt Nam</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs font-semibold text-slate-400">
              © {new Date().getFullYear()} ThunderFood — Nhóm 06 CNTT1 OJT 2026. Đã đăng ký bản quyền.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">Chính sách bảo mật</a>
              <a href="#" className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">Điều khoản sử dụng</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
