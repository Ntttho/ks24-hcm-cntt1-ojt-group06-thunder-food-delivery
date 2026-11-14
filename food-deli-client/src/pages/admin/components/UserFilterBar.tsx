import React from 'react';
import { Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface UserFilterBarProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  selectedRole: string | null;
  onRoleChange: (role: string | null) => void;
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  currentPage: number;
  showingCount: number;
  totalElements: number;
}

export const UserFilterBar: React.FC<UserFilterBarProps> = ({
  searchText,
  onSearchChange,
  selectedRole,
  onRoleChange,
  selectedStatus,
  onStatusChange,
  currentPage,
  showingCount,
  totalElements,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 flex-wrap">
        <Input
          placeholder="Tìm theo họ tên, số điện thoại hoặc email..."
          prefix={<SearchOutlined className="text-slate-400" />}
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
          className="w-full sm:w-80 rounded-lg"
        />
        <Select
          placeholder="Lọc theo vai trò"
          value={selectedRole}
          onChange={(val) => onRoleChange(val)}
          allowClear
          className="w-full sm:w-52"
          options={[
            { label: 'Tất cả vai trò', value: null as any },
            { label: 'Khách hàng (CUSTOMER)', value: 'CUSTOMER' },
            { label: 'Quán ăn (MERCHANT)', value: 'MERCHANT' },
            { label: 'Tài xế (DRIVER)', value: 'DRIVER' },
            { label: 'Quản trị viên (ADMIN)', value: 'ADMIN' },
          ]}
        />
        <Select
          placeholder="Lọc theo trạng thái"
          value={selectedStatus}
          onChange={(val) => onStatusChange(val)}
          allowClear
          className="w-full sm:w-48"
          options={[
            { label: 'Tất cả trạng thái', value: null as any },
            { label: 'Đang hoạt động (ACTIVE)', value: 'ACTIVE' },
            { label: 'Bị khóa (LOCKED)', value: 'LOCKED' },
          ]}
        />
      </div>
      <span className="text-xs text-slate-500 font-medium">
        Trang {currentPage} &bull; Hiển thị <strong>{showingCount}</strong> / Tổng {totalElements} người dùng
      </span>
    </div>
  );
};

