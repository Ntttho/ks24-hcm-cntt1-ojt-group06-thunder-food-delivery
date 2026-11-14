import React from 'react';
import { Table, Button, Input, Select, Tag, Space, Popconfirm, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  SyncOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { RestaurantChangeRequestItem } from '@/services/modules/adminApprovalApi';

interface RestaurantApprovalTabProps {
  restaurantRequests: RestaurantChangeRequestItem[];
  loading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  onRefresh: () => void;
  onViewDetail: (req: RestaurantChangeRequestItem) => void;
  onApprove: (id: number) => void;
  onReject: (req: RestaurantChangeRequestItem) => void;
}

export const RestaurantApprovalTab: React.FC<RestaurantApprovalTabProps> = ({
  restaurantRequests,
  loading,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  onViewDetail,
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

  const filteredRequests = restaurantRequests.filter((item) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const name = (item.payloadData?.name || item.restaurantName || '').toLowerCase();
    const address = (item.payloadData?.address || '').toLowerCase();
    const idStr = String(item.id);
    const shopIdStr = String(item.restaurantId);
    return name.includes(q) || address.includes(q) || idStr.includes(q) || shopIdStr.includes(q);
  });

  const columns: ColumnsType<RestaurantChangeRequestItem> = [
    {
      title: 'Mã YC',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id) => <span className="font-mono text-slate-400 font-semibold text-xs">#{id}</span>,
    },
    {
      title: 'Quán ăn & Địa chỉ',
      key: 'shopInfo',
      render: (_, record) => {
        const payload = record.payloadData || {};
        const name = payload.name || record.restaurantName || `Quán ăn #${record.restaurantId}`;
        const address = payload.address;
        return (
          <div>
            <div className="font-bold text-slate-800 text-sm">{name}</div>
            {address && (
              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <EnvironmentOutlined className="text-orange-500 text-[11px]" />
                <span className="truncate max-w-xs">{address}</span>
              </div>
            )}
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Mã Quán: #{record.restaurantId} &bull; Chủ quán: User #{record.requestedBy}
            </div>
          </div>
        );
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
      title: 'Ngày gửi',
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
      title: 'Phản hồi từ chối',
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
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Xem chi tiết nội dung thay đổi &amp; GPKD">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewDetail(record)}
              className="text-xs font-semibold rounded-lg hover:border-orange-500 hover:text-orange-500"
            >
              Chi tiết
            </Button>
          </Tooltip>

          {record.status === 'PENDING' && (
            <>
              <Popconfirm
                title="Phê duyệt cập nhật quán ăn?"
                description={`Xác nhận phê duyệt các thay đổi cho "${record.payloadData?.name || record.restaurantName || record.restaurantId}"?`}
                onConfirm={() => onApprove(record.id)}
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
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <Input
            placeholder="Tìm theo tên quán, địa chỉ, ID..."
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
        dataSource={filteredRequests}
        rowKey="id"
        loading={loading}
        scroll={{ x: 900 }}
        pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} yêu cầu` }}
        className="rounded-xl overflow-hidden"
      />
    </div>
  );
};

