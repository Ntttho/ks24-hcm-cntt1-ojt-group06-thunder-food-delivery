import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, User, Phone, Lock, Mail, Eye, EyeOff, Store, Car } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';
import type { RegisterRequest } from '@/types';
import { toast } from 'sonner';

type RoleType = 'CUSTOMER' | 'MERCHANT' | 'DRIVER';

const ROLE_OPTIONS: { value: RoleType; label: string; subLabel: string; emoji: string; icon: React.ElementType }[] = [
  { value: 'CUSTOMER', label: 'Khách hàng', subLabel: 'Đặt món ăn', emoji: '👤', icon: User },
  { value: 'MERCHANT', label: 'Chủ quán', subLabel: 'Bán thực đơn', emoji: '🏪', icon: Store },
  { value: 'DRIVER', label: 'Đối tác tài xế', subLabel: 'Giao đồ ăn', emoji: '🛵', icon: Car },
];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, isLoading, error, clearError } = useAuth();
  const roleFromQuery = searchParams.get('role')?.toUpperCase();
  const initialRole: RoleType =
    roleFromQuery === 'MERCHANT' || roleFromQuery === 'DRIVER' || roleFromQuery === 'CUSTOMER'
      ? roleFromQuery
      : 'CUSTOMER';
  const [selectedRole, setSelectedRole] = useState<RoleType>(initialRole);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (roleFromQuery === 'MERCHANT' || roleFromQuery === 'DRIVER' || roleFromQuery === 'CUSTOMER') {
      setSelectedRole(roleFromQuery);
    }
  }, [roleFromQuery]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormError('');
    clearError();
  };

  const validatePhoneNumber = (value: string) => {
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$|^[0-9]{10}$/;
    return phoneRegex.test(value.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      setFormError('Họ và tên phải có ít nhất 2 ký tự.');
      return;
    }
    if (!validatePhoneNumber(formData.phone)) {
      setFormError('Số điện thoại không hợp lệ (yêu cầu 10 chữ số).');
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormError('Định dạng email không hợp lệ.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setFormError('Mật khẩu phải từ 6 ký tự trở lên.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!formData.terms) {
      setFormError('Vui lòng đồng ý với điều khoản dịch vụ.');
      return;
    }

    try {
      const payload: RegisterRequest = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email ? formData.email.trim() : undefined,
        password: formData.password,
        role: selectedRole,
      };

      await register(payload);
      toast.success('Đăng ký tài khoản thành công! Bạn có thể bắt đầu sử dụng ngay. 🎉');
      navigate(APP_ROUTES.EXPLORE);
    } catch {
      // Handled by Redux
    }
  };

  const displayError = formError || error;

  return (
    <div className="w-full space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <UserPlus className="h-8 w-8 text-primary" />
          Đăng ký mới
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Tạo tài khoản mới để nhận ngay voucher giảm 50k đơn đầu tiên!
        </p>
      </div>

      {/* Role Selection */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Chọn vai trò tài khoản:
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setSelectedRole(opt.value); clearError(); setFormError(''); }}
              className={`py-3 px-3 rounded-xl border transition-all flex flex-col items-center justify-center text-center ${
                selectedRole === opt.value
                  ? 'border-primary bg-rose-50/60 shadow-xs ring-1 ring-primary/30'
                  : 'border-slate-200 hover:border-rose-300 bg-white'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-sm ${
                  selectedRole === opt.value ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <opt.icon className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm text-slate-800">{opt.label}</span>
              <span className="text-[11px] text-slate-500 mt-0.5">{opt.subLabel}</span>
            </button>
          ))}
        </div>
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
        {/* Full Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và tên</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-white"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số điện thoại</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Phone className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="0912345678"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-white"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Dùng số điện thoại này để đăng nhập vào tài khoản</p>
        </div>

        {/* Email (optional) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Email <span className="font-normal text-slate-400">(Tùy chọn)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="user@example.com"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-white"
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
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Mật khẩu tối thiểu 6 ký tự"
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

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Xác nhận mật khẩu</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Nhập lại mật khẩu vừa tạo"
              className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-white"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            checked={formData.terms}
            onChange={(e) => handleChange('terms', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
          />
          <label htmlFor="terms" className="text-xs sm:text-sm text-slate-600 cursor-pointer leading-relaxed">
            Tôi đồng ý với{' '}
            <a href="#" className="text-primary font-semibold hover:underline">Điều khoản dịch vụ</a>
            {' '}và{' '}
            <a href="#" className="text-primary font-semibold hover:underline">Chính sách bảo mật</a>
            {' '}của Thunder Food.
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản ngay'}
        </button>
      </form>

      {/* Login link */}
      <div className="text-center text-sm text-slate-600 pt-2 border-t border-slate-100">
        Đã có tài khoản?{' '}
        <Link to={`${APP_ROUTES.LOGIN}?role=${selectedRole}`} className="font-bold text-primary hover:underline">
          Đăng nhập ngay →
        </Link>
      </div>
    </div>
  );
};
