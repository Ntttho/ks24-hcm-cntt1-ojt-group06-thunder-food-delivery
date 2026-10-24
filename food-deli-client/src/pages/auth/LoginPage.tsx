import React from 'react';
import { Form, Input, Button, Alert, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';
import type { LoginRequest } from '@/types';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  const [form] = Form.useForm();

  const onFinish = async (values: LoginRequest) => {
    try {
      await login(values);
      navigate(APP_ROUTES.HOME);
    } catch {
      // Handled in auth slice / hook
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Title level={3} className="!mb-1 text-gray-900 font-extrabold">
          Đăng nhập
        </Title>
        <Text type="secondary" className="text-sm">
          Chào mừng bạn quay trở lại với Thunder Food Delivery!
        </Text>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          className="rounded-lg"
        />
      )}

      <Form
        form={form}
        name="login"
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        size="large"
      >
        <Form.Item
          label={<span className="font-semibold text-gray-700">Email</span>}
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập địa chỉ email!' },
            { type: 'email', message: 'Email không đúng định dạng!' },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-gray-400 mr-1" />}
            placeholder="example@thunder.com"
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-semibold text-gray-700">Mật khẩu</span>}
          name="password"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400 mr-1" />}
            placeholder="••••••••"
          />
        </Form.Item>

        <div className="flex items-center justify-between mb-4">
          <Link
            to="#"
            className="text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            block
            className="bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 font-bold"
          >
            Đăng nhập ngay
          </Button>
        </Form.Item>
      </Form>

      <div className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
        Chưa có tài khoản?{' '}
        <Link to={APP_ROUTES.REGISTER} className="font-bold text-orange-600 hover:text-orange-700">
          Đăng ký tài khoản mới
        </Link>
      </div>
    </div>
  );
};
