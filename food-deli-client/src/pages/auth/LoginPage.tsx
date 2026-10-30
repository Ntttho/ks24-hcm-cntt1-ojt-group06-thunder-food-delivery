import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { LogIn, Eye, EyeOff, User, Lock, Store, Car, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';
import { toast } from 'sonner';

type RoleType = 'CUSTOMER' | 'MERCHANT' | 'DRIVER';

const ROLE_TABS: { value: RoleType; label: string; emoji: string; icon: React.ElementType }[] = [
  { value: 'CUSTOMER', label: 'Khách hàng', emoji: '👤', icon: User },
  { value: 'MERCHANT', label: 'Chủ quán', emoji: '🏪', icon: Store },
  { value: 'DRIVER', label: 'Đối tác tài xế', emoji: '🛵', icon: Car },
];

const DEMO_ACCOUNTS = [
  { label: '👤 Khách hàng', phone: '0987654321', pass: 'Password@123', role: 'CUSTOMER' as RoleType },
  { label: '🏪 Chủ quán', phone: '0901234567', pass: 'Password@123', role: 'MERCHANT' as RoleType },
  { label: '🛵 Đối tác tài xế', phone: '0912345678', pass: 'Password@123', role: 'DRIVER' as RoleType },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, isLoading, error, clearError } = useAuth();
  const roleFromQuery = searchParams.get('role')?.toUpperCase();
  const initialRole: RoleType =
    roleFromQuery === 'MERCHANT' || roleFromQuery === 'DRIVER' || roleFromQuery === 'CUSTOMER'
      ? roleFromQuery
      : 'CUSTOMER';
  const [selectedRole, setSelectedRole] = useState<RoleType>(initialRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (roleFromQuery === 'MERCHANT' || roleFromQuery === 'DRIVER' || roleFromQuery === 'CUSTOMER') {
      setSelectedRole(roleFromQuery);
    }
  }, [roleFromQuery]);

  const fromLocation = (location.state as any)?.from?.pathname || APP_ROUTES.EXPLORE;

  const validateIdentifier = (value: string) => {
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$|^[0-9]{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return phoneRegex.test(value.trim()) || emailRegex.test(value.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!identifier.trim()) {
      setFormError('Vui lòng nhập số điện thoại hoặc email.');
      return;
    }
    if (!validateIdentifier(identifier)) {
      setFormError('Vui lòng nhập đúng định dạng Số điện thoại (10 chữ số) hoặc Email hợp lệ.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setFormError('Mật khẩu phải từ 6 ký tự trở lên.');
      return;
    }

    try {
      await login({ phone: identifier.trim(), password, role: selectedRole });
      toast.success('Đăng nhập thành công! Chào mừng bạn quay trở lại. 🎉');
      navigate(fromLocation, { replace: true });
    } catch {
      // Handled by Redux auth slice
    }
  };

  const handleQuickFill = (phone: string, pass: string, role: RoleType) => {
    setIdentifier(phone);
    setPassword(pass);
    setSelectedRole(role);
    setFormError('');
    clearError();
  };

  const displayError = formError || error;

  return (
    <div className="w-full space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <LogIn className="h-8 w-8 text-primary" />
          Đăng nhập
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Nhập tài khoản của bạn để khám phá hàng ngàn món ăn ngon!
        </p>
      </div>

      {/* Role Tabs */}
      <div className="bg-slate-100/80 p-1.5 rounded-xl">
        <div className="text-xs font-semibold text-slate-500 mb-1.5 px-1">
          Chọn cổng vai trò đăng nhập:
        </div>
        <div className="grid grid-cols-3 gap-1">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => { setSelectedRole(tab.value); clearError(); setFormError(''); }}
              className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                selectedRole === tab.value
                  ? 'bg-white text-primary shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {displayError && (
        <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg font-medium flex items-start gap-2">
          <span className="shrink-0">⚠️</span>
          <span>{displayError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identifier */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Số điện thoại hoặc Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="0987654321 hoặc email@example.com"
              autoComplete="username"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-white"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Ví dụ: 0987654321 hoặc customer@example.com</p>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div className="flex justify-end">
          <a href="#" className="text-sm font-semibold text-primary hover:underline">
            Quên mật khẩu?
          </a>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
        </button>
      </form>

      {/* Demo accounts */}
      <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
          <ShieldCheck className="h-4 w-4" />
          <span>Tài khoản kiểm thử nhanh (Demo Seed Data):</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={() => handleQuickFill(acc.phone, acc.pass, acc.role)}
              className="px-2 py-1.5 text-xs bg-white rounded-lg border border-rose-200 text-gray-700 hover:border-primary hover:text-primary font-medium transition-all shadow-xs text-center"
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Register link */}
      <div className="text-center text-sm text-slate-600 pt-2 border-t border-slate-100">
        Chưa có tài khoản?{' '}
        <Link to={`${APP_ROUTES.REGISTER}?role=${selectedRole}`} className="font-bold text-primary hover:underline">
          Đăng ký ngay →
        </Link>
      </div>
    </div>
  );
};
