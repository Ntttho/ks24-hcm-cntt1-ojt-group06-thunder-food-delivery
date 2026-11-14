import React from 'react';
import { Table, Button, Input, Select, Tag, Space, Popconfirm, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CarOutlined,
} from '@ant-design/icons';
import type { DriverApprovalItem } from '@/services/modules/adminApprovalApi';

interface DriverApprovalTabProps {
  driverApprovals: DriverApprovalItem[];
  loading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  onRefresh: () => void;
  onApprove: (userId: number) => void;
  onReject: (driver: DriverApprovalItem) => void;
}

export const DriverApprovalTab: React.FC<DriverApprovalTabProps> = ({
  driverApprovals,
  loading,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  onApprove,
  onReject,
}) => {
  const getStatusBadge = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return (
          <Tag color="success" icon={<CheckCircleOutlined />} className="font-semibold px-2.5 py-0.5 rounded-md">
            Đã duyệt
          </Tag>
        );
      case 'REJECTED':
        return (
          <Tag color="error" icon={<CloseCircleOutlined />} className="font-semibold px-2.5 py-0.5 rounded-md">
            Từ chối
          </Tag>
        );
      case 'PENDING':
      default:
        return (
          <Tag color="warning" icon={<ClockCircleOutlined />} className="font-semibold px-2.5 py-0.5 rounded-md">
            Chờ duyệt
          </Tag>
        );
    }
  };

  const filteredDrivers = driverApprovals.filter((item) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const uid = String(item.userId);
    const plate = (item.licensePlate || '').toLowerCase();
    const idCard = (item.idCardNumber || '').toLowerCase();
    const vType = (item.vehicleType || '').toLowerCase();
    return uid.includes(q) || plate.includes(q) || idCard.includes(q) || vType.includes(q);
  });

  const columns: ColumnsType<DriverApprovalItem> = [
    {
      title: 'Mã TX',
      dataIndex: 'userId',
      key: 'userId',
      width: 90,
      render: (uid) => <span className="font-mono text-slate-400 font-semibold text-xs">User #{uid}</span>,
    },
    {
      title: 'CCCD / CMND',
      dataIndex: 'idCardNumber',
      key: 'idCardNumber',
      width: 140,
      render: (idCard) => (
        <span className="font-mono font-bold text-slate-700 text-xs">
          {idCard || 'Chưa cập nhật'}
        </span>
      ),
    },
    {
      title: 'Biển số xe',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      width: 130,
      render: (plate) =>
        plate ? (
          <Tag color="blue" className="font-mono font-bold px-2 py-0.5 text-xs rounded-md">
            {plate}
          </Tag>
        ) : (
          <span className="text-slate-300 text-xs">-</span>
        ),
    },
    {
      title: 'Loại phương tiện',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
      render: (vType) => (
        <div className="flex items-center gap-1.5 text-slate-700 text-xs font-medium">
          <CarOutlined className="text-blue-500" />
          <span>{vType || 'Xe máy tiêu chuẩn'}</span>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 130,
      render: (status) => getStatusBadge(status),
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date) => (
        <span className="text-xs text-slate-500">
          {date ? new Date(date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Không rõ'}
        </span>
      ),
    },
    {
      title: 'Lý do từ chối',
      dataIndex: 'rejectReason',
      key: 'rejectReason',
      ellipsis: true,
      render: (reason) =>
        reason ? (
          <Tooltip title={reason}>
            <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 max-w-xs truncate inline-block">
              {reason}
            </span>
          </Tooltip>
        ) : (
          <span className="text-slate-300 text-xs">-</span>
        ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 170,
      fixed: 'right',
      render: (_, record) => (
        <Space size={6}>
          {record.approvalStatus === 'PENDING' && (
            <>
              <Popconfirm
                title="Phê duyệt hồ sơ tài xế?"
                description={`Xác nhận phê duyệt tài xế User #${record.userId} (Biển số: ${record.licensePlate || 'N/A'})?`}
                onConfirm={() => onApprove(record.userId)}
                okText="Phê duyệt"
                cancelText="Hủy"
                okButtonProps={{ className: 'bg-emerald-600 font-semibold' }}
              >
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold rounded-lg shadow-2xs border-none"
                >
                  Duyệt
                </Button>
              </Popconfirm>

              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => onReject(record)}
                className="text-xs font-semibold rounded-lg shadow-2xs"
              >
                Từ chối
              </Button>
            </>
          )}

          {record.approvalStatus !== 'PENDING' && (
            <span className="text-xs text-slate-400 italic">Đã xử lý</span>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <Input
            placeholder="Tìm theo mã TX, biển số, CCCD, loại xe..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
            className="w-full sm:w-72 rounded-lg"
          />
          <Select
            value={statusFilter}
            onChange={onStatusFilterChange}
            className="w-40"
            options={[
              { label: 'Tất cả trạng thái', value: 'ALL' },
              { label: 'Chờ duyệt', value: 'PENDING' },
              { label: 'Đã phê duyệt', value: 'APPROVED' },
              { label: 'Bị từ chối', value: 'REJECTED' },
            ]}
          />
        </div>
        <Button icon={<SyncOutlined spin={loading} />} onClick={onRefresh} className="rounded-lg font-semibold">
          Làm mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredDrivers}
        rowKey="id"
        loading={loading}
        scroll={{ x: 950 }}
        pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} tài xế` }}
        className="rounded-xl overflow-hidden"
      />
    </div>
  );
};

