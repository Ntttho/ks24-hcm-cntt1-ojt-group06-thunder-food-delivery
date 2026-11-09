import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Input,
  Tag,
  Space,
  Modal,
  message,
  Typography,
  Switch,
  Select,
  Tooltip,
  Row,
  Col,
  Progress,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  GiftOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PercentageOutlined,
  DollarOutlined,
  FireOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
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
  const outletContext = useOutletContext<{ restaurantId?: number }>();
  const currentRestaurantId = outletContext?.restaurantId || (user as any)?.restaurantId || 1;

  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED'>('ALL');

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
        setVouchers(res.data);
      }
    } catch {
      message.error('Không thể tải danh sách voucher của quán');
    } finally {
      setLoading(false);
    }
  }, [currentRestaurantId]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success(`Đã sao chép mã voucher: ${code}`);
  };

  // Toggle Voucher status
  const handleToggleStatus = async (record: VoucherItem, checked: boolean) => {
    try {
      if (restaurantApi.toggleVoucherStatus) {
        await restaurantApi.toggleVoucherStatus(record.id, checked);
      } else {
        await restaurantApi.toggleVoucher(record.id);
      }
      setVouchers((prev) =>
        prev.map((v) => (v.id === record.id ? { ...v, isActive: checked } : v))
      );
      message.success(
        checked
          ? `Đã kích hoạt mã "${record.code}" - Khách có thể áp dụng tại checkout!`
          : `Đã tạm dừng mã "${record.code}"`
      );
    } catch {
      message.error('Không thể cập nhật trạng thái voucher');
    }
  };

  // Handle Delete
  const handleDeleteVoucher = async (id: number, code: string) => {
    try {
      await restaurantApi.deleteVoucher(id);
      message.success(`Đã xóa mã voucher: ${code}`);
      setVouchers((prev) => prev.filter((v) => v.id !== id));
    } catch {
      message.error('Không thể xóa voucher');
    }
  };

  // Handle Open Create / Edit Modal
  const handleOpenCreateModal = () => {
    setEditingVoucher(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (voucher: VoucherItem) => {
    setEditingVoucher(voucher);
    setIsModalOpen(true);
  };

  // Handle Submit Voucher (Create or Update)
  const handleSubmitVoucher = async (payload: CreateVoucherPayload | UpdateVoucherPayload) => {
    setSubmitting(true);
    try {
      if (editingVoucher) {
        await restaurantApi.updateVoucher(editingVoucher.id, payload as UpdateVoucherPayload);
        message.success(`Cập nhật mã voucher "${editingVoucher.code}" thành công!`);
      } else {
        await restaurantApi.createVoucher(payload as CreateVoucherPayload);
        message.success(
          `Tạo mã voucher "${(payload as CreateVoucherPayload).code}" thành công! Khách hàng có thể nhập mã ngay khi đặt món.`
        );
      }
      setIsModalOpen(false);
      setEditingVoucher(null);
      await fetchVouchers();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Không thể lưu voucher';
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = vouchers.length;
    const now = dayjs();
    const active = vouchers.filter((v) => {
      const isExp = v.expiryDate ? dayjs(v.expiryDate).isBefore(now) : false;
      return v.isActive && !isExp;
    }).length;
    const expired = vouchers.filter((v) =>
      v.expiryDate ? dayjs(v.expiryDate).isBefore(now) : false
    ).length;
    const totalUsed = vouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0);

    return { total, active, expired, totalUsed };
  }, [vouchers]);

  // Filtered Vouchers
  const filteredVouchers = useMemo(() => {
    const now = dayjs();
    return vouchers.filter((v) => {
      const matchSearch =
        v.code.toLowerCase().includes(searchText.toLowerCase()) ||
        v.discountType.toLowerCase().includes(searchText.toLowerCase());

      const isExpired = v.expiryDate ? dayjs(v.expiryDate).isBefore(now) : false;

      let matchStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchStatus = (v.isActive ?? true) && !isExpired;
      } else if (statusFilter === 'INACTIVE') {
        matchStatus = !v.isActive;
      } else if (statusFilter === 'EXPIRED') {
        matchStatus = isExpired;
      }

      return matchSearch && matchStatus;
    });
  }, [vouchers, searchText, statusFilter]);

  // Table Columns
  const columns: ColumnsType<VoucherItem> = [
    {
      title: 'Mã Voucher',
      dataIndex: 'code',
      key: 'code',
      width: 200,
      render: (code: string, record: VoucherItem) => {
        const isExp = record.expiryDate ? dayjs(record.expiryDate).isBefore(dayjs()) : false;
        return (
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold shadow-xs ${
                record.isActive && !isExp
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <GiftOutlined />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-wide text-slate-800 uppercase font-mono">
                  {code}
                </span>
                <Tooltip title="Sao chép mã">
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined className="text-slate-400 hover:text-orange-500" />}
                    onClick={() => handleCopyCode(code)}
                    className="p-0.5 h-6 w-6"
                  />
                </Tooltip>
              </div>
              <div className="text-[11px] text-slate-400">ID #{record.id}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Loại & Mức giảm',
      key: 'discount',
      width: 220,
      render: (_: any, record: VoucherItem) => {
        const isPercent = record.discountType === 'PERCENTAGE';
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <Tag
                color={isPercent ? 'volcano' : 'green'}
                className="font-bold text-xs rounded-md px-2 py-0.5 border-none"
              >
                {isPercent ? (
                  <>
                    <PercentageOutlined className="mr-1" />
                    Giảm {record.discountValue}%
                  </>
                ) : (
                  <>
                    <DollarOutlined className="mr-1" />
                    Giảm {formatCurrency(record.discountValue || record.discountAmount || 0)}
                  </>
                )}
              </Tag>
            </div>
            {isPercent && record.maxDiscountAmount ? (
              <div className="text-[11px] text-slate-500 mt-1">
                Tối đa: <strong>{formatCurrency(record.maxDiscountAmount)}</strong>
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      title: 'Điều kiện đơn',
      dataIndex: 'minOrderValue',
      key: 'minOrderValue',
      width: 170,
      render: (minOrderValue?: number) => {
        if (!minOrderValue || minOrderValue === 0) {
          return <span className="text-xs text-slate-500">Mọi đơn hàng</span>;
        }
        return (
          <span className="text-xs text-slate-700 font-semibold">
            Từ {formatCurrency(minOrderValue)}
          </span>
        );
      },
    },
    {
      title: 'Lượt sử dụng',
      key: 'usage',
      width: 170,
      render: (_: any, record: VoucherItem) => {
        const used = record.usedCount || 0;
        const limit = record.usageLimit;
        if (!limit) {
          return (
            <div className="text-xs">
              <span className="font-bold text-slate-700">{used}</span>
              <span className="text-slate-400"> (Không giới hạn)</span>
            </div>
          );
        }
        const percent = Math.min(100, Math.round((used / limit) * 100));
        return (
          <div className="w-32">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-bold text-slate-700">
                {used}/{limit}
              </span>
              <span className="text-slate-400">{percent}%</span>
            </div>
            <Progress
              percent={percent}
              size="small"
              showInfo={false}
              strokeColor={percent >= 90 ? '#ef4444' : '#f97316'}
            />
          </div>
        );
      },
    },
    {
      title: 'Thời gian hiệu lực',
      key: 'expiryDate',
      width: 200,
      render: (_: any, record: VoucherItem) => {
        const now = dayjs();
        const isExpired = record.expiryDate ? dayjs(record.expiryDate).isBefore(now) : false;
        const isFuture = record.startDate ? dayjs(record.startDate).isAfter(now) : false;

        return (
          <div>
            <div className="text-xs text-slate-700 flex items-center gap-1">
              <ClockCircleOutlined className="text-slate-400 text-[11px]" />
              <span>{record.expiryDate ? formatDate(record.expiryDate) : 'Vô thời hạn'}</span>
            </div>
            {isExpired ? (
              <Tag color="red" className="text-[10px] rounded mt-1 border-none font-semibold">
                Đã hết hạn
              </Tag>
            ) : isFuture ? (
              <Tag color="blue" className="text-[10px] rounded mt-1 border-none font-semibold">
                Chưa bắt đầu
              </Tag>
            ) : (
              <span className="text-[11px] text-emerald-600 font-medium mt-0.5 inline-block">
                Còn hiệu lực
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Trạng thái',
      key: 'isActive',
      width: 140,
      align: 'center',
      render: (_: any, record: VoucherItem) => {
        const isExp = record.expiryDate ? dayjs(record.expiryDate).isBefore(dayjs()) : false;
        return (
          <div className="flex flex-col items-center gap-1">
            <Switch
              size="small"
              checked={record.isActive ?? true}
              disabled={isExp}
              onChange={(checked) => handleToggleStatus(record, checked)}
              className={record.isActive ? 'bg-orange-500' : 'bg-slate-300'}
            />
            <span className="text-[10px] text-slate-400">
              {isExp ? 'Hết hạn' : record.isActive ? 'Đang mở' : 'Tạm dừng'}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_: any, record: VoucherItem) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa voucher">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined className="text-slate-600 hover:text-orange-500" />}
              onClick={() => handleOpenEditModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa voucher"
            description={`Bạn có chắc chắn muốn xóa mã "${record.code}"?`}
            onConfirm={() => handleDeleteVoucher(record.id, record.code)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa voucher">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
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
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl shadow-xs">
                <GiftOutlined />
              </div>
              <div>
                <Title level={4} className="!mb-0 text-slate-800">
                  Quản Lý Mã Khuyến Mãi (Voucher)
                </Title>
                <Text className="text-slate-500 text-xs">
                  Thiết lập các chương trình giảm giá và ưu đãi cho khách hàng tại bước đặt món
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
              className="bg-orange-500 hover:bg-orange-600 border-none rounded-lg font-semibold text-white"
            >
              Tạo Voucher Mới
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 2. Stat Metric Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border-slate-200 shadow-xs bg-gradient-to-br from-white to-slate-50">
            <div className="text-slate-400 text-xs font-medium">Tổng số voucher</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border-slate-200 shadow-xs bg-gradient-to-br from-white to-emerald-50/40">
            <div className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
              <CheckCircleOutlined /> Đang áp dụng
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border-slate-200 shadow-xs bg-gradient-to-br from-white to-red-50/40">
            <div className="text-red-500 text-xs font-medium flex items-center gap-1">
              <ClockCircleOutlined /> Đã hết hạn
            </div>
            <div className="text-2xl font-bold text-red-500 mt-1">{stats.expired}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border-slate-200 shadow-xs bg-gradient-to-br from-white to-orange-50/40">
            <div className="text-orange-600 text-xs font-semibold flex items-center gap-1">
              <FireOutlined /> Lượt đã sử dụng
            </div>
            <div className="text-2xl font-bold text-orange-600 mt-1">{stats.totalUsed}</div>
          </Card>
        </Col>
      </Row>

      {/* 3. Main Table & Filters */}
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
              onChange={(val) => setStatusFilter(val as any)}
              style={{ width: 180 }}
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
            emptyText: 'Chưa có mã khuyến mãi nào của quán',
          }}
        />
      </Card>

      {/* 4. Form Modal */}
      <VoucherFormModal
        isOpen={isModalOpen}
        open={isModalOpen}
        editingVoucher={editingVoucher}
        restaurantId={currentRestaurantId}
        submitting={submitting}
        loading={submitting}
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
