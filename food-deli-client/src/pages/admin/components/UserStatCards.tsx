import React from 'react';
import { Row, Col, Card } from 'antd';

interface UserStatCardsProps {
  totalElements: number;
  pendingApprovalsCount: number;
  showingCount: number;
  page: number;
  pageSize: number;
  selectedRole: string | null;
}

export const UserStatCards: React.FC<UserStatCardsProps> = ({
  totalElements,
  pendingApprovalsCount,
  showingCount,
  page,
  pageSize,
  selectedRole,
}) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={12} sm={6}>
        <Card className="rounded-2xl border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Tổng người dùng</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{totalElements}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tất cả tài khoản hệ thống</div>
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card className="rounded-2xl border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Hồ sơ chờ duyệt</div>
          <div className="text-2xl font-black text-amber-500 mt-1">{pendingApprovalsCount}</div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Quán &amp; Tài xế mới</div>
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card className="rounded-2xl border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Đang hiển thị</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{showingCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Trang {page + 1} ({pageSize}/trang)
          </div>
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card className="rounded-2xl border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Phân quyền Vai trò</div>
          <div className="text-2xl font-black text-orange-500 mt-1">
            {selectedRole ? selectedRole : 'Đa vai trò'}
          </div>
          <div className="text-[11px] text-orange-500/80 mt-0.5">
            CUSTOMER, MERCHANT, DRIVER, ADMIN
          </div>
        </Card>
      </Col>
    </Row>
  );
};

