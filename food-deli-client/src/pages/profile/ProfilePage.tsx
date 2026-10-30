import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  Star,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES, ROLES } from '@/constants';
import { toast } from 'sonner';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [nameError, setNameError] = useState('');

  if (!user) return null;

  const handleEdit = () => {
    setFullName(user.fullName || '');
    setNameError('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNameError('');
  };

  const handleSave = async () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      setNameError('Tên quá ngắn! Vui lòng nhập ít nhất 2 ký tự.');
      return;
    }
    try {
      await updateProfile({ fullName: fullName.trim() });
      toast.success('Cập nhật họ tên thành công! 🎉');
      setIsEditing(false);
    } catch {
      // Handled in slice
    }
  };

  const getRoleBadge = () => {
    const r = user.role;
    if (r === ROLES.ADMIN || r === 'ADMIN')
      return <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">Quản trị viên</span>;
    if (r === ROLES.MERCHANT || r === 'MERCHANT')
      return <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">Chủ quán / Nhà hàng</span>;
    if (r === ROLES.SHIPPER || r === 'SHIPPER' || r === 'DRIVER' || r === ROLES.DRIVER)
      return <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">Tài xế giao hàng</span>;
    return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">Khách hàng thân thiết</span>;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-24 bg-linear-to-r from-primary/80 to-rose-400/80" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
            {/* Avatar */}
            <div className="relative shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-primary/10 border-4 border-white shadow-md flex items-center justify-center">
                  <User className="h-10 w-10 text-primary" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left sm:pb-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {user.fullName || 'Người dùng'}
                </h2>
                {getRoleBadge()}
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {user.phone}
                </span>
                {user.ratingAvg && (
                  <span className="flex items-center gap-1 font-bold text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-current" /> {user.ratingAvg} / 5.0
                  </span>
                )}
                {user.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
            </div>

            {/* Address Book Button */}
            <Link
              to={APP_ROUTES.ADDRESSES}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
            >
              <MapPin className="h-4 w-4" />
              Sổ địa chỉ
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Details Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Thông tin chi tiết tài khoản</h3>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Chỉnh sửa
            </button>
          ) : null}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Họ và tên
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setNameError(''); }}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-white"
                  />
                  {nameError && <p className="text-xs text-rose-500 mt-1">{nameError}</p>}
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-800 py-2.5 px-3.5 bg-slate-50 rounded-xl">
                  {user.fullName || '—'}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Số điện thoại
              </label>
              <p className="text-sm font-semibold text-slate-500 py-2.5 px-3.5 bg-slate-50 rounded-xl">
                {user.phone}
              </p>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Vai trò trong hệ thống
              </label>
              <p className="text-sm font-semibold text-slate-500 py-2.5 px-3.5 bg-slate-50 rounded-xl">
                {user.role === 'CUSTOMER' ? 'Khách hàng (Đặt món)' : user.role}
              </p>
            </div>

            {/* User ID */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Mã định danh (User ID)
              </label>
              <p className="text-sm font-mono font-semibold text-slate-500 py-2.5 px-3.5 bg-slate-50 rounded-xl">
                #{user.id}
              </p>
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex items-center justify-end gap-2 pt-5 mt-5 border-t border-slate-100">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Security Hint */}
      <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-slate-800">Bảo mật tài khoản</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Để thay đổi mật khẩu hoặc email, vui lòng liên hệ bộ phận hỗ trợ khách hàng qua hotline{' '}
            <a href="tel:19001234" className="text-primary font-semibold hover:underline">1900 1234</a>.
          </p>
        </div>
      </div>
    </div>
  );
};
