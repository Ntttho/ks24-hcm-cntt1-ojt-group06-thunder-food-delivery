import React, { useState } from 'react';
import { Form, Input, Button, Alert, Typography, Segmented, message, Checkbox } from 'antd';
import {
  LockOutlined,
  ThunderboltFilled,
  UserOutlined,
  ShopOutlined,
  CarOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuth();
  const [form] = Form.useForm();
  const [selectedRole, setSelectedRole] = useState<string>('CUSTOMER');

  // Check if redirected from another page
  const fromLocation = (location.state as any)?.from?.pathname || APP_ROUTES.HOME;

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
        role: selectedRole === 'ALL' ? undefined : selectedRole,
      };

      await login(payload);
      message.success('Đăng nhập thành công! Chào mừng bạn quay trở lại.');
      navigate(fromLocation, { replace: true });
    } catch {
      // Error handled in Redux auth slice and displayed via Alert
    }
  };

  // Quick fill demo account for testing ease
  const handleQuickFill = (phone: string, pass: string, role: string) => {
    form.setFieldsValue({
      identifier: phone,
      password: pass,
      remember: true,
    });
    setSelectedRole(role);
    clearError();
  };

  return (
    <div className="space-y-6">
      {/* Brand & Title */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-linear-to-tr from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 mb-2">
          <ThunderboltFilled className="text-2xl" />
        </div>
        <Title level={3} className="!mb-0 text-gray-900 font-extrabold tracking-tight">
          Đăng nhập Thunder Food
        </Title>
        <Text type="secondary" className="text-sm block">
          Kết nối trực tiếp API Gateway và trải nghiệm ẩm thực tiện lợi
        </Text>
      </div>

      {/* Role Segment Selector */}
      <div className="bg-gray-100/80 p-1.5 rounded-xl">
        <div className="text-xs font-semibold text-gray-500 mb-1.5 px-1 flex items-center justify-between">
          <span>Chọn cổng vai trò đăng nhập:</span>
          <span className="text-orange-600 font-bold">
            {selectedRole === 'CUSTOMER' && 'Khách hàng'}
            {selectedRole === 'MERCHANT' && 'Chủ quán'}
            {selectedRole === 'DRIVER' && 'Tài xế'}
            {selectedRole === 'ALL' && 'Tất cả'}
          </span>
        </div>
        <Segmented
          block
          size="middle"
          value={selectedRole}
          onChange={(val) => {
            setSelectedRole(val as string);
            clearError();
          }}
          options={[
            {
              label: (
                <div className="py-1 flex items-center justify-center gap-1.5">
                  <UserOutlined />
                  <span className="font-semibold text-xs sm:text-sm">Khách hàng</span>
                </div>
              ),
              value: 'CUSTOMER',
            },
            {
              label: (
                <div className="py-1 flex items-center justify-center gap-1.5">
                  <ShopOutlined />
                  <span className="font-semibold text-xs sm:text-sm">Chủ quán</span>
                </div>
              ),
              value: 'MERCHANT',
            },
            {
              label: (
                <div className="py-1 flex items-center justify-center gap-1.5">
                  <CarOutlined />
                  <span className="font-semibold text-xs sm:text-sm">Tài xế</span>
                </div>
              ),
              value: 'DRIVER',
            },
          ]}
        />
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
          className="rounded-xl border-red-200"
        />
      )}

      {/* Form */}
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
          label={<span className="font-semibold text-gray-700">Số điện thoại hoặc Email</span>}
          name="identifier"
          rules={[{ validator: validatePhoneOrEmail }]}
          extra={<span className="text-xs text-gray-400">Ví dụ: 0987654321 hoặc customer@foodthunder.com</span>}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400 mr-1.5" />}
            placeholder="0987654321 hoặc email@example.com"
            autoComplete="username"
            className="rounded-xl hover:border-orange-400 focus:border-orange-500"
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-semibold text-gray-700">Mật khẩu</span>}
          name="password"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu!' },
            { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên!' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400 mr-1.5" />}
            placeholder="••••••••"
            autoComplete="current-password"
            className="rounded-xl hover:border-orange-400 focus:border-orange-500"
          />
        </Form.Item>

        <div className="flex items-center justify-between mb-4 text-xs sm:text-sm">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox className="text-gray-600">Ghi nhớ đăng nhập</Checkbox>
          </Form.Item>
          <a
            href="#forgot"
            onClick={(e) => {
              e.preventDefault();
              message.info('Vui lòng liên hệ quản trị viên hoặc sử dụng tính năng quên mật khẩu.');
            }}
            className="font-semibold text-orange-600 hover:text-orange-700"
          >
            Quên mật khẩu?
          </a>
        </div>

        <Form.Item className="mb-2">
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            block
            className="h-12 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/25 border-none font-bold rounded-xl text-base"
          >
            Đăng nhập ngay
          </Button>
        </Form.Item>
      </Form>

      {/* Demo Credentials Quick Fill Pills */}
      <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-orange-800">
          <SafetyOutlined />
          <span>Tài khoản kiểm thử nhanh (Demo Seed Data):</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill('0987654321', 'Password@123', 'CUSTOMER')}
            className="px-2 py-1.5 text-xs bg-white rounded-lg border border-orange-200 text-gray-700 hover:border-orange-500 hover:text-orange-600 font-medium transition-all shadow-2xs text-center"
          >
            👤 Khách hàng
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('0901234567', 'Password@123', 'MERCHANT')}
            className="px-2 py-1.5 text-xs bg-white rounded-lg border border-orange-200 text-gray-700 hover:border-orange-500 hover:text-orange-600 font-medium transition-all shadow-2xs text-center"
          >
            🏪 Chủ quán
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('0912345678', 'Password@123', 'DRIVER')}
            className="px-2 py-1.5 text-xs bg-white rounded-lg border border-orange-200 text-gray-700 hover:border-orange-500 hover:text-orange-600 font-medium transition-all shadow-2xs text-center"
          >
            🛵 Tài xế
          </button>
        </div>
      </div>

      {/* Switch to Register */}
      <div className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
        Chưa có tài khoản?{' '}
        <Link to={APP_ROUTES.REGISTER} className="font-bold text-orange-600 hover:text-orange-700">
          Đăng ký tài khoản mới &rarr;
        </Link>
      </div>
    </div>
  );
};
