import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Switch,
  Space,
  Tag,
  Popconfirm,
  Typography,
  message,
  Tooltip,
  Row,
  Col,
  Progress,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  GiftOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import {
  restaurantApi,
  type VoucherItem,
  type CreateVoucherPayload,
  type UpdateVoucherPayload,
} from '@/services/modules/restaurantApi';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { VoucherFormModal } from './components/VoucherFormModal';

const { Title, Text } = Typography;

export const MerchantVoucherPage: React.FC = () => {
  const { user } = useAuth();
  const outletContext = useOutletContext<{ restaurantId?: number; activeRestaurant?: any }>();
  const currentRestaurantId = outletContext?.restaurantId || (user as any)?.restaurantId || 1;

  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal Create/Edit state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherItem | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch Vouchers from API
  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await restaurantApi.getVouchers(currentRestaurantId);
      if (res && res.data) {
        setVouchers(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      message.error('Không thể tải danh sách voucher khuyến mãi');
    } finally {
      setLoading(false);
    }
  }, [currentRestaurantId]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  // Client-side search and status filtering
  const filteredVouchers = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const now = new Date();

    return vouchers.filter((v) => {
      const matchesSearch =
        q === '' ||
        v.code.toLowerCase().includes(q) ||
        (v.discountType && v.discountType.toLowerCase().includes(q));

      const isExpired = v.expiryDate ? new Date(v.expiryDate) < now : false;

      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchesStatus = !!v.isActive && !isExpired;
      } else if (statusFilter === 'INACTIVE') {
        matchesStatus = !v.isActive && !isExpired;
      } else if (statusFilter === 'EXPIRED') {
        matchesStatus = isExpired;
      }

      return matchesSearch && matchesStatus;
    });
  }, [vouchers, searchText, statusFilter]);

  // Handle open create modal
  const handleOpenCreateModal = () => {
    setEditingVoucher(null);
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (voucher: VoucherItem) => {
    setEditingVoucher(voucher);
    setIsModalOpen(true);
  };

  // Handle submit create or update
  const handleSubmitVoucher = async (values: CreateVoucherPayload | UpdateVoucherPayload) => {
    setSubmitting(true);
    try {
      if (editingVoucher) {
        await restaurantApi.updateVoucher(editingVoucher.id, values as UpdateVoucherPayload);
        message.success(`Đã cập nhật voucher "${editingVoucher.code}" thành công!`);
      } else {
        await restaurantApi.createVoucher(values as CreateVoucherPayload);
        message.success(`Đã tạo voucher mới thành công!`);
      }
      setIsModalOpen(false);
      setEditingVoucher(null);
      fetchVouchers();
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu voucher!';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle toggle voucher status
  const handleToggleStatus = async (voucher: VoucherItem) => {
    try {
      await restaurantApi.toggleVoucher(voucher.id);
      message.success(`Đã đổi trạng thái voucher "${voucher.code}"`);
      // Update local state immediately
      setVouchers((prev) =>
        prev.map((v) => (v.id === voucher.id ? { ...v, isActive: !v.isActive } : v))
      );
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Không thể đổi trạng thái voucher!';
      message.error(errorMsg);
    }
  };

  // Handle delete voucher
  const handleDeleteVoucher = async (voucher: VoucherItem) => {
    try {
      await restaurantApi.deleteVoucher(voucher.id);
      message.success(`Đã xóa voucher "${voucher.code}"`);
      fetchVouchers();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Không thể xóa voucher!';
      message.error(errorMsg);
    }
  };

  // Table columns definition
  const columns: ColumnsType<VoucherItem> = [
    {
      title: 'Mã Voucher',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <div className="flex items-center gap-2">
          <Tag color="purple" className="font-mono font-bold text-xs uppercase px-2 py-1 tracking-wider">
            <GiftOutlined className="mr-1" />
            {code}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Mức giảm giá',
      key: 'discount',
      render: (_: any, record: VoucherItem) => {
        const isPercent = record.discountType === 'PERCENTAGE';
        return (
          <div>
            <div className="font-bold text-slate-800 text-sm flex items-center gap-1">
              {isPercent ? (
                <>
                  <PercentageOutlined className="text-blue-500" />
                  <span className="text-blue-600">Giảm {record.discountValue}%</span>
                </>
              ) : (
                <>
                  <DollarOutlined className="text-emerald-500" />
                  <span className="text-emerald-600">Giảm {formatCurrency(record.discountValue)}</span>
                </>
              )}
            </div>
            {isPercent && record.maxDiscountAmount && (
              <div className="text-xs text-slate-400">
                Tối đa: {formatCurrency(record.maxDiscountAmount)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Đơn tối thiểu',
      dataIndex: 'minOrderValue',
      key: 'minOrderValue',
      render: (min?: number) => (
        <span className="text-slate-600 text-xs font-medium">
          {min && min > 0 ? formatCurrency(min) : 'Không yêu cầu'}
        </span>
      ),
    },
    {
      title: 'Lượt dùng',
      key: 'usage',
      width: 140,
      render: (_: any, record: VoucherItem) => {
        const used = record.usedCount ?? 0;
        const limit = record.usageLimit;
        const percent = limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
        return (
          <div className="space-y-1">
            <div className="text-xs text-slate-600">
              <strong className="text-slate-800">{used}</strong> / {limit ?? '∞'} lượt
            </div>
            {limit ? (
              <Progress percent={percent} size="small" showInfo={false} status={percent >= 100 ? 'exception' : 'active'} />
            ) : null}
          </div>
        );
      },
    },
    {
      title: 'Thời hạn áp dụng',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (expiry: string, record: VoucherItem) => {
        const isExpired = expiry ? new Date(expiry) < new Date() : false;
        return (
          <div className="space-y-0.5 text-xs">
            {record.startDate && (
              <div className="text-slate-400">Từ: {formatDate(record.startDate)}</div>
            )}
            <div className={isExpired ? 'text-rose-500 font-semibold' : 'text-slate-600'}>
              <ClockCircleOutlined className="mr-1 text-[11px]" />
              Đến: {formatDate(expiry)}
            </div>
            {isExpired && <Tag color="error" className="text-[10px] scale-90 origin-left">Hết hạn</Tag>}
          </div>
        );
      },
    },
    {
      title: 'Trạng thái',
      key: 'isActive',
      width: 130,
      align: 'center',
      render: (_: any, record: VoucherItem) => {
        const isExpired = record.expiryDate ? new Date(record.expiryDate) < new Date() : false;
        return (
          <Tooltip title={isExpired ? 'Voucher đã hết hạn áp dụng' : 'Bật/Tắt hiệu lực của voucher'}>
            <Switch
              checked={!!record.isActive && !isExpired}
              disabled={isExpired}
              onChange={() => handleToggleStatus(record)}
              checkedChildren="Bật"
              unCheckedChildren="Tắt"
              className={record.isActive && !isExpired ? 'bg-emerald-500' : 'bg-slate-300'}
            />
          </Tooltip>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 110,
      align: 'center',
      render: (_: any, record: VoucherItem) => (
        <Space orientation="horizontal" size="small">
          <Tooltip title="Chỉnh sửa voucher">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined className="text-blue-600" />}
              onClick={() => handleOpenEditModal(record)}
              className="hover:bg-blue-50"
            />
          </Tooltip>

          <Tooltip title="Xóa voucher này">
            <Popconfirm
              title="Xác nhận xóa voucher?"
              description={`Bạn có chắc muốn xóa vĩnh viễn mã giảm giá "${record.code}"?`}
              onConfirm={() => handleDeleteVoucher(record)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined className="text-rose-600" />}
                className="hover:bg-rose-50"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <Card className="rounded-2xl border-slate-200 shadow-xs">
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl shadow-xs">
                <GiftOutlined />
              </div>
              <div>
                <Title level={4} className="!mb-0 text-slate-800">
                  Quản Lý Mã Khuyến Mãi (Voucher)
                </Title>
                <Text className="text-slate-500 text-xs">
                  Thiết lập các chương trình giảm giá và ưu đãi tri ân khách hàng của quán
                </Text>
              </div>
            </div>
          </Col>

          <Col xs={24} md={10} className="flex justify-end gap-2">
            <Button
              icon={<SyncOutlined spin={loading} />}
              onClick={fetchVouchers}
              disabled={loading}
              className="rounded-lg"
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
              className="bg-purple-600 hover:bg-purple-700 border-none rounded-lg font-semibold"
            >
              Tạo Voucher
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 2. Main Table & Filters */}
      <Card className="rounded-2xl border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Tìm theo mã voucher..."
                prefix={<SearchOutlined className="text-slate-400" />}
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="rounded-lg"
              />
            </div>

            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 170 }}
              options={[
                { value: 'ALL', label: 'Tất cả trạng thái' },
                { value: 'ACTIVE', label: 'Đang hoạt động' },
                { value: 'INACTIVE', label: 'Đang tạm dừng' },
                { value: 'EXPIRED', label: 'Đã hết hạn' },
              ]}
              className="rounded-lg"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Tổng cộng: <strong className="text-slate-700">{filteredVouchers.length}</strong> voucher
          </div>
        </div>

        <Table
          dataSource={filteredVouchers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} voucher`,
          }}
          locale={{
            emptyText: 'Chưa có mã khuyến mãi nào',
          }}
        />
      </Card>

      {/* 3. Form Modal */}
      <VoucherFormModal
        isOpen={isModalOpen}
        editingVoucher={editingVoucher}
        restaurantId={currentRestaurantId}
        submitting={submitting}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVoucher(null);
        }}
        onSubmit={handleSubmitVoucher}
      />
    </div>
  );
};

export default MerchantVoucherPage;
