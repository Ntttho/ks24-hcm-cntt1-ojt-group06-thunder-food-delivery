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
  Popconfirm,
  Tooltip,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  SyncOutlined,
  UserOutlined,
  UserAddOutlined,
  SafetyCertificateOutlined,
  CarOutlined,
  ShopOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  StopOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { userApi, type CreateUserPayload, type UpdateUserPayload } from '@/services/modules/userApi';
import type { User } from '@/types/auth.types';
import { AdminApprovalModal, type ApprovalPartnerData } from './components/AdminApprovalModal';
import { CreateUserModal, EditUserModal } from './components';

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
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

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

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState<boolean>(false);

  const fetchUsers = useCallback(
    async (
      targetPage: number,
      targetPageSize: number,
      targetSearch: string,
      targetRole: string | null,
      targetStatus: string | null
    ) => {
      setLoading(true);
      try {
        const res = await userApi.getUsers({
          page: targetPage,
          size: targetPageSize,
          search: targetSearch.trim() || undefined,
          role: targetRole || undefined,
          status: targetStatus || undefined,
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
      } catch (err: any) {
        message.error(err?.message || 'Không thể tải danh sách người dùng');
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
      fetchUsers(0, pageSize, searchText, selectedRole, selectedStatus);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText, selectedRole, selectedStatus, pageSize, fetchUsers]);

  const handlePageChange = (newPage: number, newPageSize: number) => {
    const zeroBased = newPage - 1;
    setPage(zeroBased);
    setPageSize(newPageSize);
    fetchUsers(zeroBased, newPageSize, searchText, selectedRole, selectedStatus);
  };

  const handleCreateUser = async (payload: CreateUserPayload) => {
    setActionSubmitting(true);
    try {
      await userApi.createUser(payload);
      message.success('Thêm người dùng mới thành công!');
      setIsCreateModalOpen(false);
      fetchUsers(page, pageSize, searchText, selectedRole, selectedStatus);
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Không thể tạo người dùng');
    } finally {
      setActionSubmitting(false);
    }
  };

  const isUserAdmin = (user?: User | null) => {
    if (!user) return false;
    const r = (user.role || '').toUpperCase();
    if (r.includes('ADMIN')) return true;
    if (user.roles && user.roles.some((roleName: string) => roleName.toUpperCase().includes('ADMIN'))) return true;
    return false;
  };

  const handleEditUser = async (id: number | string, payload: UpdateUserPayload) => {
    if (selectedUser && isUserAdmin(selectedUser)) {
      message.warning('Không được phép chỉnh sửa tài khoản Quản trị viên (Admin)!');
      return;
    }
    setActionSubmitting(true);
    try {
      await userApi.updateUser(id, payload);
      message.success('Cập nhật thông tin người dùng thành công!');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers(page, pageSize, searchText, selectedRole, selectedStatus);
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Không thể cập nhật người dùng');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (isUserAdmin(user)) {
      message.warning('Không được phép khóa hoặc thay đổi trạng thái của tài khoản Quản trị viên (Admin)!');
      return;
    }
    const currentStatus = user.status?.toUpperCase() || 'ACTIVE';
    const newStatus = currentStatus === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    const actionLabel = newStatus === 'ACTIVE' ? 'Mở khóa' : 'Khóa';

    try {
      await userApi.updateUserStatus(user.id, newStatus);
      message.success(`${actionLabel} tài khoản thành công!`);
      fetchUsers(page, pageSize, searchText, selectedRole, selectedStatus);
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || `Không thể ${actionLabel.toLowerCase()} tài khoản`);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (isUserAdmin(user)) {
      message.warning('Không được phép xóa tài khoản Quản trị viên (Admin)!');
      return;
    }
    try {
      await userApi.deleteUser(user.id);
      message.success(`Đã xóa/vô hiệu hóa tài khoản #${user.id} thành công!`);
      fetchUsers(page, pageSize, searchText, selectedRole, selectedStatus);
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Không thể xóa tài khoản');
    }
  };

  const getRoleBadge = (roleName: string) => {
    const r = roleName.toUpperCase();
    if (r.includes('ADMIN')) {
      return (
        <Tag color="purple" icon={<SafetyCertificateOutlined />} className="font-semibold px-2 py-0.5 rounded-md">
          ADMIN
        </Tag>
      );
    }
    if (r.includes('MERCHANT')) {
      return (
        <Tag color="orange" icon={<ShopOutlined />} className="font-semibold px-2 py-0.5 rounded-md">
          QUÁN ĂN
        </Tag>
      );
    }
    if (r.includes('DRIVER') || r.includes('SHIPPER')) {
      return (
        <Tag color="green" icon={<CarOutlined />} className="font-semibold px-2 py-0.5 rounded-md">
          TÀI XẾ
        </Tag>
      );
    }
    return (
      <Tag color="blue" icon={<UserOutlined />} className="font-semibold px-2 py-0.5 rounded-md">
        KHÁCH HÀNG
      </Tag>
    );
  };

  const handleOpenApprovalModal = (partner: ApprovalPartnerData) => {
    setSelectedPartner(partner);
    setIsApprovalModalOpen(true);
  };

  const handleApprovalSuccess = () => {
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

  const getStatusBadge = (status?: string) => {
    const isLocked = status?.toUpperCase() === 'LOCKED';
    if (isLocked) {
      return (
        <Tag color="error" icon={<StopOutlined />} className="font-semibold px-2.5 py-0.5 rounded-md">
          Bị khóa
        </Tag>
      );
    }
    return (
      <Tag color="success" icon={<CheckCircleOutlined />} className="font-semibold px-2.5 py-0.5 rounded-md">
        Hoạt động
      </Tag>
    );
  };

  // User table columns
  const userColumns: ColumnsType<User> = [
    {
      title: 'Mã ID',
      dataIndex: 'id',
      key: 'id',
      width: 75,
      render: (id) => <span className="text-slate-400 font-mono text-xs font-semibold">#{id}</span>,
    },
    {
      title: 'Họ và tên & Liên hệ',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name, record) => (
        <div>
          <div className="font-bold text-slate-800 text-sm">{name || 'Chưa cập nhật'}</div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-slate-400 mt-0.5">
            <span className="font-mono text-slate-600">{record.phone || record.phoneNumber}</span>
            {record.email && (
              <span className="flex items-center gap-1 text-slate-500">
                <MailOutlined className="text-[11px]" />
                {record.email}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Vai trò (Role)',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role, record) => {
        if (record.roles && record.roles.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {record.roles.map((r) => (
                <span key={r}>{getRoleBadge(r)}</span>
              ))}
            </div>
          );
        }
        return getRoleBadge(role || 'CUSTOMER');
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
      title: 'Đánh giá',
      dataIndex: 'ratingAvg',
      key: 'ratingAvg',
      width: 130,
      render: (rating) => (
        <div className="flex items-center gap-1">
          <Rate disabled defaultValue={rating || 5} count={5} className="text-xs text-amber-400" />
          <span className="text-xs font-bold text-slate-600">{rating ? Number(rating).toFixed(1) : '5.0'}</span>
        </div>
      ),
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => (
        <span className="text-xs text-slate-500 font-medium">
          {date ? new Date(date).toLocaleDateString('vi-VN') : 'Mới tạo'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        if (isUserAdmin(record)) {
          return (
            <Tooltip title="Tài khoản Quản trị viên được bảo vệ hệ thống: Không cho phép chỉnh sửa, khóa hoặc xóa">
              <Tag
                color="cyan"
                icon={<SafetyCertificateOutlined />}
                className="px-2.5 py-1 font-semibold text-xs rounded-lg m-0 border border-cyan-200 bg-cyan-50 text-cyan-700 flex items-center gap-1 w-fit cursor-default"
              >
                Bảo vệ hệ thống
              </Tag>
            </Tooltip>
          );
        }

        const isLocked = record.status?.toUpperCase() === 'LOCKED';
        return (
          <Space size={4}>
            {/* Chỉnh sửa */}
            <Tooltip title="Chỉnh sửa thông tin & vai trò">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined className="text-blue-600" />}
                onClick={() => {
                  setSelectedUser(record);
                  setIsEditModalOpen(true);
                }}
                className="hover:bg-blue-50"
              />
            </Tooltip>

            {/* Khóa / Mở khóa */}
            <Popconfirm
              title={isLocked ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
              description={
                isLocked
                  ? `Bạn có chắc chắn muốn mở khóa cho tài khoản "${record.fullName}"?`
                  : `Bạn có chắc chắn muốn khóa tài khoản "${record.fullName}"? Người dùng này sẽ không thể đăng nhập.`
              }
              onConfirm={() => handleToggleStatus(record)}
              okText={isLocked ? 'Mở khóa' : 'Khóa'}
              cancelText="Hủy"
              okButtonProps={{ danger: !isLocked }}
            >
              <Tooltip title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}>
                <Button
                  type="text"
                  size="small"
                  icon={
                    isLocked ? (
                      <UnlockOutlined className="text-emerald-600" />
                    ) : (
                      <LockOutlined className="text-amber-600" />
                    )
                  }
                  className={isLocked ? 'hover:bg-emerald-50' : 'hover:bg-amber-50'}
                />
              </Tooltip>
            </Popconfirm>

            {/* Xóa tài khoản */}
            <Popconfirm
              title="Xóa tài khoản người dùng?"
              description={`Hành động này sẽ vô hiệu hóa tài khoản "${record.fullName}". Bạn có chắc chắn muốn tiếp tục?`}
              onConfirm={() => handleDeleteUser(record)}
              okText="Xóa tài khoản"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Xóa tài khoản">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  className="hover:bg-red-50"
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // Approval Partners Table Columns
  const approvalColumns: ColumnsType<ApprovalPartnerData> = [
    {
      title: 'Mã HS',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      render: (id) => <span className="font-mono text-xs font-bold text-gray-500">#{id}</span>,
    },
    {
      title: 'Tên đối tác & Liên hệ',
      key: 'partner',
      render: (_, r) => (
        <div>
          <div className="font-bold text-gray-800 text-sm">{r.name}</div>
          <div className="text-xs text-gray-500 font-mono mt-0.5">
            {r.phone} {r.email && `• ${r.email}`}
          </div>
        </div>
      ),
    },
    {
      title: 'Loại đối tác',
      dataIndex: 'type',
      key: 'type',
      width: 120,
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

  const filteredApprovals = approvalPartners.filter((p) => {
    if (approvalFilterStatus && p.status !== approvalFilterStatus) return false;
    if (approvalFilterType && p.type !== approvalFilterType) return false;
    return true;
  });

  const pendingApprovalsCount = approvalPartners.filter((p) => p.status === 'PENDING').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 text-slate-800">
            Cổng Quản Trị Hệ Thống (Admin Portal)
          </Title>
          <Text className="text-slate-500 text-sm">
            Quản trị toàn bộ danh sách tài khoản, phân quyền vai trò, mở/khóa và phê duyệt hồ sơ đối tác Quán ăn & Tài xế.
          </Text>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 border-none font-medium rounded-lg px-4 shadow-sm"
          >
            Thêm người dùng mới
          </Button>
          <Button
            icon={<SyncOutlined spin={loading} />}
            onClick={() => fetchUsers(page, pageSize, searchText, selectedRole, selectedStatus)}
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
            <div className="text-xs text-slate-400 font-semibold uppercase">Đang hiển thị</div>
            <div className="text-2xl font-black text-blue-600 mt-1">{users.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Trang {page + 1} ({pageSize}/trang)</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-400 font-semibold uppercase">Phân quyền Vai trò</div>
            <div className="text-2xl font-black text-orange-500 mt-1">
              {selectedRole ? selectedRole : 'Đa vai trò'}
            </div>
            <div className="text-[11px] text-orange-500/80 mt-0.5">CUSTOMER, MERCHANT, DRIVER, ADMIN</div>
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
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 flex-wrap">
                      <Input
                        placeholder="Tìm theo họ tên, số điện thoại hoặc email..."
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
                        className="w-full sm:w-52"
                        options={[
                          { label: 'Tất cả vai trò', value: null as any },
                          { label: 'Khách hàng (CUSTOMER)', value: 'CUSTOMER' },
                          { label: 'Quán ăn (MERCHANT)', value: 'MERCHANT' },
                          { label: 'Tài xế (DRIVER)', value: 'DRIVER' },
                          { label: 'Quản trị viên (ADMIN)', value: 'ADMIN' },
                        ]}
                      />
                      <Select
                        placeholder="Lọc theo trạng thái"
                        value={selectedStatus}
                        onChange={(val) => setSelectedStatus(val)}
                        allowClear
                        className="w-full sm:w-48"
                        options={[
                          { label: 'Tất cả trạng thái', value: null as any },
                          { label: 'Đang hoạt động (ACTIVE)', value: 'ACTIVE' },
                          { label: 'Bị khóa (LOCKED)', value: 'LOCKED' },
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
                    scroll={{ x: 950 }}
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

      {/* User Create & Edit Modals */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        submitting={actionSubmitting}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        user={selectedUser}
        submitting={actionSubmitting}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleEditUser}
      />
    </div>
  );
};

export default AdminUserPage;
