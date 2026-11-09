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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  SyncOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  CarOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { userApi } from '@/services/modules/userApi';
import type { User } from '@/types/auth.types';

const { Title, Text } = Typography;

export const AdminUserPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

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

  // Debounced API search effect (Chỉ kích hoạt khi ô tìm kiếm hoặc role thay đổi)
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

  const columns: ColumnsType<User> = [
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
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 text-slate-800">
            Quản Lý Danh Sách Người Dùng
          </Title>
          <Text className="text-slate-500 text-sm">
            Xem toàn bộ tài khoản hệ thống với phân trang dữ liệu từ Backend và tìm kiếm trực tiếp bằng API.
          </Text>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            icon={<SyncOutlined spin={loading} />}
            onClick={() => fetchUsers(page, pageSize, searchText, selectedRole)}
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
            <div className="text-xs text-slate-400 font-semibold uppercase">Trang hiện tại</div>
            <div className="text-2xl font-black text-blue-600 mt-1">{page + 1}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Số lượng: {users.length} tài khoản</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-400 font-semibold uppercase">Kích thước trang</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{pageSize}</div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">Dữ liệu trên 1 trang</div>
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

      {/* Main Table Card */}
      <Card className="rounded-2xl shadow-sm border-slate-200">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
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
          columns={columns}
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
      </Card>
    </div>
  );
};

export default AdminUserPage;
