import React from 'react';
import { Row, Col, Card } from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

interface UserStatCardsProps {
  totalElements: number;
  showingCount: number;
  page: number;
  pageSize: number;
  selectedRole: string | null;
  selectedStatus: string | null;
}

export const UserStatCards: React.FC<UserStatCardsProps> = ({
  totalElements,
  showingCount,
  page,
  pageSize,
  selectedRole,
  selectedStatus,
}) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={12} sm={6}>
        <Card className="rounded-2xl border-slate-200 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Tổng người dùng</span>
            <TeamOutlined className="text-slate-400 text-sm" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">{totalElements}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tất cả tài khoản hệ thống</div>
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card className="rounded-2xl border-slate-200 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Bộ lọc trạng thái</span>
            <CheckCircleOutlined className="text-emerald-500 text-sm" />
          </div>
          <div className="text-xl font-black text-emerald-600 mt-1 truncate">
            {selectedStatus ? (selectedStatus === 'ACTIVE' ? 'Đang hoạt động' : selectedStatus) : 'Tất cả trạng thái'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">ACTIVE, LOCKED, DELETED</div>
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card className="rounded-2xl border-slate-200 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Đang hiển thị</span>
            <EyeOutlined className="text-blue-500 text-sm" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">{showingCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Trang {page + 1} ({pageSize} người dùng/trang)
          </div>
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card className="rounded-2xl border-slate-200 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Phân quyền vai trò</span>
            <SafetyCertificateOutlined className="text-orange-500 text-sm" />
          </div>
          <div className="text-xl font-black text-orange-500 mt-1 truncate">
            {selectedRole ? selectedRole : 'Tất cả vai trò'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            CUSTOMER, MERCHANT, DRIVER, ADMIN
          </div>
        </Card>
      </Col>
    </Row>
  );
};
