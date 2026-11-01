import React, { useState } from 'react';
import { Card, Button, Form, Input, Avatar, Tag, message } from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  EditOutlined,
  SaveOutlined,
  StarFilled,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES, ROLES } from '@/constants';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  if (!user) {
    return null;
  }

  const handleUpdate = async (values: { fullName: string }) => {
    try {
      await updateProfile({ fullName: values.fullName.trim() });
      message.success('Cập nhật họ tên thành công!');
      setIsEditing(false);
    } catch {
      // Error handled in hook/slice
    }
  };

  const getRoleBadge = () => {
    const r = user.role;
    if (r === ROLES.ADMIN || r === 'ADMIN') return <Tag color="red">Quản trị viên</Tag>;
    if (r === ROLES.MERCHANT || r === 'MERCHANT') return <Tag color="purple">Chủ quán / Nhà hàng</Tag>;
    if (r === ROLES.SHIPPER || r === 'SHIPPER' || r === 'DRIVER' || r === ROLES.DRIVER)
      return <Tag color="blue">Tài xế giao hàng</Tag>;
    return <Tag color="green">Khách hàng thân thiết</Tag>;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <Card className="rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6 p-2">
          <Avatar
            size={96}
            icon={<UserOutlined />}
            src={user.avatarUrl}
            className="bg-linear-to-tr from-orange-500 to-amber-500 shadow-md text-4xl"
          />
          <div className="text-center sm:text-left space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight !mb-0">
                {user.fullName || 'Người dùng'}
              </h2>
              {getRoleBadge()}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <PhoneOutlined /> {user.phone}
              </span>
              {user.ratingAvg && (
                <span className="flex items-center gap-1 font-bold text-amber-600">
                  <StarFilled /> {user.ratingAvg} / 5.0
                </span>
              )}
              {user.createdAt && (
                <span className="flex items-center gap-1">
                  <CalendarOutlined /> Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>
          </div>

          <Link to={APP_ROUTES.ADDRESSES}>
            <Button
              type="primary"
              icon={<EnvironmentOutlined />}
              className="bg-orange-500 hover:bg-orange-600 font-semibold rounded-xl"
            >
              Sổ địa chỉ
            </Button>
          </Link>
        </div>
      </Card>

      {/* Profile Details Edit Card */}
      <Card
        title={<span className="font-bold text-gray-800">Thông tin chi tiết tài khoản</span>}
        extra={
          !isEditing ? (
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                form.setFieldsValue({ fullName: user.fullName });
                setIsEditing(true);
              }}
              className="rounded-lg"
            >
              Chỉnh sửa
            </Button>
          ) : null
        }
        className="rounded-2xl border border-gray-100 shadow-2xs"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
          initialValues={{ fullName: user.fullName }}
          disabled={!isEditing}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              label={<span className="font-semibold text-gray-700">Họ và tên</span>}
              name="fullName"
              rules={[
                { required: true, message: 'Vui lòng nhập họ và tên!' },
                { min: 2, message: 'Tên quá ngắn!' },
              ]}
            >
              <Input className="rounded-xl" />
            </Form.Item>

            <Form.Item label={<span className="font-semibold text-gray-700">Số điện thoại</span>}>
              <Input value={user.phone} disabled className="rounded-xl bg-gray-100" />
            </Form.Item>

            <Form.Item label={<span className="font-semibold text-gray-700">Vai trò trong hệ thống</span>}>
              <Input
                value={user.role === 'CUSTOMER' ? 'Khách hàng (Đặt món)' : user.role}
                disabled
                className="rounded-xl bg-gray-100"
              />
            </Form.Item>

            <Form.Item label={<span className="font-semibold text-gray-700">Mã định danh (User ID)</span>}>
              <Input value={`#${user.id}`} disabled className="rounded-xl bg-gray-100 font-mono" />
            </Form.Item>
          </div>

          {isEditing && (
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
              <Button onClick={() => setIsEditing(false)} className="rounded-xl">
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                icon={<SaveOutlined />}
                className="bg-orange-500 hover:bg-orange-600 font-bold rounded-xl"
              >
                Lưu thông tin
              </Button>
            </div>
          )}
        </Form>
      </Card>
    </div>
  );
};
