import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Space, Popconfirm, Tooltip, Avatar } from 'antd';
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
import { maskPhoneNumber } from '@/utils/privacyMask';
import { userApi } from '@/services/modules/userApi';

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
  // Enrich driver basic info (fullName, phone, email) from auth-service if needed
  const [userInfoMap, setUserInfoMap] = useState<
    Record<number, { fullName?: string; phone?: string; email?: string }>
  >({});

  useEffect(() => {
    let mounted = true;
    const missingUserIds = driverApprovals
      .filter((d) => d.userId && !userInfoMap[d.userId] && (!d.fullName || !d.phoneNumber))
      .map((d) => d.userId);

    if (missingUserIds.length === 0) return;

    Promise.allSettled(
      missingUserIds.map((uid) =>
        userApi.getUserById(uid).then((res) => ({ uid, user: res?.data }))
      )
    ).then((results) => {
      if (!mounted) return;
      const nextMap: Record<number, { fullName?: string; phone?: string; email?: string }> = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value.user) {
          nextMap[r.value.uid] = {
            fullName: r.value.user.fullName,
            phone: r.value.user.phone,
            email: r.value.user.email,
          };
        }
      });
      if (Object.keys(nextMap).length > 0) {
        setUserInfoMap((prev) => ({ ...prev, ...nextMap }));
      }
    });

    return () => {
      mounted = false;
    };
  }, [driverApprovals, userInfoMap]);

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
    const u = userInfoMap[item.userId];
    const name = (item.fullName || u?.fullName || '').toLowerCase();
    const phone = (item.phoneNumber || u?.phone || '').toLowerCase();
    return (
      uid.includes(q) ||
      plate.includes(q) ||
      idCard.includes(q) ||
      vType.includes(q) ||
      name.includes(q) ||
      phone.includes(q)
    );
  });

  const columns: ColumnsType<DriverApprovalItem> = [
    {
      title: 'Mã TX',
      dataIndex: 'userId',
      key: 'userId',
      width: 80,
      render: (uid) => <span className="font-mono text-slate-400 font-semibold text-xs">#{uid}</span>,
    },
    {
      title: 'Tài xế',
      key: 'driverProfile',
      width: 220,
      render: (_, record) => {
        const u = userInfoMap[record.userId];
        const displayName = record.fullName || u?.fullName || `Tài xế #${record.userId}`;
        const phone = record.phoneNumber || u?.phone;
        const email = record.email || u?.email;

        return (
          <div className="flex items-center gap-2.5">
            <Avatar
              size={36}
              src={record.avatarUrl}
              icon={<CarOutlined />}
              className="bg-blue-100 text-blue-600 font-bold shrink-0"
            >
              {displayName.slice(0, 2).toUpperCase()}
            </Avatar>
            <div className="min-w-0">
              <div className="font-bold text-slate-800 text-xs truncate">
                {displayName}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {phone ? maskPhoneNumber(phone) : (email || 'Chưa cập nhật liên hệ')}
              </div>
            </div>
          </div>
        );
      },
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
      width: 160,
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
      width: 120,
      render: (status) => getStatusBadge(status),
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
      render: (_, record) => {
        const u = userInfoMap[record.userId];
        const driverName = record.fullName || u?.fullName || `Tài xế #${record.userId}`;
        return (
          <Space size={6}>
            {record.approvalStatus === 'PENDING' && (
              <>
                <Popconfirm
                  title="Phê duyệt hồ sơ tài xế?"
                  description={`Xác nhận phê duyệt tài xế ${driverName} (Biển số: ${record.licensePlate || 'N/A'})?`}
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
        );
      },
    },
  ];

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <Input
            placeholder="Tìm theo tên, SĐT, biển số, CCCD..."
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
        rowKey={(record) => record.userId}
        loading={loading}
        scroll={{ x: 1050 }}
        pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} tài xế` }}
        className="rounded-xl overflow-hidden"
      />
    </div>
  );
};
