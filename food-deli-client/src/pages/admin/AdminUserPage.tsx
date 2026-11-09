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
  Rate,
  Space,
  Tabs,
  Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  SyncOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  CarOutlined,
  ShopOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { userApi } from '@/services/modules/userApi';
import type { User } from '@/types/auth.types';
import { AdminApprovalModal, type ApprovalPartnerData } from './components/AdminApprovalModal';

const { Title, Text } = Typography;

// Mock initial approval requests from DB seed
const INITIAL_APPROVAL_PARTNERS: ApprovalPartnerData[] = [
  {
    id: 1,
    userId: 3,
    type: 'MERCHANT',
    name: 'Cơm Tấm Thuận Kiều (Nguyễn Văn C)',
    phone: '0900000003',
    email: 'merchant@foodthunder.com',
    address: '123 Cách Mạng Tháng 8, Phường 5, Quận 3, TP.HCM',
    businessLicense: 'GPKD-HCM-2026-9988',
    taxCode: '0318992211',
    status: 'PENDING',
    createdAt: '2026-06-10T08:00:00Z',
  },
  {
    id: 2,
    userId: 2,
    type: 'DRIVER',
    name: 'Nguyễn Tuấn Tài (Tài xế Thunder)',
    phone: '0900000002',
    email: 'driver@foodthunder.com',
    address: '264 Bà Hạt, Phường 9, Quận 10, TP.HCM',
    idCardNumber: '079123456789',
    licensePlate: '59-A1 123.45',
    vehicleType: 'Xe máy Honda Wave Alpha',
    status: 'APPROVED',
    createdAt: '2026-06-10T08:30:00Z',
  },
  {
    id: 3,
    userId: 4,
    type: 'DRIVER',
    name: 'Lê Văn Shipper',
    phone: '0900000004',
    address: '88 Lý Thường Kiệt, Phường 7, Quận 10, TP.HCM',
    idCardNumber: '079987654321',
    licensePlate: '51-B2 678.90',
    vehicleType: 'Xe máy Yamaha Exciter',
    status: 'PENDING',
    createdAt: '2026-06-11T09:15:00Z',
  },
  {
    id: 4,
    userId: 6,
    type: 'MERCHANT',
    name: 'Bếp Nhà Sài Gòn (Trần Thị B)',
    phone: '0900000006',
    address: '25 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM',
    businessLicense: 'GPKD-HCM-2026-5544',
    taxCode: '0319883344',
    status: 'REJECTED',
    rejectReason: 'Ảnh chụp Giấy phép kinh doanh bị mờ, không rõ con dấu của Sở Kế hoạch Đầu tư.',
    createdAt: '2026-06-08T10:00:00Z',
  },
];

