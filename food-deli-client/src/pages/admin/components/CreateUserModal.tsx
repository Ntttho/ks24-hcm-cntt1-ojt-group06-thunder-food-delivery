import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Space, Divider } from 'antd';
import {
  UserAddOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { CreateUserPayload } from '@/services/modules/userApi';

interface CreateUserModalProps {
  isOpen: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload) => Promise<void>;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
      form.setFieldsValue({
        role: 'CUSTOMER',
        status: 'ACTIVE',
      });
    }
  }, [isOpen, form]);

  const handleFinish = async (values: any) => {
    const payload: CreateUserPayload = {
      fullName: values.fullName?.trim(),
      phone: values.phone?.trim(),
      email: values.email?.trim() || undefined,
      password: values.password,
      role: values.role,
      roles: values.role ? [values.role] : ['CUSTOMER'],
      status: values.status || 'ACTIVE',
    };
    await onSubmit(payload);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
            <UserAddOutlined className="text-base" />
          </div>
          <span className="font-bold text-base">Thêm Người Dùng Mới</span>
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
          label={<span className="font-semibold text-slate-700">Mật khẩu khởi tạo</span>}
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu khởi tạo!' },
            { min: 6, message: 'Mật khẩu phải chứa ít nhất 6 ký tự!' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-slate-400" />}
            placeholder="Tối thiểu 6 ký tự"
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
            label={<span className="font-semibold text-slate-700">Trạng thái ban đầu</span>}
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
            icon={<CheckCircleOutlined />}
            className="bg-orange-500 hover:bg-orange-600 border-none font-medium rounded-lg px-5 shadow-sm"
          >
            Tạo Người Dùng
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

