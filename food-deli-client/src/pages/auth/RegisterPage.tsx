import React, { useState } from 'react';
import { Form, Input, Button, Alert, Typography, Select, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/services/modules/authApi';
import { APP_ROUTES } from '@/constants';
import type { RegisterRequest } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onFinish = async (values: RegisterRequest) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await authApi.register(values);
      message.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      navigate(APP_ROUTES.LOGIN);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin!'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Title level={3} className="!mb-1 text-gray-900 font-extrabold">
          Tạo tài khoản
        </Title>
        <Text type="secondary" className="text-sm">
          Tham gia Thunder Food Delivery ngay hôm nay!
        </Text>
      </div>

      {errorMessage && (
        <Alert
          message={errorMessage}
          type="error"
          showIcon
          closable
          onClose={() => setErrorMessage(null)}
          className="rounded-lg"
        />
      )}

      <Form
        form={form}
        name="register"
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        size="large"
        initialValues={{ role: 'CUSTOMER' }}
      >
        <Form.Item
          label={<span className="font-semibold text-gray-700">Họ và tên</span>}
          name="fullName"
          rules={[{ required: true, message: 'Vui lòng nhập họ và tên của bạn!' }]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400 mr-1" />}
            placeholder="Nguyễn Văn A"
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-semibold text-gray-700">Email</span>}
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email!' },
            { type: 'email', message: 'Email không đúng định dạng!' },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-gray-400 mr-1" />}
            placeholder="example@thunder.com"
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-semibold text-gray-700">Số điện thoại</span>}
          name="phoneNumber"
          rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
        >
          <Input
            prefix={<PhoneOutlined className="text-gray-400 mr-1" />}
            placeholder="0912345678"
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
            prefix={<LockOutlined className="text-gray-400 mr-1" />}
            placeholder="••••••••"
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-semibold text-gray-700">Vai trò</span>}
          name="role"
          rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
        >
          <Select>
            <Option value="CUSTOMER">Khách hàng (Đặt món)</Option>
            <Option value="MERCHANT">Chủ quán / Nhà hàng (Đối tác)</Option>
            <Option value="SHIPPER">Tài xế giao hàng</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            block
            className="bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 font-bold"
          >
            Đăng ký ngay
          </Button>
        </Form.Item>
      </Form>

      <div className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
        Đã có tài khoản?{' '}
        <Link to={APP_ROUTES.LOGIN} className="font-bold text-orange-600 hover:text-orange-700">
          Đăng nhập
        </Link>
      </div>
    </div>
  );
};
