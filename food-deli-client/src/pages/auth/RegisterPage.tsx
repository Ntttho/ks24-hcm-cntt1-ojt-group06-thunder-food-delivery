import React, { useState } from 'react';
import { Form, Input, Button, Alert, Typography, message, Radio, Checkbox } from 'antd';
import {
  LockOutlined,
  UserOutlined,
  PhoneOutlined,
  ThunderboltFilled,
  ShopOutlined,
  CarOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';
import type { RegisterRequest } from '@/types';

const { Title, Text } = Typography;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuth();
  const [form] = Form.useForm();
  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'MERCHANT' | 'DRIVER'>('CUSTOMER');

  // Phone validation for Vietnamese numbers (10 digits)
  const validatePhoneNumber = (_: any, value: string) => {
    if (!value || value.trim() === '') {
      return Promise.reject(new Error('Vui lòng nhập số điện thoại!'));
    }
    const cleanValue = value.trim();
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$|^[0-9]{10}$/;
    if (!phoneRegex.test(cleanValue)) {
      return Promise.reject(new Error('Số điện thoại không hợp lệ (yêu cầu 10 chữ số)!'));
    }
    return Promise.resolve();
  };

  const onFinish = async (values: any) => {
    try {
      const payload: RegisterRequest = {
        fullName: values.fullName.trim(),
        phone: values.phone.trim(),
        email: values.email ? values.email.trim() : undefined,
        password: values.password,
        role: selectedRole,
      };

      await register(payload);
      message.success('Đăng ký tài khoản thành công! Bạn có thể bắt đầu sử dụng ngay.');
      navigate(APP_ROUTES.HOME);
    } catch {
      // Handled in Redux and displayed via Alert
    }
  };

  return (
    <div className="space-y-6">
      {/* Brand & Title */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-linear-to-tr from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 mb-2">
          <ThunderboltFilled className="text-2xl" />
        </div>
        <Title level={3} className="!mb-0 text-gray-900 font-extrabold tracking-tight">
          Đăng ký tài khoản mới
        </Title>
        <Text type="secondary" className="text-sm block">
          Chọn vai trò và gia nhập hệ thống Thunder Food Delivery
        </Text>
      </div>

      {/* Role Selection Cards */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
          Chọn vai trò tài khoản:
        </label>
        <Radio.Group
          value={selectedRole}
          onChange={(e) => {
            setSelectedRole(e.target.value);
            clearError();
          }}
          className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2.5"
        >
          {/* Customer */}
          <Radio.Button
            value="CUSTOMER"
            className={`!h-auto !py-3 !px-3 !rounded-xl !border transition-all flex flex-col items-center justify-center text-center ${
              selectedRole === 'CUSTOMER'
                ? '!border-orange-500 !bg-orange-50/60 shadow-xs ring-1 ring-orange-500/30'
                : '!border-gray-200 hover:!border-orange-300'
            }`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-sm ${
                  selectedRole === 'CUSTOMER' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <UserOutlined />
              </div>
              <span className="font-bold text-sm text-gray-800">Khách hàng</span>
              <span className="text-[11px] text-gray-500 mt-0.5">Đặt món ăn</span>
            </div>
          </Radio.Button>

          {/* Merchant */}
          <Radio.Button
            value="MERCHANT"
            className={`!h-auto !py-3 !px-3 !rounded-xl !border transition-all flex flex-col items-center justify-center text-center ${
              selectedRole === 'MERCHANT'
                ? '!border-orange-500 !bg-orange-50/60 shadow-xs ring-1 ring-orange-500/30'
                : '!border-gray-200 hover:!border-orange-300'
            }`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-sm ${
                  selectedRole === 'MERCHANT' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <ShopOutlined />
              </div>
              <span className="font-bold text-sm text-gray-800">Chủ quán</span>
              <span className="text-[11px] text-gray-500 mt-0.5">Bán thực đơn</span>
            </div>
          </Radio.Button>

          {/* Driver */}
          <Radio.Button
            value="DRIVER"
            className={`!h-auto !py-3 !px-3 !rounded-xl !border transition-all flex flex-col items-center justify-center text-center ${
              selectedRole === 'DRIVER'
                ? '!border-orange-500 !bg-orange-50/60 shadow-xs ring-1 ring-orange-500/30'
                : '!border-gray-200 hover:!border-orange-300'
            }`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-sm ${
                  selectedRole === 'DRIVER' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <CarOutlined />
              </div>
              <span className="font-bold text-sm text-gray-800">Tài xế</span>
              <span className="text-[11px] text-gray-500 mt-0.5">Giao đồ ăn</span>
            </div>
          </Radio.Button>
        </Radio.Group>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          message="Lỗi đăng ký"
          description={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          className="rounded-xl border-red-200"
        />
      )}

      {/* Register Form */}
      <Form
        form={form}
        name="register"
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        size="large"
        initialValues={{ terms: true }}
      >
        <Form.Item
          label={<span className="font-semibold text-gray-700">Họ và tên</span>}
          name="fullName"
          rules={[
            { required: true, message: 'Vui lòng nhập họ và tên của bạn!' },
            { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự!' },
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400 mr-1.5" />}
            placeholder="Ví dụ: Nguyễn Văn An"
            className="rounded-xl hover:border-orange-400 focus:border-orange-500"
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-semibold text-gray-700">Số điện thoại</span>}
          name="phone"
          rules={[{ validator: validatePhoneNumber }]}
          extra={<span className="text-xs text-gray-400">Dùng số điện thoại này để đăng nhập vào tài khoản</span>}
        >
          <Input
            prefix={<PhoneOutlined className="text-gray-400 mr-1.5" />}
            placeholder="0912345678"
            className="rounded-xl hover:border-orange-400 focus:border-orange-500"
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-semibold text-gray-700">Email (Tùy chọn)</span>}
          name="email"
          rules={[{ type: 'email', message: 'Định dạng email không hợp lệ!' }]}
        >
          <Input
            prefix={<MailOutlined className="text-gray-400 mr-1.5" />}
            placeholder="user@example.com"
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
            placeholder="Mật khẩu tối thiểu 6 ký tự"
            className="rounded-xl hover:border-orange-400 focus:border-orange-500"
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-semibold text-gray-700">Xác nhận mật khẩu</span>}
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Vui lòng nhập lại mật khẩu xác nhận!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400 mr-1.5" />}
            placeholder="Nhập lại mật khẩu vừa tạo"
            className="rounded-xl hover:border-orange-400 focus:border-orange-500"
          />
        </Form.Item>

        <Form.Item
          name="terms"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(new Error('Vui lòng đồng ý với điều khoản dịch vụ!')),
            },
          ]}
        >
          <Checkbox className="text-xs sm:text-sm text-gray-600">
            Tôi đồng ý với{' '}
            <a href="#terms" className="text-orange-600 font-semibold hover:underline">
              Điều khoản dịch vụ
            </a>{' '}
            và{' '}
            <a href="#privacy" className="text-orange-600 font-semibold hover:underline">
              Chính sách bảo mật
            </a>{' '}
            của Thunder Food.
          </Checkbox>
        </Form.Item>

        <Form.Item className="mb-2">
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            block
            className="h-12 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/25 border-none font-bold rounded-xl text-base"
          >
            Tạo tài khoản ngay
          </Button>
        </Form.Item>
      </Form>

      {/* Switch to Login */}
      <div className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
        Đã có tài khoản?{' '}
        <Link to={APP_ROUTES.LOGIN} className="font-bold text-orange-600 hover:text-orange-700">
          Đăng nhập ngay &rarr;
        </Link>
      </div>
    </div>
  );
};
