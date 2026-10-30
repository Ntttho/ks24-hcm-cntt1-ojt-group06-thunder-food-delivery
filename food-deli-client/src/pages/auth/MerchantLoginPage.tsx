import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Eye, EyeOff, Phone, Lock, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';
import { toast } from 'sonner';

export const MerchantLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

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
      setFormError('Vui lòng nhập đúng định dạng Số điện thoại hoặc Email hợp lệ.');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Mật khẩu phải từ 6 ký tự trở lên.');
      return;
    }

    try {
      await login({ phone: identifier.trim(), password, role: 'MERCHANT' });
      toast.success('Chào mừng Chủ quán quay trở lại! 🏪');
      navigate(APP_ROUTES.HOME);
    } catch {
      // Handled by Redux
    }
  };

  const handleQuickFill = () => {
    setIdentifier('0901234567');
    setPassword('Password@123');
    setFormError('');
    clearError();
  };

  const displayError = formError || error;

  return (
    <div className="w-full space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <Store className="h-8 w-8 text-amber-500" />
          Đăng nhập Chủ Quán
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Quản lý nhà hàng, thực đơn và đơn hàng của bạn ngay tại đây.
        </p>
      </div>

      {/* Error */}
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
              <Phone className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="0987654321 hoặc merchant@example.com"
              autoComplete="username"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all bg-white"
            />
          </div>
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
              className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all bg-white"
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

        <div className="flex justify-end">
          <a href="#" className="text-sm font-semibold text-amber-600 hover:underline">
            Quên mật khẩu?
          </a>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? 'Đang xác thực...' : 'Đăng nhập Cổng Chủ Quán'}
        </button>
      </form>

      {/* Demo */}
      <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
          <ShieldCheck className="h-4 w-4" />
          <span>Tài khoản Chủ quán Demo:</span>
        </div>
        <button
          type="button"
          onClick={handleQuickFill}
          className="px-3 py-1.5 text-xs bg-white rounded-lg border border-amber-200 text-gray-700 hover:border-amber-500 hover:text-amber-600 font-medium transition-all shadow-xs"
        >
          🏪 Điền nhanh: 0901234567 / Password@123
        </button>
      </div>

      {/* Footer links */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        <div className="text-center text-sm text-slate-600">
          Chưa có tài khoản chủ quán?{' '}
          <Link to="/merchant/register" className="font-bold text-amber-600 hover:underline">
            Đăng ký ngay →
          </Link>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
          <Link to={APP_ROUTES.LOGIN} className="hover:text-slate-700 underline transition-colors flex items-center gap-1">
            <Zap className="h-3 w-3" /> Cổng Khách hàng
          </Link>
          <span>•</span>
          <Link to="/driver/login" className="hover:text-slate-700 underline transition-colors">
            Cổng Tài Xế
          </Link>
        </div>
      </div>
    </div>
  );
};
