import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Typography,
  Alert,
  message,
} from 'antd';
import {
  SyncOutlined,
  UserAddOutlined,
  AuditOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { userApi, type CreateUserPayload, type UpdateUserPayload } from '@/services/modules/userApi';
import { adminApprovalApi } from '@/services/modules/adminApprovalApi';
import type { User } from '@/types/auth.types';
import { APP_ROUTES } from '@/constants';
import {
  CreateUserModal,
  EditUserModal,
  UserStatCards,
  UserFilterBar,
  UserDataTable,
} from './components';

const { Title, Text } = Typography;

export const AdminUserPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Server-side pagination states
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Real Pending approvals count from backend for helpful notification banner
  const [pendingApprovalsTotal, setPendingApprovalsTotal] = useState<number>(0);

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

  // Fetch real pending approvals count for top shortcut banner
  const fetchPendingCount = useCallback(async () => {
    try {
      const [restRes, driverRes] = await Promise.allSettled([
        adminApprovalApi.getRestaurantChangeRequests('PENDING'),
        adminApprovalApi.getDriverApprovals('PENDING'),
      ]);
      const restCount =
        restRes.status === 'fulfilled' && Array.isArray(restRes.value.data)
          ? restRes.value.data.length
          : 0;
      const driverCount =
        driverRes.status === 'fulfilled' && Array.isArray(driverRes.value.data)
          ? driverRes.value.data.length
          : 0;
      setPendingApprovalsTotal(restCount + driverCount);
    } catch {
      // Ignore background counter errors
    }
  }, []);

  // Debounced API search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchUsers(0, pageSize, searchText, selectedRole, selectedStatus);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText, selectedRole, selectedStatus, pageSize, fetchUsers]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

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
      message.success('Đã tạo tài khoản người dùng mới thành công!');
      setIsCreateModalOpen(false);
      fetchUsers(0, pageSize, searchText, selectedRole, selectedStatus);
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
      message.success('Đã cập nhật thông tin người dùng thành công!');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers(page, pageSize, searchText, selectedRole, selectedStatus);
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Không thể cập nhật người dùng');
    } finally {
      setActionSubmitting(false);
    }
  };

  const isUserAdmin = (user?: User | null): boolean => {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    const roles = Array.isArray(user.roles) ? user.roles.map((r) => r.toUpperCase()) : [];
    return role === 'ADMIN' || role === 'ROLE_ADMIN' || roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');
  };

  const handleToggleStatus = async (user: User) => {
    if (isUserAdmin(user)) {
      message.warning('Không thể thay đổi trạng thái của tài khoản Quản trị viên (ADMIN)!');
      return;
    }
    const currentStatus = (user.status || 'ACTIVE').toUpperCase();
    const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      await userApi.updateUserStatus(user.id, { status: newStatus });
      message.success(
        `Đã chuyển trạng thái người dùng #${user.id} sang ${newStatus === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}!`
      );
      fetchUsers(page, pageSize, searchText, selectedRole, selectedStatus);
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Không thể đổi trạng thái tài khoản');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (isUserAdmin(user)) {
      message.error('Tuyệt đối không được xóa tài khoản Quản trị viên (ADMIN)!');
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 text-slate-800">
            Quản Lý Người Dùng Hệ Thống
          </Title>
          <Text className="text-slate-500 text-sm">
            Quản trị toàn bộ danh sách tài khoản, phân quyền vai trò (Khách hàng, Quán ăn, Tài xế, Admin) và trạng thái tài khoản.
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

      {/* Helpful banner: Redirect to dedicated Approvals Portal if any pending requests exist */}
      {pendingApprovalsTotal > 0 && (
        <Alert
          message={
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <span className="font-semibold text-slate-700">
                ⚡ Hệ thống hiện có <strong>{pendingApprovalsTotal}</strong> hồ sơ đối tác (Quán ăn & Tài xế) đang chờ Admin xét duyệt.
              </span>
              <Button
                type="primary"
                size="small"
                icon={<AuditOutlined />}
                onClick={() => navigate(APP_ROUTES.ADMIN_APPROVALS)}
                className="bg-amber-500 hover:bg-amber-600 border-none font-bold text-xs rounded-lg shadow-2xs self-start sm:self-auto"
              >
                <span>Đến Trung tâm Phê duyệt hồ sơ</span>
                <ArrowRightOutlined />
              </Button>
            </div>
          }
          type="warning"
          showIcon
          className="rounded-2xl border-amber-200 bg-amber-50/70 shadow-2xs"
        />
      )}

      {/* Overview Stat Cards */}
      <UserStatCards
        totalElements={totalElements}
        showingCount={users.length}
        page={page}
        pageSize={pageSize}
        selectedRole={selectedRole}
        selectedStatus={selectedStatus}
      />

      {/* Main Table Card */}
      <Card className="rounded-2xl shadow-sm border-slate-200">
        <div className="space-y-4 pt-1">
          <UserFilterBar
            searchText={searchText}
            onSearchChange={setSearchText}
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            currentPage={page + 1}
            showingCount={users.length}
            totalElements={totalElements}
          />

          <UserDataTable
            users={users}
            loading={loading}
            page={page}
            pageSize={pageSize}
            totalElements={totalElements}
            onPageChange={handlePageChange}
            onEditUser={(user) => {
              setSelectedUser(user);
              setIsEditModalOpen(true);
            }}
            onToggleStatus={handleToggleStatus}
            onDeleteUser={handleDeleteUser}
            isUserAdmin={isUserAdmin}
          />
        </div>
      </Card>

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
