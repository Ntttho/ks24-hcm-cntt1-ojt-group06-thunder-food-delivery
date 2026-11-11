import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Typography,
  Row,
  Col,
  Space,
  Popconfirm,
  Tooltip,
  Tabs,
  Badge,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  SyncOutlined,
  ShopOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import {
  adminApprovalApi,
  type RestaurantChangeRequestItem,
  type DriverApprovalItem,
} from '@/services/modules/adminApprovalApi';
import {
  RestaurantChangeRequestDetailModal,
  RejectReasonModal,
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

  // Filtered Restaurant Requests
  const filteredRestaurants = restaurantRequests.filter((item) => {
    const q = restaurantSearch.toLowerCase().trim();
    if (!q) return true;
    const name = (item.payloadData?.name || item.restaurantName || '').toLowerCase();
    const address = (item.payloadData?.address || '').toLowerCase();
    const idStr = String(item.id);
    const shopIdStr = String(item.restaurantId);
    return name.includes(q) || address.includes(q) || idStr.includes(q) || shopIdStr.includes(q);
  });

  // Filtered Driver Approvals
  const filteredDrivers = driverApprovals.filter((item) => {
    const q = driverSearch.toLowerCase().trim();
    if (!q) return true;
    const uid = String(item.userId);
    const plate = (item.licensePlate || '').toLowerCase();
    const idCard = (item.idCardNumber || '').toLowerCase();
    const vType = (item.vehicleType || '').toLowerCase();
    return uid.includes(q) || plate.includes(q) || idCard.includes(q) || vType.includes(q);
  });

  // Overview Counts
  const pendingRestaurantsCount = restaurantRequests.filter((r) => r.status === 'PENDING').length;
  const pendingDriversCount = driverApprovals.filter((d) => d.approvalStatus === 'PENDING').length;
  const approvedTotalCount =
    restaurantRequests.filter((r) => r.status === 'APPROVED').length +
    driverApprovals.filter((d) => d.approvalStatus === 'APPROVED').length;
  const rejectedTotalCount =
    restaurantRequests.filter((r) => r.status === 'REJECTED').length +
    driverApprovals.filter((d) => d.approvalStatus === 'REJECTED').length;

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

  // Restaurant Table Columns
  const restaurantColumns: ColumnsType<RestaurantChangeRequestItem> = [
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
      width: 180,
      fixed: 'right',
      render: (_, record) => {
        const isPending = record.status === 'PENDING';
        return (
          <Space size={6}>
            <Tooltip title="Xem chi tiết hồ sơ">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined className="text-blue-600" />}
                onClick={() => {
                  setSelectedRequest(record);
                  setIsDetailModalOpen(true);
                }}
                className="hover:bg-blue-50"
              />
            </Tooltip>

            {isPending && (
              <>
                <Popconfirm
                  title="Phê duyệt hồ sơ quán ăn?"
                  description={`Xác nhận phê duyệt cho quán "${record.payloadData?.name || record.restaurantName || ''}"? Quán sẽ được phép mở bán trên sàn.`}
                  onConfirm={() => handleApproveRestaurant(record.id)}
                  okText="Phê duyệt"
                  cancelText="Hủy"
                  okButtonProps={{ className: 'bg-emerald-600 hover:bg-emerald-700' }}
                >
                  <Tooltip title="Phê duyệt (APPROVED)">
                    <Button
                      type="text"
                      size="small"
                      icon={<CheckCircleOutlined className="text-emerald-600 text-sm" />}
                      className="hover:bg-emerald-50"
                    />
                  </Tooltip>
                </Popconfirm>

                <Tooltip title="Từ chối (REJECTED)">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<CloseCircleOutlined className="text-sm" />}
                    onClick={() => handleOpenRejectRestaurant(record)}
                    className="hover:bg-rose-50"
                  />
                </Tooltip>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  // Driver Table Columns
  const driverColumns: ColumnsType<DriverApprovalItem> = [
    {
      title: 'Mã Tài Xế',
      dataIndex: 'userId',
      key: 'userId',
      width: 110,
      render: (uid) => <span className="font-mono text-slate-700 font-bold text-xs">User #{uid}</span>,
    },
    {
      title: 'Biển số xe',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      width: 150,
      render: (plate) => (
        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {plate || 'Chưa cập nhật'}
        </span>
      ),
    },
    {
      title: 'Số CCCD / CMND',
      dataIndex: 'idCardNumber',
      key: 'idCardNumber',
      width: 160,
      render: (idCard) => <span className="font-mono text-slate-600 text-xs">{idCard || 'Chưa cung cấp'}</span>,
    },
    {
      title: 'Loại phương tiện',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
      width: 150,
      render: (type) => (
        <Tag color="cyan" icon={<CarOutlined />}>
          {type || 'Xe máy'}
        </Tag>
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
      width: 140,
      fixed: 'right',
      render: (_, record) => {
        const isPending = record.approvalStatus === 'PENDING';
        return (
          <Space size={6}>
            {isPending ? (
              <>
                <Popconfirm
                  title="Phê duyệt hồ sơ tài xế?"
                  description={`Xác nhận phê duyệt cho tài xế #${record.userId}? Tài xế sẽ được phép nhận cuốc giao hàng.`}
                  onConfirm={() => handleApproveDriver(record.userId)}
                  okText="Phê duyệt"
                  cancelText="Hủy"
                  okButtonProps={{ className: 'bg-emerald-600 hover:bg-emerald-700' }}
                >
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    className="bg-emerald-600 hover:bg-emerald-700 border-none font-medium text-xs rounded-md"
                  >
                    Duyệt
                  </Button>
                </Popconfirm>

                <Button
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleOpenRejectDriver(record)}
                  className="font-medium text-xs rounded-md"
                >
                  Từ chối
                </Button>
              </>
            ) : (
              <span className="text-xs text-slate-400 italic">Đã xử lý</span>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 text-slate-800 flex items-center gap-2">
            <SafetyCertificateOutlined className="text-orange-500" />
            Cổng Phê Duyệt Hồ Sơ Toàn Sàn
          </Title>
          <Text className="text-slate-500 text-sm">
            Kiểm duyệt hồ sơ đăng ký quán ăn mới (restaurant_change_requests) và hồ sơ tài xế mới xin gia nhập sàn (driver_details).
          </Text>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            icon={<SyncOutlined spin={loadingRestaurants || loadingDrivers} />}
            onClick={() => {
              fetchRestaurantRequests(restaurantStatusFilter);
              fetchDriverApprovals(driverStatusFilter);
            }}
            className="rounded-lg hover:border-orange-500 hover:text-orange-500"
          >
            Làm mới dữ liệu
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
            <div className="text-xs text-amber-600 font-semibold uppercase flex items-center gap-1.5">
              <ShopOutlined /> Quán ăn chờ duyệt
            </div>
            <div className="text-3xl font-black text-amber-600 mt-1">{pendingRestaurantsCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Yêu cầu mở quán & thay đổi</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
            <div className="text-xs text-blue-600 font-semibold uppercase flex items-center gap-1.5">
              <CarOutlined /> Tài xế chờ duyệt
            </div>
            <div className="text-3xl font-black text-blue-600 mt-1">{pendingDriversCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Hồ sơ phương tiện & CCCD</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
            <div className="text-xs text-emerald-600 font-semibold uppercase flex items-center gap-1.5">
              <CheckCircleOutlined /> Đã phê duyệt
            </div>
            <div className="text-3xl font-black text-emerald-600 mt-1">{approvedTotalCount}</div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">Tổng đối tác đã gia nhập</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
            <div className="text-xs text-rose-500 font-semibold uppercase flex items-center gap-1.5">
              <CloseCircleOutlined /> Đã từ chối
            </div>
            <div className="text-3xl font-black text-rose-600 mt-1">{rejectedTotalCount}</div>
            <div className="text-[11px] text-rose-600/80 mt-0.5">Hồ sơ không đạt chuẩn sàn</div>
          </Card>
        </Col>
      </Row>

      {/* Main Tabs Card */}
      <Card className="rounded-2xl shadow-sm border-slate-200">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as any)}
          type="line"
          size="large"
          items={[
            {
              key: 'restaurants',
              label: (
                <div className="flex items-center gap-2">
                  <ShopOutlined />
                  <span className="font-semibold">Quán ăn & Yêu cầu thay đổi</span>
                  {pendingRestaurantsCount > 0 && (
                    <Badge count={pendingRestaurantsCount} overflowCount={99} className="ml-1" />
                  )}
                </div>
              ),
              children: (
                <div className="space-y-4 pt-2">
                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                      <Input
                        placeholder="Tìm theo tên quán, địa chỉ, mã ID..."
                        prefix={<SearchOutlined className="text-slate-400" />}
                        value={restaurantSearch}
                        onChange={(e) => setRestaurantSearch(e.target.value)}
                        allowClear
                        className="w-full sm:w-80 rounded-lg"
                      />
                      <Select
                        value={restaurantStatusFilter}
                        onChange={(val) => {
                          setRestaurantStatusFilter(val);
                          fetchRestaurantRequests(val);
                        }}
                        className="w-full sm:w-48"
                        options={[
                          { label: 'Tất cả trạng thái', value: 'ALL' },
                          { label: 'Chờ duyệt (PENDING)', value: 'PENDING' },
                          { label: 'Đã duyệt (APPROVED)', value: 'APPROVED' },
                          { label: 'Từ chối (REJECTED)', value: 'REJECTED' },
                        ]}
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      Hiển thị <strong>{filteredRestaurants.length}</strong> yêu cầu
                    </span>
                  </div>

                  {/* Table */}
                  <Table
                    columns={restaurantColumns}
                    dataSource={filteredRestaurants}
                    rowKey="id"
                    loading={loadingRestaurants}
                    scroll={{ x: 850 }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '20', '50'],
                      showTotal: (total) => `Tổng cộng ${total} yêu cầu`,
                    }}
                    className="rounded-xl overflow-hidden"
                  />
                </div>
              ),
            },
            {
              key: 'drivers',
              label: (
                <div className="flex items-center gap-2">
                  <CarOutlined />
                  <span className="font-semibold">Hồ sơ Tài xế xin gia nhập</span>
                  {pendingDriversCount > 0 && (
                    <Badge count={pendingDriversCount} overflowCount={99} className="ml-1" />
                  )}
                </div>
              ),
              children: (
                <div className="space-y-4 pt-2">
                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                      <Input
                        placeholder="Tìm theo mã User ID, biển số xe, số CCCD..."
                        prefix={<SearchOutlined className="text-slate-400" />}
                        value={driverSearch}
                        onChange={(e) => setDriverSearch(e.target.value)}
                        allowClear
                        className="w-full sm:w-80 rounded-lg"
                      />
                      <Select
                        value={driverStatusFilter}
                        onChange={(val) => {
                          setDriverStatusFilter(val);
                          fetchDriverApprovals(val);
                        }}
                        className="w-full sm:w-48"
                        options={[
                          { label: 'Tất cả trạng thái', value: 'ALL' },
                          { label: 'Chờ duyệt (PENDING)', value: 'PENDING' },
                          { label: 'Đã duyệt (APPROVED)', value: 'APPROVED' },
                          { label: 'Từ chối (REJECTED)', value: 'REJECTED' },
                        ]}
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      Hiển thị <strong>{filteredDrivers.length}</strong> tài xế
                    </span>
                  </div>

                  {/* Table */}
                  <Table
                    columns={driverColumns}
                    dataSource={filteredDrivers}
                    rowKey="userId"
                    loading={loadingDrivers}
                    scroll={{ x: 800 }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '20', '50'],
                      showTotal: (total) => `Tổng cộng ${total} hồ sơ tài xế`,
                    }}
                    className="rounded-xl overflow-hidden"
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Detail Modal */}
      <RestaurantChangeRequestDetailModal
        isOpen={isDetailModalOpen}
        request={selectedRequest}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRequest(null);
        }}
        onApprove={handleApproveRestaurant}
        onReject={handleOpenRejectRestaurant}
      />

      {/* Rejection Modal */}
      <RejectReasonModal
        isOpen={rejectModalOpen}
        title={rejectTarget?.title}
        subTitle="Vui lòng cung cấp lý do từ chối rõ ràng để đối tác hiểu và cập nhật lại thông tin."
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
