import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Alert, Checkbox, message } from 'antd';
import {
  LockOutlined,
  UserOutlined,
  ShopOutlined,
  CarOutlined,
  ArrowRightOutlined,
  SafetyCertificateFilled,
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';
import { getRoleDefaultPath } from '@/utils/navigation';
import { SocialAuthButtons } from './components/SocialAuthButtons';

type UserRole = 'CUSTOMER' | 'MERCHANT' | 'DRIVER';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError, isAuthenticated, user } = useAuth();
  const [form] = Form.useForm();
  const [activeRole, setActiveRole] = useState<UserRole>('CUSTOMER');

  // Check if redirected from another page (e.g. from /checkout)
  const queryParams = new URLSearchParams(location.search);
  const fromQuery = queryParams.get('from');
  const fromState = (location.state as any)?.from;

  const fromLocation =
    (typeof fromState === 'string'
      ? fromState
      : fromState?.pathname
      ? `${fromState.pathname}${fromState.search || ''}`
      : fromQuery) || APP_ROUTES.HOME;

  // Tự động điều hướng người dùng đã đăng nhập về trang chính tương ứng theo role
  useEffect(() => {
    if (isAuthenticated && user) {
      const target = getRoleDefaultPath(user.role);
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const roleDefinitions = [
    {
      key: 'CUSTOMER' as UserRole,
      label: 'Khách hàng',
      icon: <UserOutlined />,
      helper: 'Dành cho thực khách săn ưu đãi & thưởng thức món',
      demo: { phone: '0987654321', pass: 'Password@123' },
    },
    {
      key: 'MERCHANT' as UserRole,
      label: 'Đối tác Quán',
      icon: <ShopOutlined />,
      helper: 'Quản lý bàn, thực đơn & doanh thu nhà hàng',
      demo: { phone: '0901234567', pass: 'Password@123' },
    },
    {
      key: 'DRIVER' as UserRole,
      label: 'Tài xế giao vận',
      icon: <CarOutlined />,
      helper: 'Nhận cuốc xe, tối ưu tuyến đường giao món',
      demo: { phone: '0912345678', pass: 'Password@123' },
    },
  ];

  // Custom validation rule for Phone or Email
  const validatePhoneOrEmail = (_: any, value: string) => {
    if (!value || value.trim() === '') {
      return Promise.reject(new Error('Vui lòng nhập số điện thoại hoặc email!'));
    }
    const cleanValue = value.trim();
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$|^[0-9]{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!phoneRegex.test(cleanValue) && !emailRegex.test(cleanValue)) {
      return Promise.reject(
        new Error('Vui lòng nhập đúng định dạng Số điện thoại (10 chữ số) hoặc Email hợp lệ!')
      );
    }
    return Promise.resolve();
  };

  const onFinish = async (values: any) => {
    try {
      const payload = {
        phone: values.identifier.trim(),
        password: values.password,
        role: activeRole,
      };

      const res = await login(payload);
      message.success('Đăng nhập thành công! Chào mừng bạn quay trở lại.');

      const userRole = (res as any)?.user?.role || (res as any)?.role || activeRole;
      const roleHome = getRoleDefaultPath(userRole);

      // Nếu không có đích đến cụ thể (hoặc là trang chủ/login), điều hướng về trang chính của role
      if (!fromLocation || fromLocation === APP_ROUTES.HOME || fromLocation === APP_ROUTES.LOGIN) {
        navigate(roleHome, { replace: true });
      } else {
        navigate(fromLocation, { replace: true });
      }
    } catch {
      // Error handled in Redux auth slice and displayed via Alert
    }
  };

  const handleQuickFill = (role: UserRole) => {
    const target = roleDefinitions.find((r) => r.key === role);
    if (!target) return;
    setActiveRole(role);
    form.setFieldsValue({
      identifier: target.demo.phone,
      password: target.demo.pass,
      remember: true,
    });
    clearError();
  };

  const currentRoleInfo = roleDefinitions.find((r) => r.key === activeRole);

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-6 text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
          <SafetyCertificateFilled className="text-emerald-500" />
          <span>Hệ thống bảo mật TLS 1.3 mã hóa đầu cuối</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Chào mừng trở lại!
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Đăng nhập để theo dõi đơn hàng và tận hưởng dịch vụ ưu đãi độc quyền.
        </p>
      </div>

      {/* Role Picker - Modern Pill Tabs */}
      <div className="mb-5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Cổng truy cập vai trò:</span>
          <span className="text-orange-600 font-bold capitalize">
            {currentRoleInfo?.label}
          </span>
        </label>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-2xl">
          {roleDefinitions.map((role) => {
            const isCurrent = activeRole === role.key;
            return (
              <button
                key={role.key}
                type="button"
                onClick={() => {
                  setActiveRole(role.key);
                  clearError();
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isCurrent
                    ? 'bg-white text-orange-600 shadow-sm shadow-slate-300/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span className="text-sm">{role.icon}</span>
                <span className="truncate">{role.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 ml-1 italic">
          💡 {currentRoleInfo?.helper}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          message="Lỗi đăng nhập"
          description={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          className="mb-4 rounded-xl border-red-200 text-xs"
        />
      )}

      {/* Login Form */}
      <Form
        form={form}
        name="login"
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        size="large"
        initialValues={{ remember: true }}
      >
        <Form.Item
          label={<span className="text-xs font-semibold text-slate-700">Số điện thoại hoặc Email</span>}
          name="identifier"
          rules={[{ validator: validatePhoneOrEmail }]}
          extra={<span className="text-xs text-slate-400">Ví dụ: 0987654321 hoặc customer@foodthunder.com</span>}
        >
          <Input
            prefix={<UserOutlined className="text-slate-400 mr-1" />}
            placeholder="0987 654 321 hoặc an@email.com"
            autoComplete="username"
            className="!rounded-xl border-slate-200 hover:border-orange-400 focus:border-orange-500"
          />
        </Form.Item>

        <Form.Item
          label={<span className="text-xs font-semibold text-slate-700">Mật khẩu bảo vệ</span>}
          name="password"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu đăng nhập!' },
            { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên!' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-slate-400 mr-1" />}
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            className="!rounded-xl border-slate-200 hover:border-orange-400 focus:border-orange-500"
          />
        </Form.Item>

        <div className="flex items-center justify-between mb-5 text-xs">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox className="text-slate-600">Ghi nhớ đăng nhập 30 ngày</Checkbox>
          </Form.Item>
          <a
            href="#forgot-pass"
            onClick={(e) => {
              e.preventDefault();
              message.info('Vui lòng liên hệ hotline 1900 6868 hoặc bộ phận hỗ trợ kỹ thuật để khôi phục mật khẩu.');
            }}
            className="font-bold text-orange-600 hover:text-orange-700 hover:underline"
          >
            Quên mật khẩu?
          </a>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          block
          className="!h-12 !rounded-xl !bg-linear-to-r !from-orange-500 !via-amber-500 !to-orange-600 hover:!opacity-95 !border-none !text-white !font-bold !text-base shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
        >
          <span>Đăng nhập hệ thống</span>
          <ArrowRightOutlined className="text-sm" />
        </Button>
      </Form>

      {/* Demo Quick Fill Card */}
      <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
            <SafetyCertificateFilled className="text-amber-500" />
            <span>Tài khoản Demo thử nghiệm nhanh:</span>
          </span>
          <span className="text-[10px] text-slate-400">Click để tự động điền</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {roleDefinitions.map((role) => (
            <button
              key={role.key}
              type="button"
              onClick={() => handleQuickFill(role.key)}
              className="py-1.5 px-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:border-orange-400 hover:text-orange-600 text-xs font-semibold shadow-2xs hover:shadow transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{role.icon}</span>
              <span className="truncate">{role.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Social Register & Fast Switch */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500 mb-3">Hoặc tiếp tục nhanh chóng với</p>
        <SocialAuthButtons />

        <p className="text-xs text-slate-500">
          Chưa có tài khoản Thunder Food?{' '}
          <Link
            to={APP_ROUTES.REGISTER}
            className="font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
          >
            Đăng ký tài khoản ngay &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
