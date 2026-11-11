import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Space, Divider, Alert } from 'antd';
import {
  EditOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import type { User } from '@/types/auth.types';
import type { UpdateUserPayload } from '@/services/modules/userApi';

interface EditUserModalProps {
  isOpen: boolean;
  user: User | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (id: number | string, payload: UpdateUserPayload) => Promise<void>;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  user,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen && user) {
      // Normalize role string (e.g., ROLE_MERCHANT -> MERCHANT, SHIPPER -> DRIVER)
      let currentRole = (user.role || 'CUSTOMER').toUpperCase().replace('ROLE_', '');
      if (currentRole === 'SHIPPER') currentRole = 'DRIVER';

      form.setFieldsValue({
        fullName: user.fullName || '',
        phone: user.phone || user.phoneNumber || '',
        email: user.email || '',
        password: '',
        role: currentRole,
        status: user.status === 'LOCKED' ? 'LOCKED' : 'ACTIVE',
      });
    }
  }, [isOpen, user, form]);

  const handleFinish = async (values: any) => {
    if (!user) return;

    const payload: UpdateUserPayload = {
      fullName: values.fullName?.trim(),
      phone: values.phone?.trim(),
      email: values.email?.trim() || undefined,
      password: values.password?.trim() ? values.password : undefined,
      role: values.role,
      roles: values.role ? [values.role] : undefined,
      status: values.status,
    };

    await onSubmit(user.id, payload);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            <EditOutlined className="text-base" />
          </div>
          <div>
            <span className="font-bold text-base">Chỉnh Sửa Người Dùng</span>
            {user && (
              <span className="ml-2 text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                ID: #{user.id}
              </span>
            )}
          </div>
        </div>
      }
      footer={null}
      destroyOnClose
      centered
      width={560}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="pt-3"
        requiredMark="optional"
      >
        <Form.Item
          name="fullName"
          label={<span className="font-semibold text-slate-700">Họ và tên</span>}
          rules={[
            { required: true, message: 'Vui lòng nhập họ và tên!' },
            { max: 100, message: 'Họ tên không được vượt quá 100 ký tự!' },
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-slate-400" />}
            placeholder="Ví dụ: Nguyễn Văn A"
            className="rounded-lg py-2"
          />
        </Form.Item>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Form.Item
            name="phone"
            label={<span className="font-semibold text-slate-700">Số điện thoại</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              {
                pattern: /^(0|\+84)[0-9]{9,10}$/,
                message: 'Số điện thoại không hợp lệ (9-10 chữ số)!',
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined className="text-slate-400" />}
              placeholder="0912345678"
              className="rounded-lg py-2"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={<span className="font-semibold text-slate-700">Email (Tùy chọn)</span>}
            rules={[
              { type: 'email', message: 'Địa chỉ email không đúng định dạng!' },
              { max: 100, message: 'Email không được vượt quá 100 ký tự!' },
            ]}
          >
            <Input
              prefix={<MailOutlined className="text-slate-400" />}
              placeholder="example@gmail.com"
              className="rounded-lg py-2"
            />
          </Form.Item>
        </div>

        <Form.Item
          name="password"
          label={
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-slate-700">Mật khẩu mới (Tùy chọn)</span>
              <span className="text-xs text-slate-400">Để trống nếu không đổi</span>
            </div>
          }
          rules={[{ min: 6, message: 'Mật khẩu mới phải chứa ít nhất 6 ký tự!' }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-slate-400" />}
            placeholder="Nhập nếu muốn đổi mật khẩu"
            className="rounded-lg py-2"
          />
        </Form.Item>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Form.Item
            name="role"
            label={<span className="font-semibold text-slate-700">Vai trò hệ thống</span>}
            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
          >
            <Select
              className="w-full"
              suffixIcon={<SafetyCertificateOutlined className="text-slate-400" />}
              options={[
                { label: 'Khách hàng (CUSTOMER)', value: 'CUSTOMER' },
                { label: 'Đối tác Quán ăn (MERCHANT)', value: 'MERCHANT' },
                { label: 'Tài xế giao hàng (DRIVER)', value: 'DRIVER' },
                { label: 'Quản trị viên (ADMIN)', value: 'ADMIN' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label={<span className="font-semibold text-slate-700">Trạng thái tài khoản</span>}
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select
              className="w-full"
              options={[
                { label: 'Hoạt động (ACTIVE)', value: 'ACTIVE' },
                { label: 'Tạm khóa (LOCKED)', value: 'LOCKED' },
              ]}
            />
          </Form.Item>
        </div>

        <Divider className="my-4" />

        <div className="flex justify-end gap-2.5">
          <Button onClick={onClose} disabled={submitting} className="rounded-lg px-4">
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<SaveOutlined />}
            className="bg-blue-600 hover:bg-blue-700 border-none font-medium rounded-lg px-5 shadow-sm"
          >
            Lưu Thay Đổi
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

