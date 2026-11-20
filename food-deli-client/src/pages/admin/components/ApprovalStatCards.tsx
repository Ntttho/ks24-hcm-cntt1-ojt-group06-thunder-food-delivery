import React from 'react';
import { Row, Col, Card } from 'antd';
import {
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';

interface ApprovalStatCardsProps {
  pendingRestaurantsCount?: number;
  pendingDriversCount: number;
  approvedTotalCount: number;
  rejectedTotalCount: number;
  totalDriversCount?: number;
}

export const ApprovalStatCards: React.FC<ApprovalStatCardsProps> = ({
  pendingDriversCount,
  approvedTotalCount,
  rejectedTotalCount,
  totalDriversCount,
}) => {
  const total = totalDriversCount ?? (pendingDriversCount + approvedTotalCount + rejectedTotalCount);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={12} sm={6}>
        <Card className="rounded-2xl border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Chờ Thẩm Định</span>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">{pendingDriversCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
            <ClockCircleOutlined className="text-blue-500" /> Bằng lái &amp; Xe máy
          </div>
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card className="rounded-2xl border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="text-xs text-slate-500 font-semibold uppercase">Đã Phê Duyệt</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{approvedTotalCount}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5 flex items-center gap-1">
            <SafetyCertificateOutlined /> Đang hoạt động trên app
          </div>
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card className="rounded-2xl border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="text-xs text-slate-500 font-semibold uppercase">Hồ Sơ Từ Chối</div>
          <div className="text-2xl font-black text-rose-500 mt-1">{rejectedTotalCount}</div>
          <div className="text-[11px] text-rose-500/80 mt-0.5 flex items-center gap-1">
            <CloseCircleOutlined /> Không đủ điều kiện
          </div>
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card className="rounded-2xl border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="text-xs text-slate-500 font-semibold uppercase">Tổng Hồ Sơ Tài Xế</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
            <SafetyCertificateOutlined className="text-slate-400" /> Toàn hệ thống
          </div>
        </Card>
      </Col>
    </Row>
  );
};

