import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import {
  ClockCircleOutlined,
  FireOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';

interface MerchantStatsProps {
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const MerchantStats: React.FC<MerchantStatsProps> = ({
  pendingCount,
  confirmedCount,
  completedCount,
  cancelledCount,
  activeTab,
  onSelectTab,
}) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={12} sm={6}>
        <Card
          className={`rounded-2xl border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/60 shadow-xs cursor-pointer transition-all ${
            activeTab === 'PENDING' ? 'ring-2 ring-amber-400' : ''
          }`}
          onClick={() => onSelectTab('PENDING')}
        >
          <Statistic
            title={<span className="text-xs font-semibold text-amber-800">Đơn Mới Chờ Nhận</span>}
            value={pendingCount}
            valueStyle={{ color: '#d97706', fontWeight: 800 }}
            prefix={<ClockCircleOutlined className="text-amber-500 mr-1" />}
            suffix={
              pendingCount > 0 ? (
                <span className="relative flex h-2.5 w-2.5 ml-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              ) : null
            }
          />
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card
          className={`rounded-2xl border-blue-200/80 bg-gradient-to-br from-blue-50 to-indigo-50/60 shadow-xs cursor-pointer transition-all ${
            activeTab === 'CONFIRMED' ? 'ring-2 ring-blue-400' : ''
          }`}
          onClick={() => onSelectTab('CONFIRMED')}
        >
          <Statistic
            title={<span className="text-xs font-semibold text-blue-800">Đang Nấu Chuẩn Bị</span>}
            value={confirmedCount}
            valueStyle={{ color: '#2563eb', fontWeight: 800 }}
            prefix={<FireOutlined className="text-blue-500 mr-1" />}
          />
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card
          className={`rounded-2xl border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50/60 shadow-xs cursor-pointer transition-all ${
            activeTab === 'COMPLETED' ? 'ring-2 ring-emerald-400' : ''
          }`}
          onClick={() => onSelectTab('COMPLETED')}
        >
          <Statistic
            title={<span className="text-xs font-semibold text-emerald-800">Đã Hoàn Thành</span>}
            value={completedCount}
            valueStyle={{ color: '#059669', fontWeight: 800 }}
            prefix={<CheckCircleOutlined className="text-emerald-500 mr-1" />}
          />
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card
          className={`rounded-2xl border-rose-200/80 bg-gradient-to-br from-rose-50 to-red-50/60 shadow-xs cursor-pointer transition-all ${
            activeTab === 'CANCELLED' ? 'ring-2 ring-rose-400' : ''
          }`}
          onClick={() => onSelectTab('CANCELLED')}
        >
          <Statistic
            title={<span className="text-xs font-semibold text-rose-800">Đã Hủy / Từ Chối</span>}
            value={cancelledCount}
            valueStyle={{ color: '#e11d48', fontWeight: 800 }}
            prefix={<CloseCircleOutlined className="text-rose-500 mr-1" />}
          />
        </Card>
      </Col>
    </Row>
  );
};
