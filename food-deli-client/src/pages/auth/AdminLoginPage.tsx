import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Alert, Checkbox, message, Tag } from 'antd';
import {
  LockOutlined,
  UserOutlined,
  ArrowRightOutlined,
  SafetyCertificateFilled,
  ThunderboltFilled,
  KeyOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';
import { getRoleDefaultPath } from '@/utils/navigation';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError, isAuthenticated, isAdmin, user } = useAuth();
  const [form] = Form.useForm();
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Check if redirected from a protected admin route
  const queryParams = new URLSearchParams(location.search);
  const fromQuery = queryParams.get('from');
  const fromState = (location.state as any)?.from;

  const fromLocation =
    (typeof fromState === 'string'
      ? fromState
      : fromState?.pathname
      ? `${fromState.pathname}${fromState.search || ''}`
      : fromQuery) || APP_ROUTES.ADMIN_DASHBOARD;

  // Auto-redirect if already authenticated: Admin về dashboard, role khác về trang chính của họ
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate(fromLocation, { replace: true });
      } else if (user) {
        navigate(getRoleDefaultPath(user.role), { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, user, fromLocation, navigate]);

  // Phone / Email validation
  const validateIdentifier = (_: any, value: string) => {
    if (!value || value.trim() === '') {
      return Promise.reject(new Error('Vui lòng nhập tài khoản Quản trị viên (SĐT hoặc Email)!'));
    }
    const clean = value.trim();
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$|^[0-9]{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!phoneRegex.test(clean) && !emailRegex.test(clean)) {
      return Promise.reject(new Error('Vui lòng nhập đúng định dạng Số điện thoại (10 chữ số) hoặc Email hợp lệ!'));
    }
    return Promise.resolve();
  };

  const onFinish = async (values: any) => {
    try {
      clearError();
      const payload = {
        phone: values.identifier.trim(),
        password: values.password,
        role: 'ADMIN', // Enforce ADMIN role verification
      };

      await login(payload);
      message.success('Đăng nhập thành công! Chào mừng Quản trị viên hệ thống.');
      navigate(fromLocation, { replace: true });
    } catch {
      // Handled via Redux state and Alert component
    }
  };

  // Quick fill sample admin credentials from seed data
  const handleQuickFillAdmin = () => {
    form.setFieldsValue({
      identifier: '0900000005',
      password: 'Password@123',
    });
    message.info('Đã điền thông tin tài khoản Quản trị viên mẫu (ID #5)');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Glow Circles */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-xl shadow-indigo-500/20 mb-2">
            <ThunderboltFilled className="text-2xl" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              THUNDER<span className="text-orange-500">FOOD</span>
            </h1>
            <Tag color="cyan" className="font-extrabold uppercase text-[10px] tracking-wider border-none px-2 py-0.5 rounded-md">
              ADMIN PORTAL
            </Tag>
          </div>
          <p className="text-slate-400 text-xs">
            Cổng Đăng Nhập Dành Riêng Cho Quản Trị Viên Hệ Thống
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Security Badge Notice */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <SafetyCertificateFilled className="text-emerald-400 text-xl shrink-0" />
            <div className="leading-tight">
              <span className="font-bold text-white block">Khu vực bảo mật cao</span>
              <span className="text-[11px] text-slate-400">Chỉ tài khoản được cấp quyền Quản trị (ROLE_ADMIN) mới có thể đăng nhập.</span>
            </div>
          </div>

          {/* Error Alert Display */}
          {error && (
            <Alert
              message="Đăng nhập không thành công"
              description={error}
              type="error"
              showIcon
              closable
              onClose={clearError}
              className="rounded-2xl border-rose-900/50 bg-rose-950/50 text-xs text-rose-200"
            />
          )}

          {/* Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ remember: true }}
            className="space-y-4"
          >
            <Form.Item
              name="identifier"
              label={<span className="text-xs font-bold text-slate-300">Tài khoản Quản trị (SĐT hoặc Email)</span>}
              rules={[{ validator: validateIdentifier }]}
            >
              <Input
                size="large"
                prefix={<UserOutlined className="text-slate-400 mr-1" />}
                placeholder="0900000005 hoặc admin@thunderfood.vn"
                className="bg-slate-800/80 border-slate-700 text-white rounded-xl placeholder:text-slate-500 hover:border-indigo-500 focus:border-indigo-500"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="text-xs font-bold text-slate-300">Mật khẩu Quản trị</span>}
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu quản trị!' }]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined className="text-slate-400 mr-1" />}
                placeholder="••••••••••••"
                className="bg-slate-800/80 border-slate-700 text-white rounded-xl placeholder:text-slate-500 hover:border-indigo-500 focus:border-indigo-500"
              />
            </Form.Item>

            <div className="flex items-center justify-between text-xs pt-1">
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="text-slate-300"
              >
                Ghi nhớ phiên đăng nhập
              </Checkbox>
              <button
                type="button"
                onClick={handleQuickFillAdmin}
                className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer flex items-center gap-1 transition-colors"
              >
                <KeyOutlined /> Điền tài khoản mẫu
              </button>
            </div>

            <Form.Item className="!mb-0 pt-2">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={isLoading}
                block
                className="h-12 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 border-none rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                Đăng Nhập Cổng Quản Trị <ArrowRightOutlined className="text-xs" />
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* Footer Navigation */}
        <div className="text-center text-xs text-slate-400 space-y-2">
          <div>
            Bạn là Khách hàng, Quán ăn hoặc Tài xế?{' '}
            <Link
              to={APP_ROUTES.LOGIN}
              className="font-bold text-orange-400 hover:text-orange-300 transition-colors"
            >
              Đăng nhập tại Cổng Người Dùng &rarr;
            </Link>
          </div>
          <div className="text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} THUNDERFOOD Enterprise System. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;