export const AdminUserPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Approval Partners State
  const [approvalPartners, setApprovalPartners] = useState<ApprovalPartnerData[]>(INITIAL_APPROVAL_PARTNERS);
  const [approvalFilterStatus, setApprovalFilterStatus] = useState<string | null>(null);
  const [approvalFilterType, setApprovalFilterType] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<ApprovalPartnerData | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);

  // Server-side pagination states
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalElements, setTotalElements] = useState<number>(0);

  const fetchUsers = useCallback(
    async (targetPage: number, targetPageSize: number, targetSearch: string, targetRole: string | null) => {
      setLoading(true);
      try {
        const res = await userApi.getUsers({
          page: targetPage,
          size: targetPageSize,
          search: targetSearch.trim() || undefined,
          role: targetRole || undefined,
        });

        if (res && res.data) {
          const paginated = res.data;
          if (Array.isArray(paginated)) {
            setUsers(paginated);
            setTotalElements(paginated.length);
          } else if (paginated.content) {
            setUsers(paginated.content);
            setTotalElements(paginated.totalElements ?? paginated.content.length);
          } else {
            setUsers([]);
            setTotalElements(0);
          }
        } else {
          setUsers([]);
          setTotalElements(0);
        }
      } catch {
        setUsers([]);
        setTotalElements(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced API search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchUsers(0, pageSize, searchText, selectedRole);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText, selectedRole, pageSize, fetchUsers]);

  const handlePageChange = (newPage: number, newPageSize: number) => {
    const zeroBased = newPage - 1;
    setPage(zeroBased);
    setPageSize(newPageSize);
    fetchUsers(zeroBased, newPageSize, searchText, selectedRole);
  };

  const getRoleBadge = (roleName: string) => {
    const r = roleName.toUpperCase();
    if (r.includes('ADMIN')) {
      return (
        <Tag color="purple" icon={<SafetyCertificateOutlined />} className="font-semibold px-2.5 py-0.5 rounded-md">
          ADMIN
        </Tag>
      );
    }
    if (r.includes('MERCHANT')) {
      return (
        <Tag color="orange" icon={<ShopOutlined />} className="font-semibold px-2.5 py-0.5 rounded-md">
          QUÁN ĂN
        </Tag>
      );
    }
    if (r.includes('DRIVER') || r.includes('SHIPPER')) {
      return (
        <Tag color="green" icon={<CarOutlined />} className="font-semibold px-2.5 py-0.5 rounded-md">
          TÀI XẾ
        </Tag>
      );
    }
    return (
      <Tag color="blue" icon={<UserOutlined />} className="font-semibold px-2.5 py-0.5 rounded-md">
        KHÁCH HÀNG
      </Tag>
    );
  };

  const handleOpenApprovalModal = (partner: ApprovalPartnerData) => {
    setSelectedPartner(partner);
    setIsApprovalModalOpen(true);
  };

  const handleApprovalSuccess = () => {
    // Refresh or update partner in list
    if (selectedPartner) {
      setApprovalPartners((prev) =>
        prev.map((p) =>
          p.id === selectedPartner.id
            ? { ...p, status: p.status === 'PENDING' ? 'APPROVED' : p.status }
            : p
        )
      );
    }
  };

  const userColumns: ColumnsType<User> = [
    {
      title: 'Mã ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id) => <span className="text-slate-400 font-mono text-xs">#{id}</span>,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name, record) => (
        <div>
          <span className="font-bold text-slate-800 text-sm">{name || 'Chưa cập nhật'}</span>
          <div className="text-xs text-slate-400 font-mono">{record.phone}</div>
        </div>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (phone) => <span className="font-medium text-slate-700">{phone}</span>,
    },
    {
      title: 'Vai trò tài khoản',
      dataIndex: 'role',
      key: 'role',
      width: 170,
      render: (role, record) => {
        if (record.roles && record.roles.length > 0) {
          return (
            <Space size={4} wrap>
              {record.roles.map((r) => (
                <span key={r}>{getRoleBadge(r)}</span>
              ))}
            </Space>
          );
        }
        return getRoleBadge(role || 'CUSTOMER');
      },
    },
    {
      title: 'Điểm đánh giá',
      dataIndex: 'ratingAvg',
      key: 'ratingAvg',
      width: 150,
      render: (rating) => (
        <Space size={6} align="center">
          <Rate disabled allowHalf defaultValue={Number(rating || 5.0)} className="text-xs text-amber-500" />
          <span className="text-xs font-bold text-amber-600">{Number(rating || 5.0).toFixed(1)}</span>
        </Space>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date) => (
        <span className="text-xs text-slate-500">
          {date ? new Date(date).toLocaleDateString('vi-VN') : 'Mặc định'}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_, record) => {
        const isPartner =
          (record.roles && record.roles.some((r) => r.includes('MERCHANT') || r.includes('DRIVER'))) ||
          (record.role && (record.role.includes('MERCHANT') || record.role.includes('DRIVER')));

        if (!isPartner) return <span className="text-xs text-gray-400">-</span>;

        return (
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              const type = record.role?.includes('DRIVER') ? 'DRIVER' : 'MERCHANT';
              const numericId = Number(record.id) || 1;
              handleOpenApprovalModal({
                id: numericId,
                userId: numericId,
                type,
                name: record.fullName || `Đối tác #${numericId}`,
                phone: record.phone || '',
                email: record.email,
                address: 'Địa chỉ đăng ký hoạt động',
                businessLicense: type === 'MERCHANT' ? 'GPKD-HCM-2026-9988' : undefined,
                taxCode: type === 'MERCHANT' ? '0318992211' : undefined,
                idCardNumber: type === 'DRIVER' ? '079123456789' : undefined,
                licensePlate: type === 'DRIVER' ? '59-A1 123.45' : undefined,
                vehicleType: type === 'DRIVER' ? 'Xe máy Honda Wave' : undefined,
                status: 'APPROVED',
              });
            }}
            className="rounded-lg font-semibold text-xs border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            Xem hồ sơ
          </Button>
        );
      },
    },
  ];

  // Filtered approval partners
  const filteredApprovals = approvalPartners.filter((p) => {
    if (approvalFilterStatus && p.status !== approvalFilterStatus) return false;
    if (approvalFilterType && p.type !== approvalFilterType) return false;
    return true;
  });

  const pendingApprovalsCount = approvalPartners.filter((p) => p.status === 'PENDING').length;

  const approvalColumns: ColumnsType<ApprovalPartnerData> = [
    {
      title: 'Mã',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      render: (id) => <span className="font-mono text-xs text-gray-400">#{id}</span>,
    },
    {
      title: 'Đối tác / Tên quán',
      key: 'partner',
      render: (_, r) => (
        <div>
          <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            {r.type === 'MERCHANT' ? (
              <ShopOutlined className="text-orange-500" />
            ) : (
              <CarOutlined className="text-emerald-500" />
            )}
            <span>{r.name}</span>
          </div>
          <div className="text-xs text-gray-400 font-mono mt-0.5">{r.phone}</div>
        </div>
      ),
    },
    {
      title: 'Loại hồ sơ',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type) =>
        type === 'MERCHANT' ? (
          <Tag color="orange" className="font-bold">
            QUÁN ĂN
          </Tag>
        ) : (
          <Tag color="green" className="font-bold">
            TÀI XẾ
          </Tag>
        ),
    },
    {
      title: 'Giấy tờ / Pháp lý',
      key: 'legal',
      render: (_, r) => (
        <div className="text-xs space-y-1">
          {r.type === 'MERCHANT' ? (
            <>
              <div>
                <span className="text-gray-400 font-medium">GPKD:</span>{' '}
                <span className="font-mono font-semibold text-gray-800">{r.businessLicense || 'Chưa nộp'}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium">MST:</span>{' '}
                <span className="font-mono text-gray-800">{r.taxCode || 'Chưa nộp'}</span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-gray-400 font-medium">CCCD:</span>{' '}
                <span className="font-mono font-semibold text-gray-800">{r.idCardNumber || 'Chưa nộp'}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Biển số:</span>{' '}
                <Tag color="cyan" className="font-mono font-bold text-[11px] px-1.5 py-0">
                  {r.licensePlate || 'N/A'}
                </Tag>
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Địa chỉ đăng ký',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (address) => <span className="text-xs text-gray-600 truncate max-w-xs">{address}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status, record) => {
        if (status === 'APPROVED') {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />} className="font-bold px-2 py-0.5 rounded-lg">
              ĐÃ DUYỆT
            </Tag>
          );
        }
        if (status === 'REJECTED') {
          return (
            <div>
              <Tag color="error" icon={<CloseCircleOutlined />} className="font-bold px-2 py-0.5 rounded-lg">
                TỪ CHỐI
              </Tag>
              {record.rejectReason && (
                <div className="text-[11px] text-red-500 italic mt-0.5 truncate max-w-[140px]" title={record.rejectReason}>
                  {record.rejectReason}
                </div>
              )}
            </div>
          );
        }
        return (
          <Tag color="processing" className="font-bold px-2 py-0.5 rounded-lg animate-pulse">
            CHỜ DUYỆT
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleOpenApprovalModal(record)}
          className="rounded-lg font-bold text-xs bg-orange-500 hover:bg-orange-600 shadow-2xs"
        >
          {record.status === 'PENDING' ? 'Xét duyệt' : 'Xem chi tiết'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 text-slate-800">
            Cổng Quản Trị Hệ Thống (Admin Portal)
          </Title>
          <Text className="text-slate-500 text-sm">
            Quản trị toàn bộ danh sách người dùng, phê duyệt hồ sơ đối tác Quán ăn & Tài xế và cấu hình vận hành.
          </Text>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            icon={<SyncOutlined spin={loading} />}
            onClick={() => fetchUsers(page, pageSize, searchText, selectedRole)}
            className="rounded-lg hover:border-orange-500 hover:text-orange-500 font-semibold"
          >
            Làm mới dữ liệu
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
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
            <div className="text-[11px] text-amber-600/80 mt-0.5">Quán & Tài xế mới</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-400 font-semibold uppercase">Đối tác hoạt động</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {approvalPartners.filter((p) => p.status === 'APPROVED').length}
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">Đã duyệt hợp lệ</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-400 font-semibold uppercase">Tìm kiếm Backend</div>
            <div className="text-2xl font-black text-orange-500 mt-1">API Live</div>
            <div className="text-[11px] text-orange-500/80 mt-0.5">Truy vấn SQL thực tế</div>
          </Card>
        </Col>
      </Row>

      {/* Main Tabbed Card */}
      <Card className="rounded-2xl shadow-sm border-slate-200">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="font-semibold"
          items={[
            {
              key: 'users',
              label: (
                <span className="flex items-center gap-1.5">
                  <UserOutlined />
                  Danh sách Người Dùng
                </span>
              ),
              children: (
                <div className="space-y-4 pt-2">
                  {/* Search & Filter Toolbar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                      <Input
                        placeholder="Tìm theo họ tên hoặc số điện thoại (API search)..."
                        prefix={<SearchOutlined className="text-slate-400" />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                        className="w-full sm:w-80 rounded-lg"
                      />
                      <Select
                        placeholder="Lọc theo vai trò"
                        value={selectedRole}
                        onChange={(val) => setSelectedRole(val)}
                        allowClear
                        className="w-full sm:w-56"
                        options={[
                          { label: 'Tất cả vai trò', value: null as any },
                          { label: 'Khách hàng (CUSTOMER)', value: 'CUSTOMER' },
                          { label: 'Quán ăn (MERCHANT)', value: 'MERCHANT' },
                          { label: 'Tài xế (DRIVER/SHIPPER)', value: 'DRIVER' },
                          { label: 'Quản trị viên (ADMIN)', value: 'ADMIN' },
                        ]}
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      Trang {page + 1} &bull; Hiển thị <strong>{users.length}</strong> / Tổng {totalElements} người dùng
                    </span>
                  </div>

                  {/* User Table */}
                  <Table
                    columns={userColumns}
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      current: page + 1,
                      pageSize,
                      total: totalElements,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '20', '50'],
                      showTotal: (total) => `Tổng cộng ${total} người dùng`,
                      onChange: handlePageChange,
                    }}
                    className="rounded-xl overflow-hidden"
                  />
                </div>
              ),
            },
            {
              key: 'approvals',
              label: (
                <span className="flex items-center gap-1.5">
                  <AuditOutlined />
                  Phê Duyệt Đối Tác (Quán & Tài Xế)
                  {pendingApprovalsCount > 0 && (
                    <Badge count={pendingApprovalsCount} className="ml-1" />
                  )}
                </span>
              ),
              children: (
                <div className="space-y-4 pt-2">
                  {/* Approval Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Select
                        placeholder="Loại đối tác"
                        value={approvalFilterType}
                        onChange={setApprovalFilterType}
                        allowClear
                        className="w-44"
                        options={[
                          { label: 'Tất cả đối tác', value: null as any },
                          { label: 'Quán ăn (Merchant)', value: 'MERCHANT' },
                          { label: 'Tài xế (Driver)', value: 'DRIVER' },
                        ]}
                      />
                      <Select
                        placeholder="Trạng thái hồ sơ"
                        value={approvalFilterStatus}
                        onChange={setApprovalFilterStatus}
                        allowClear
                        className="w-44"
                        options={[
                          { label: 'Tất cả trạng thái', value: null as any },
                          { label: 'Chờ duyệt (PENDING)', value: 'PENDING' },
                          { label: 'Đã duyệt (APPROVED)', value: 'APPROVED' },
                          { label: 'Đã từ chối (REJECTED)', value: 'REJECTED' },
                        ]}
                      />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      Hiển thị <strong>{filteredApprovals.length}</strong> hồ sơ đối tác
                    </span>
                  </div>

                  {/* Approval Table */}
                  <Table
                    columns={approvalColumns}
                    dataSource={filteredApprovals}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    className="rounded-xl overflow-hidden"
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Admin Approval Modal with License, Address, and Rejection Note */}
      {isApprovalModalOpen && selectedPartner && (
        <AdminApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={() => setIsApprovalModalOpen(false)}
          partner={selectedPartner}
          onSuccess={handleApprovalSuccess}
        />
      )}
    </div>
  );
};

export default AdminUserPage;
