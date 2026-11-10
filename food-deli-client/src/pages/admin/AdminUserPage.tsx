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
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
  StopOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { userApi, type CreateUserPayload, type UpdateUserPayload } from '@/services/modules/userApi';
import type { User } from '@/types/auth.types';
import { CreateUserModal, EditUserModal } from './components';

const { Title, Text } = Typography;

export const AdminUserPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

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

  const handleEditUser = async (id: number | string, payload: UpdateUserPayload) => {
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

  const columns: ColumnsType<User> = [
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
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => getStatusBadge(status),
    },
    {
      title: 'Điểm đánh giá',
      dataIndex: 'ratingAvg',
      key: 'ratingAvg',
      width: 140,
      render: (rating) => (
        <Space size={4} align="center">
          <Rate disabled allowHalf defaultValue={Number(rating || 5.0)} className="text-xs text-amber-500" />
          <span className="text-xs font-bold text-amber-600">{Number(rating || 5.0).toFixed(1)}</span>
        </Space>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date) => (
        <span className="text-xs text-slate-500">
          {date ? new Date(date).toLocaleDateString('vi-VN') : 'Hệ thống'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 text-slate-800">
            Quản Lý Người Dùng Toàn Sàn
          </Title>
          <Text className="text-slate-500 text-sm">
            Quản trị toàn bộ danh sách tài khoản, phân quyền vai trò, mở/khóa và thêm mới tài khoản hệ thống.
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
            className="rounded-lg hover:border-orange-500 hover:text-orange-500"
          >
            Làm mới
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
            <div className="text-xs text-slate-400 font-semibold uppercase">Đang hiển thị</div>
            <div className="text-2xl font-black text-blue-600 mt-1">{users.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Trang {page + 1} ({pageSize}/trang)</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-400 font-semibold uppercase">Trạng thái lọc</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {selectedStatus === 'ACTIVE'
                ? 'Đang hoạt động'
                : selectedStatus === 'LOCKED'
                ? 'Bị khóa'
                : 'Tất cả'}
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">Bộ lọc trạng thái hoạt động</div>
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

      {/* Main Table Card */}
      <Card className="rounded-2xl shadow-sm border-slate-200">
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
          columns={columns}
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
      </Card>

      {/* Modals */}
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
