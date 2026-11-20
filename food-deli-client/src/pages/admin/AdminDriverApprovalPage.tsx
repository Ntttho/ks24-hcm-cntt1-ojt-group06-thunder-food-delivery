import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, message } from 'antd';
import { CarOutlined } from '@ant-design/icons';
import {
  adminApprovalApi,
  type DriverApprovalItem,
} from '@/services/modules/adminApprovalApi';
import {
  RejectReasonModal,
  ApprovalStatCards,
  DriverApprovalTab,
} from './components';

const { Title, Text } = Typography;

export const AdminDriverApprovalPage: React.FC = () => {
  // Driver Approvals states
  const [driverApprovals, setDriverApprovals] = useState<DriverApprovalItem[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState<boolean>(false);
  const [driverSearch, setDriverSearch] = useState<string>('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<string>('ALL');

  // Reject Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectTarget, setRejectTarget] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState<boolean>(false);

  // Fetch driver approvals
  const fetchDriverApprovals = useCallback(async (status?: string) => {
    setLoadingDrivers(true);
    try {
      const res = await adminApprovalApi.getDriverApprovals(status);
      if (res && res.data) {
        setDriverApprovals(Array.isArray(res.data) ? res.data : []);
      } else {
        setDriverApprovals([]);
      }
    } catch (err: any) {
      message.error(err?.message || 'Không thể tải danh sách hồ sơ tài xế');
      setDriverApprovals([]);
    } finally {
      setLoadingDrivers(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDriverApprovals(driverStatusFilter);
  }, [fetchDriverApprovals, driverStatusFilter]);

  // Handle Approve Driver
  const handleApproveDriver = async (userId: number) => {
    try {
      await adminApprovalApi.approveDriver(userId);
      message.success('Đã phê duyệt hồ sơ tài xế thành công!');
      fetchDriverApprovals(driverStatusFilter);
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Không thể phê duyệt tài xế');
    }
  };

  // Open Reject Modal for Driver
  const handleOpenRejectDriver = (driver: DriverApprovalItem) => {
    setRejectTarget({
      id: driver.userId,
      title: `Từ chối hồ sơ tài xế ${driver.fullName || 'đối tác'} (Biển số: ${driver.licensePlate || 'Chưa cập nhật'})`,
    });
    setRejectModalOpen(true);
  };

  // Submit Rejection
  const handleSubmitReject = async (reason: string) => {
    if (!rejectTarget) return;
    setActionSubmitting(true);
    try {
      await adminApprovalApi.rejectDriver(rejectTarget.id, reason);
      message.success('Đã gửi phản hồi từ chối hồ sơ tài xế thành công!');
      fetchDriverApprovals(driverStatusFilter);
      setRejectModalOpen(false);
      setRejectTarget(null);
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Không thể thực hiện từ chối');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Overview Counts
  const pendingDriversCount = driverApprovals.filter((d) => d.approvalStatus === 'PENDING').length;
  const approvedDriversCount = driverApprovals.filter((d) => d.approvalStatus === 'APPROVED').length;
  const rejectedDriversCount = driverApprovals.filter((d) => d.approvalStatus === 'REJECTED').length;
  const totalDriversCount = driverApprovals.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 text-slate-800 flex items-center gap-2">
            <CarOutlined className="text-blue-600" /> Kiểm Duyệt &amp; Thẩm Định Hồ Sơ Tài Xế
          </Title>
          <Text className="text-slate-500 text-sm">
            Thẩm định thông tin giấy phép lái xe, căn cước công dân, biển số và phê duyệt đối tác tài xế mới gia nhập nền tảng.
          </Text>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <ApprovalStatCards
        pendingDriversCount={pendingDriversCount}
        approvedTotalCount={approvedDriversCount}
        rejectedTotalCount={rejectedDriversCount}
        totalDriversCount={totalDriversCount}
      />

      {/* Main Content Card (Direct Table, no tabs) */}
      <Card className="rounded-2xl shadow-sm border-slate-200">
        <DriverApprovalTab
          driverApprovals={driverApprovals}
          loading={loadingDrivers}
          search={driverSearch}
          onSearchChange={setDriverSearch}
          statusFilter={driverStatusFilter}
          onStatusFilterChange={setDriverStatusFilter}
          onRefresh={() => fetchDriverApprovals(driverStatusFilter)}
          onApprove={handleApproveDriver}
          onReject={handleOpenRejectDriver}
        />
      </Card>

      {/* Reject Reason Input Modal */}
      <RejectReasonModal
        open={rejectModalOpen}
        title={rejectTarget?.title || 'Từ chối hồ sơ'}
        submitting={actionSubmitting}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectTarget(null);
        }}
        onSubmit={handleSubmitReject}
      />
    </div>
  );
};

export default AdminDriverApprovalPage;
