import React from 'react';
import { Table, Button, Tag, Rate, Space, Popconfirm, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SafetyCertificateOutlined,
  ShopOutlined,
  CarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StopOutlined,
  MailOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { User } from '@/types/auth.types';

interface UserDataTableProps {
  users: User[];
  loading: boolean;
  page: number;
  pageSize: number;
  totalElements: number;
  onPageChange: (newPage: number, newPageSize: number) => void;
  onEditUser: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onDeleteUser: (user: User) => void;
  isUserAdmin: (user?: User | null) => boolean;
}

export const UserDataTable: React.FC<UserDataTableProps> = ({
  users,
  loading,
  page,
  pageSize,
  totalElements,
  onPageChange,
  onEditUser,
  onToggleStatus,
  onDeleteUser,
  isUserAdmin,
}) => {
  const getRoleBadge = (roleName: string) => {
    const r = roleName.toUpperCase();
    if (r.includes('ADMIN')) {
      return (
        <Tag color="purple" icon={<SafetyCertificateOutlined />} className="font-semibold px-2 py-0.5 rounded-md">
          ADMIN
        </Tag>
      );
    }
    if (r.includes('MERCHANT')) {
      return (
        <Tag color="orange" icon={<ShopOutlined />} className="font-semibold px-2 py-0.5 rounded-md">
          QUÁN ĂN
        </Tag>
      );
    }
    if (r.includes('DRIVER') || r.includes('SHIPPER')) {
      return (
        <Tag color="green" icon={<CarOutlined />} className="font-semibold px-2 py-0.5 rounded-md">
          TÀI XẾ
        </Tag>
      );
    }
    return (
      <Tag color="blue" icon={<UserOutlined />} className="font-semibold px-2 py-0.5 rounded-md">
        KHÁCH HÀNG
      </Tag>
    );
  };

  const getStatusBadge = (status?: string) => {
    const isLocked = status?.toUpperCase() === 'LOCKED';
    if (isLocked) {
      return (
        <Tag color="error" icon={<StopOutlined />} className="font-semibold px-2.5 py-0.5 rounded-md">
          Bị khóa
        </Tag>
      );
    }
    return (
      <Tag color="success" icon={<CheckCircleOutlined />} className="font-semibold px-2.5 py-0.5 rounded-md">
        Hoạt động
      </Tag>
    );
  };

  const userColumns: ColumnsType<User> = [
    {
      title: 'Mã ID',
      dataIndex: 'id',
      key: 'id',
      width: 75,
      render: (id) => <span className="text-slate-400 font-mono text-xs font-semibold">#{id}</span>,
    },
    {
      title: 'Họ và tên & Liên hệ',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name, record) => (
        <div>
          <div className="font-bold text-slate-800 text-sm">{name || 'Chưa cập nhật'}</div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-slate-400 mt-0.5">
            <span className="font-mono text-slate-600">{record.phone || record.phoneNumber}</span>
            {record.email && (
              <span className="flex items-center gap-1 text-slate-500">
                <MailOutlined className="text-[11px]" />
                {record.email}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Vai trò (Role)',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role, record) => {
        if (record.roles && record.roles.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {record.roles.map((r) => (
                <span key={r}>{getRoleBadge(r)}</span>
              ))}
            </div>
          );
        }
        return getRoleBadge(role || 'CUSTOMER');
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => getStatusBadge(status),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'ratingAvg',
      key: 'ratingAvg',
      width: 130,
      render: (rating) => (
        <div className="flex items-center gap-1">
          <Rate disabled defaultValue={rating || 5} count={5} className="text-xs text-amber-400" />
          <span className="text-xs font-bold text-slate-600">{rating ? Number(rating).toFixed(1) : '5.0'}</span>
        </div>
      ),
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => (
        <span className="text-xs text-slate-500 font-medium">
          {date ? new Date(date).toLocaleDateString('vi-VN') : 'Mới tạo'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        if (isUserAdmin(record)) {
          return (
            <Tooltip title="Tài khoản Quản trị viên được bảo vệ hệ thống: Không cho phép chỉnh sửa, khóa hoặc xóa">
              <Tag
                color="cyan"
                icon={<SafetyCertificateOutlined />}
                className="px-2.5 py-1 font-semibold text-xs rounded-lg m-0 border border-cyan-200 bg-cyan-50 text-cyan-700 flex items-center gap-1 w-fit cursor-default"
              >
                Bảo vệ hệ thống
              </Tag>
            </Tooltip>
          );
        }

        const isLocked = record.status?.toUpperCase() === 'LOCKED';
        return (
          <Space size={4}>
            {/* Chỉnh sửa */}
            <Tooltip title="Chỉnh sửa thông tin & vai trò">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined className="text-blue-600" />}
                onClick={() => onEditUser(record)}
                className="hover:bg-blue-50"
              />
            </Tooltip>

            {/* Khóa / Mở khóa */}
            <Popconfirm
              title={isLocked ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
              description={
                isLocked
                  ? `Bạn có chắc chắn muốn mở khóa cho tài khoản "${record.fullName}"?`
                  : `Bạn có chắc chắn muốn khóa tài khoản "${record.fullName}"? Người dùng này sẽ không thể đăng nhập.`
              }
              onConfirm={() => onToggleStatus(record)}
              okText={isLocked ? 'Mở khóa' : 'Khóa'}
              cancelText="Hủy"
              okButtonProps={{ danger: !isLocked }}
            >
              <Tooltip title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}>
                <Button
                  type="text"
                  size="small"
                  icon={
                    isLocked ? (
                      <UnlockOutlined className="text-emerald-600" />
                    ) : (
                      <LockOutlined className="text-amber-500" />
                    )
                  }
                  className={isLocked ? 'hover:bg-emerald-50' : 'hover:bg-amber-50'}
                />
              </Tooltip>
            </Popconfirm>

            {/* Xóa tài khoản */}
            <Popconfirm
              title="Xóa / Vô hiệu hóa tài khoản vĩnh viễn?"
              description={`Thao tác này sẽ vô hiệu hóa hoàn toàn người dùng "${record.fullName}" khỏi hệ thống.`}
              onConfirm={() => onDeleteUser(record)}
              okText="Xóa tài khoản"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Xóa người dùng">
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined className="text-red-500" />}
                  className="hover:bg-red-50"
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      columns={userColumns}
      dataSource={users}
      rowKey="id"
      loading={loading}
      scroll={{ x: 950 }}
      pagination={{
        current: page + 1,
        pageSize,
        total: totalElements,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
        showTotal: (total) => `Tổng cộng ${total} người dùng`,
        onChange: onPageChange,
      }}
      className="rounded-xl overflow-hidden"
    />
  );
};

