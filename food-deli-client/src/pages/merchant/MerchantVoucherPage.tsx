import React, { useState, useEffect, useMemo } from 'react';
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
  Empty,
  Progress,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
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
} from '@/services/modules/restaurantApi';
import { formatCurrency } from '@/utils/formatters';
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  const loadVouchers = async () => {
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
  };

  useEffect(() => {
    loadVouchers();
  }, [currentRestaurantId]);

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success(`Đã sao chép mã voucher: ${code}`);
  };

  // Toggle Voucher status
  const handleToggleStatus = async (record: VoucherItem, checked: boolean) => {
    try {
      await restaurantApi.toggleVoucherStatus(record.id, checked);
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

  // Handle Create Voucher
  const handleCreateVoucher = async (payload: CreateVoucherPayload) => {
    setModalLoading(true);
    try {
      await restaurantApi.createVoucher(payload);
      message.success(`Tạo mã voucher "${payload.code}" thành công! Khách hàng có thể nhập mã ngay khi đặt món.`);
      setIsModalOpen(false);
      await loadVouchers();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra, vui lòng thử lại';
      message.error(msg);
    } finally {
      setModalLoading(false);
    }
  };

  // Filtered Vouchers
  const filteredVouchers = useMemo(() => {
    const now = dayjs();
    return vouchers.filter((v) => {
      const matchSearch =
        searchText.trim() === '' ||
        v.code.toLowerCase().includes(searchText.toLowerCase());

      const isExpired = v.expiryDate && dayjs(v.expiryDate).isBefore(now);

      let matchStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchStatus = v.isActive && !isExpired;
      } else if (statusFilter === 'INACTIVE') {
        matchStatus = !v.isActive && !isExpired;
      } else if (statusFilter === 'EXPIRED') {
        matchStatus = !!isExpired;
      }

      return matchSearch && matchStatus;
    });
  }, [vouchers, searchText, statusFilter]);

  // Statistics
  const now = dayjs();
  const totalCount = vouchers.length;
  const activeCount = useMemo(
    () => vouchers.filter((v) => v.isActive && (!v.expiryDate || dayjs(v.expiryDate).isAfter(now))).length,
    [vouchers]
  );
  const totalUsedCount = useMemo(
    () => vouchers.reduce((sum, v) => sum + (v.usedCount ?? 0), 0),
    [vouchers]
  );

  const columns: ColumnsType<VoucherItem> = [
    {
      title: 'Mã Voucher',
      dataIndex: 'code',
      key: 'code',
      width: 220,
      render: (code: string, record: VoucherItem) => {
        const isExpired = record.expiryDate && dayjs(record.expiryDate).isBefore(dayjs());
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-500 flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-2xs">
              <GiftOutlined />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-800 text-sm tracking-wide font-mono">
                  {code}
                </span>
                <Tooltip title="Sao chép mã voucher">
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined className="text-slate-400 hover:text-orange-500 text-xs" />}
                    onClick={() => handleCopyCode(code)}
                    className="h-6 w-6 p-0"
                  />
                </Tooltip>
              </div>
              <div className="text-[11px] text-slate-400">
                {record.restaurantId ? 'Voucher riêng của quán' : 'Voucher toàn sàn'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Mức Giảm Giá',
      key: 'discount',
      render: (_, record: VoucherItem) => {
        if (record.discountType === 'PERCENTAGE') {
          return (
            <div>
              <Tag color="red" className="font-bold text-xs px-2 py-0.5 rounded-full border-none">
                Giảm {record.discountValue}%
              </Tag>
              {record.maxDiscountAmount ? (
                <div className="text-xs text-slate-500 mt-1">
                  Tối đa: <span className="font-semibold text-slate-700">{formatCurrency(record.maxDiscountAmount)}</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 mt-1">Không giới hạn trần</div>
              )}
            </div>
          );
        }
        return (
          <div>
            <Tag color="orange" className="font-bold text-xs px-2 py-0.5 rounded-full border-none">
              Giảm {formatCurrency(record.discountValue)}
            </Tag>
            <div className="text-xs text-slate-400 mt-1">Trừ thẳng vào hóa đơn</div>
          </div>
        );
      },
    },
    {
      title: 'Điều kiện Đơn hàng',
      key: 'condition',
      render: (_, record: VoucherItem) => {
        const minOrder = record.minOrderValue ?? 0;
        return (
          <div className="text-xs">
            {minOrder > 0 ? (
              <div>
                Đơn tối thiểu: <span className="font-bold text-slate-800">{formatCurrency(minOrder)}</span>
              </div>
            ) : (
              <span className="text-emerald-600 font-semibold">Mọi giá trị đơn hàng</span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Hạn Sử Dụng',
      key: 'expiry',
      render: (_, record: VoucherItem) => {
        const isExpired = record.expiryDate && dayjs(record.expiryDate).isBefore(dayjs());
        const daysLeft = record.expiryDate ? dayjs(record.expiryDate).diff(dayjs(), 'day') : null;

        return (
          <div className="flex flex-col text-xs">
            {isExpired ? (
              <Tag color="default" className="w-fit font-semibold text-[11px] mb-1">
                Đã hết hạn
              </Tag>
            ) : daysLeft !== null && daysLeft <= 3 ? (
              <Tag color="warning" className="w-fit font-semibold text-[11px] mb-1 animate-pulse">
                Sắp hết hạn (còn {daysLeft} ngày)
              </Tag>
            ) : (
              <Tag color="success" className="w-fit font-semibold text-[11px] mb-1">
                Còn hiệu lực
              </Tag>
            )}
            <span className="text-slate-500">
              {record.expiryDate ? dayjs(record.expiryDate).format('DD/MM/YYYY HH:mm') : 'Vô thời hạn'}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Số Lượt Còn Lại',
      key: 'usage',
      width: 170,
      render: (_, record: VoucherItem) => {
        const used = record.usedCount ?? 0;
        const limit = record.usageLimit ?? 100;
        const remaining = Math.max(0, limit - used);
        const percent = Math.min(100, Math.round((used / limit) * 100));

        return (
          <div className="w-full">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-700">
                Còn lại: <span className="text-orange-600">{remaining}</span>/{limit}
              </span>
              <span className="text-[11px] text-slate-400">Đã dùng: {used}</span>
            </div>
            <Progress
              percent={percent}
              size="small"
              status={remaining === 0 ? 'exception' : 'active'}
              strokeColor="#f97316"
              showInfo={false}
            />
          </div>
        );
      },
    },
    {
      title: 'Trạng thái Kích hoạt',
      key: 'isActive',
      width: 140,
      align: 'center',
      render: (_, record: VoucherItem) => {
        const isExpired = Boolean(record.expiryDate && dayjs(record.expiryDate).isBefore(dayjs()));
        return (
          <div className="flex flex-col items-center gap-1">
            <Switch
              checked={Boolean(record.isActive && !isExpired)}
              disabled={isExpired}
              onChange={(checked) => handleToggleStatus(record, checked)}
              checkedChildren="Bật"
              unCheckedChildren="Tắt"
              style={{
                backgroundColor: record.isActive && !isExpired ? '#10b981' : undefined,
              }}
            />
            <span
              className={`text-[11px] font-semibold ${
                isExpired
                  ? 'text-slate-400'
                  : record.isActive
                  ? 'text-emerald-600'
                  : 'text-slate-400'
              }`}
            >
              {isExpired ? 'Hết hạn' : record.isActive ? 'Đang áp dụng' : 'Tạm dừng'}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record: VoucherItem) => (
        <Popconfirm
          title={`Xóa voucher "${record.code}"?`}
          description="Khách hàng sẽ không thể nhập mã này tại bước thanh toán nữa."
          onConfirm={() => handleDeleteVoucher(record.id, record.code)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            className="hover:bg-red-50 rounded-lg text-xs"
          >
            Xóa
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 font-extrabold text-slate-800">
            Quản lý Voucher Khuyến Mãi của Quán
          </Title>
          <Text className="text-slate-500 text-sm">
            Tạo và quản lý các chương trình mã giảm giá. Khi kích hoạt, khách hàng có thể áp dụng mã trực tiếp tại bước checkout.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon={<SyncOutlined />}
            onClick={loadVouchers}
            loading={loading}
            className="rounded-xl shadow-2xs text-slate-600 hover:text-orange-500"
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 rounded-xl font-bold text-white shadow-sm"
          >
            + Tạo Voucher Mới
          </Button>
        </div>
      </div>

      {/* Metric Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="rounded-2xl border-slate-200/80 shadow-2xs hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-xl font-bold">
                <GiftOutlined />
              </div>
              <div>
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Tổng số Voucher
                </div>
                <div className="text-2xl font-black text-slate-800">
                  {totalCount} <span className="text-xs text-slate-400 font-normal">mã</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="rounded-2xl border-slate-200/80 shadow-2xs hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold">
                <CheckCircleOutlined />
              </div>
              <div>
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Đang kích hoạt (Dùng được ngay)
                </div>
                <div className="text-2xl font-black text-emerald-600">
                  {activeCount} <span className="text-xs text-slate-400 font-normal">/ {totalCount}</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="rounded-2xl border-slate-200/80 shadow-2xs hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-bold">
                <FireOutlined />
              </div>
              <div>
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Lượt khách đã áp dụng
                </div>
                <div className="text-2xl font-black text-amber-600">
                  {totalUsedCount} <span className="text-xs text-slate-400 font-normal">lượt</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card className="rounded-2xl border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filters bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Tìm theo mã voucher (VD: THUNDER20)..."
              prefix={<SearchOutlined className="text-slate-400 mr-1" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className="w-full sm:w-72 rounded-xl"
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-44 rounded-xl"
              options={[
                { value: 'ALL', label: 'Tất cả trạng thái' },
                { value: 'ACTIVE', label: '🟢 Đang kích hoạt' },
                { value: 'INACTIVE', label: '⚪ Tạm dừng' },
                { value: 'EXPIRED', label: '🔴 Đã hết hạn' },
              ]}
            />
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-orange-600">Lưu ý:</span>
            <span>Khách hàng có thể nhập mã này tại bước thanh toán Checkout để nhận giảm giá.</span>
          </div>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredVouchers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8, showTotal: (total) => `Tổng cộng ${total} mã voucher` }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Quán chưa có chương trình voucher nào. Hãy phát hành mã đầu tiên!"
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsModalOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600 rounded-xl font-semibold text-white"
                >
                  Tạo Voucher ngay
                </Button>
              </Empty>
            ),
          }}
          className="ant-table-striped"
        />
      </Card>

      {/* Voucher Create Modal */}
      <VoucherFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateVoucher}
        restaurantId={currentRestaurantId}
        loading={modalLoading}
      />
    </div>
  );
};

export default MerchantVoucherPage;
