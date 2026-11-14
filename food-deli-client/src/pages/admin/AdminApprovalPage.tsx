import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Tabs, Badge, message } from 'antd';
import { ShopOutlined, CarOutlined } from '@ant-design/icons';
import {
  adminApprovalApi,
  type RestaurantChangeRequestItem,
  type DriverApprovalItem,
} from '@/services/modules/adminApprovalApi';
import {
  RestaurantChangeRequestDetailModal,
  RejectReasonModal,
  ApprovalStatCards,
  RestaurantApprovalTab,
  DriverApprovalTab,
} from './components';

const { Title, Text } = Typography;

export const AdminApprovalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'restaurants' | 'drivers'>('restaurants');

  // Restaurant Change Requests states
  const [restaurantRequests, setRestaurantRequests] = useState<RestaurantChangeRequestItem[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState<boolean>(false);
  const [restaurantSearch, setRestaurantSearch] = useState<string>('');
  const [restaurantStatusFilter, setRestaurantStatusFilter] = useState<string>('ALL');

  // Driver Approvals states
  const [driverApprovals, setDriverApprovals] = useState<DriverApprovalItem[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState<boolean>(false);
  const [driverSearch, setDriverSearch] = useState<string>('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<string>('ALL');

  // Modals & Action states
  const [selectedRequest, setSelectedRequest] = useState<RestaurantChangeRequestItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectTarget, setRejectTarget] = useState<{
    type: 'restaurant' | 'driver';
    id: number;
    title: string;
  } | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState<boolean>(false);

  // Fetch restaurant requests
  const fetchRestaurantRequests = useCallback(async (status?: string) => {
    setLoadingRestaurants(true);
    try {
      const res = await adminApprovalApi.getRestaurantChangeRequests(status);
      if (res && res.data) {
        setRestaurantRequests(Array.isArray(res.data) ? res.data : []);
      } else {
        setRestaurantRequests([]);
      }
    } catch (err: any) {
      message.error(err?.message || 'Không thể tải danh sách yêu cầu quán ăn');
      setRestaurantRequests([]);
    } finally {
      setLoadingRestaurants(false);
    }
  }, []);

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
    fetchRestaurantRequests(restaurantStatusFilter);
    fetchDriverApprovals(driverStatusFilter);
  }, [fetchRestaurantRequests, fetchDriverApprovals, restaurantStatusFilter, driverStatusFilter]);

  // Handle Approve Restaurant Change Request
  const handleApproveRestaurant = async (id: number) => {
    try {
      await adminApprovalApi.approveRestaurantChangeRequest(id);
      message.success(`Đã phê duyệt yêu cầu quán ăn #${id} thành công!`);
      if (isDetailModalOpen) setIsDetailModalOpen(false);
      fetchRestaurantRequests(restaurantStatusFilter);
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Không thể phê duyệt yêu cầu');
    }
  };

  // Open Reject Modal for Restaurant
  const handleOpenRejectRestaurant = (req: RestaurantChangeRequestItem) => {
    const name = req.payloadData?.name || req.restaurantName || `Quán #${req.restaurantId}`;
    setRejectTarget({
      type: 'restaurant',
      id: req.id,
      title: `Từ chối yêu cầu của ${name}`,
    });
    setRejectModalOpen(true);
  };

  // Handle Approve Driver
  const handleApproveDriver = async (userId: number) => {
    try {
      await adminApprovalApi.approveDriver(userId);
      message.success(`Đã phê duyệt hồ sơ tài xế #${userId} thành công!`);
      fetchDriverApprovals(driverStatusFilter);
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Không thể phê duyệt tài xế');
    }
  };

  // Open Reject Modal for Driver
  const handleOpenRejectDriver = (driver: DriverApprovalItem) => {
    setRejectTarget({
      type: 'driver',
      id: driver.userId,
      title: `Từ chối hồ sơ tài xế #${driver.userId} (Biển số: ${driver.licensePlate || 'Chưa cập nhật'})`,
    });
    setRejectModalOpen(true);
  };

  // Submit Rejection
  const handleSubmitReject = async (reason: string) => {
    if (!rejectTarget) return;
    setActionSubmitting(true);
    try {
      if (rejectTarget.type === 'restaurant') {
        await adminApprovalApi.rejectRestaurantChangeRequest(rejectTarget.id, reason);
        message.success('Đã gửi phản hồi từ chối hồ sơ quán ăn thành công!');
        if (isDetailModalOpen) setIsDetailModalOpen(false);
        fetchRestaurantRequests(restaurantStatusFilter);
      } else {
        await adminApprovalApi.rejectDriver(rejectTarget.id, reason);
        message.success('Đã gửi phản hồi từ chối hồ sơ tài xế thành công!');
        fetchDriverApprovals(driverStatusFilter);
      }
      setRejectModalOpen(false);
      setRejectTarget(null);
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Không thể thực hiện từ chối');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Overview Counts
  const pendingRestaurantsCount = restaurantRequests.filter((r) => r.status === 'PENDING').length;
  const pendingDriversCount = driverApprovals.filter((d) => d.approvalStatus === 'PENDING').length;
  const approvedTotalCount =
    restaurantRequests.filter((r) => r.status === 'APPROVED').length +
    driverApprovals.filter((d) => d.approvalStatus === 'APPROVED').length;
  const rejectedTotalCount =
    restaurantRequests.filter((r) => r.status === 'REJECTED').length +
    driverApprovals.filter((d) => d.approvalStatus === 'REJECTED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 text-slate-800">
            Trung Tâm Phê Duyệt Hồ Sơ Đối Tác
          </Title>
          <Text className="text-slate-500 text-sm">
            Thẩm định &amp; phê duyệt hồ sơ cập nhật quán ăn, giấy phép kinh doanh và bằng lái đối tác tài xế mới.
          </Text>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <ApprovalStatCards
        pendingRestaurantsCount={pendingRestaurantsCount}
        pendingDriversCount={pendingDriversCount}
        approvedTotalCount={approvedTotalCount}
        rejectedTotalCount={rejectedTotalCount}
      />

      {/* Main Tabbed Card */}
      <Card className="rounded-2xl shadow-sm border-slate-200">
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as 'restaurants' | 'drivers')}
          className="font-semibold"
          items={[
            {
              key: 'restaurants',
              label: (
                <span className="flex items-center gap-1.5">
                  <ShopOutlined />
                  Hồ sơ Quán Ăn
                  {pendingRestaurantsCount > 0 && (
                    <Badge count={pendingRestaurantsCount} className="ml-1" />
                  )}
                </span>
              ),
              children: (
                <RestaurantApprovalTab
                  restaurantRequests={restaurantRequests}
                  loading={loadingRestaurants}
                  search={restaurantSearch}
                  onSearchChange={setRestaurantSearch}
                  statusFilter={restaurantStatusFilter}
                  onStatusFilterChange={setRestaurantStatusFilter}
                  onRefresh={() => fetchRestaurantRequests(restaurantStatusFilter)}
                  onViewDetail={(req) => {
                    setSelectedRequest(req);
                    setIsDetailModalOpen(true);
                  }}
                  onApprove={handleApproveRestaurant}
                  onReject={handleOpenRejectRestaurant}
                />
              ),
            },
            {
              key: 'drivers',
              label: (
                <span className="flex items-center gap-1.5">
                  <CarOutlined />
                  Hồ sơ Tài Xế Mới
                  {pendingDriversCount > 0 && (
                    <Badge count={pendingDriversCount} className="ml-1" />
                  )}
                </span>
              ),
              children: (
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
              ),
            },
          ]}
        />
      </Card>

      {/* Detail Modal for Restaurant Change Request */}
      <RestaurantChangeRequestDetailModal
        open={isDetailModalOpen}
        request={selectedRequest}
        onClose={() => setIsDetailModalOpen(false)}
        onApprove={handleApproveRestaurant}
        onReject={handleOpenRejectRestaurant}
      />

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

export default AdminApprovalPage;
