import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Tabs,
  Modal,
  Form,
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
  AppstoreOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  PercentageOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import {
  restaurantApi,
  type VoucherItem,
  type VoucherCategoryItem,
  type CreateVoucherPayload,
  type UpdateVoucherPayload,
} from '@/services/modules/restaurantApi';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { VoucherFormModal } from '../merchant/components/VoucherFormModal';

const { Title, Text } = Typography;

export const AdminVoucherPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'categories'>('vouchers');

  // System Vouchers state
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState<boolean>(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherItem | null>(null);
  const [submittingVoucher, setSubmittingVoucher] = useState<boolean>(false);

  // Voucher Categories state
  const [categories, setCategories] = useState<VoucherCategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<VoucherCategoryItem | null>(null);
  const [submittingCategory, setSubmittingCategory] = useState<boolean>(false);
  const [categoryForm] = Form.useForm();

  const fetchSystemVouchers = useCallback(async () => {
    setLoadingVouchers(true);
    try {
      const res = await restaurantApi.getVouchers({ scope: 'SYSTEM' });
      setVouchers(Array.isArray(res?.data) ? res.data : []);
    } catch {
      message.error('Không thể tải danh sách voucher toàn hệ thống');
    } finally {
      setLoadingVouchers(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await restaurantApi.getVoucherCategories();
      setCategories(Array.isArray(res?.data) ? res.data : []);
    } catch {
      message.error('Không thể tải danh sách danh mục voucher');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemVouchers();
    fetchCategories();
  }, [fetchSystemVouchers, fetchCategories]);

  const filteredVouchers = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const now = new Date();

    return vouchers.filter((v) => {
      const matchesSearch =
        q === '' ||
        v.code.toLowerCase().includes(q) ||
        (v.voucherCategory && v.voucherCategory.toLowerCase().includes(q));

      const cat = (v.voucherCategory || 'DISCOUNT_FOOD').toUpperCase();
      const matchesCategory = categoryFilter === 'ALL' || cat === categoryFilter;

      const isExpired = v.expiryDate ? new Date(v.expiryDate) < now : false;
      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchesStatus = !!v.isActive && !isExpired;
      } else if (statusFilter === 'INACTIVE') {
        matchesStatus = !v.isActive && !isExpired;
      } else if (statusFilter === 'EXPIRED') {
        matchesStatus = isExpired;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [vouchers, searchText, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const activeCount = vouchers.filter(
      (v) => v.isActive && (!v.expiryDate || new Date(v.expiryDate) >= now)
    ).length;
    const totalUsed = vouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0);
    return {
      totalVouchers: vouchers.length,
      activeCount,
      totalUsed,
      totalCategories: categories.length,
    };
  }, [vouchers, categories]);

  const handleSubmitVoucher = async (values: CreateVoucherPayload | UpdateVoucherPayload) => {
    setSubmittingVoucher(true);
    try {
      if (editingVoucher) {
        await restaurantApi.updateVoucher(editingVoucher.id, values as UpdateVoucherPayload);
        message.success(`Đã cập nhật voucher toàn sàn "${editingVoucher.code}"`);
      } else {
        await restaurantApi.createVoucher({
          ...(values as CreateVoucherPayload),
          restaurantId: undefined,
        });
        message.success('Đã tạo voucher toàn hệ thống thành công!');
      }
      setIsVoucherModalOpen(false);
      setEditingVoucher(null);
      fetchSystemVouchers();
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Không thể lưu voucher');
    } finally {
      setSubmittingVoucher(false);
    }
  };

  const handleToggleVoucher = async (voucher: VoucherItem) => {
    try {
      await restaurantApi.toggleVoucher(voucher.id);
      message.success(`Đã cập nhật trạng thái "${voucher.code}"`);
      setVouchers((prev) =>
        prev.map((v) => (v.id === voucher.id ? { ...v, isActive: !v.isActive } : v))
      );
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể đổi trạng thái voucher');
    }
  };

  const handleDeleteVoucher = async (voucher: VoucherItem) => {
    try {
      await restaurantApi.deleteVoucher(voucher.id);
      message.success(`Đã xóa voucher "${voucher.code}"`);
      fetchSystemVouchers();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể xóa voucher');
    }
  };

  // Category Handlers
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    categoryForm.resetFields();
    categoryForm.setFieldsValue({ isActive: true });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: VoucherCategoryItem) => {
    setEditingCategory(cat);
    categoryForm.setFieldsValue({
      code: cat.code,
      name: cat.name,
      description: cat.description,
      isActive: cat.isActive ?? true,
    });
    setIsCategoryModalOpen(true);
  };

  const handleSubmitCategory = async (values: any) => {
    setSubmittingCategory(true);
    try {
      if (editingCategory) {
        await restaurantApi.updateVoucherCategory(editingCategory.id, {
          name: values.name,
          description: values.description,
          isActive: values.isActive,
        });
        message.success(`Đã cập nhật danh mục "${editingCategory.code}"`);
      } else {
        await restaurantApi.createVoucherCategory({
          code: values.code.trim().toUpperCase(),
          name: values.name.trim(),
          description: values.description?.trim(),
          isActive: values.isActive ?? true,
        });
        message.success('Đã tạo danh mục voucher mới!');
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Không thể lưu danh mục');
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleToggleCategory = async (cat: VoucherCategoryItem) => {
    try {
      await restaurantApi.toggleVoucherCategory(cat.id);
      message.success(`Đã cập nhật trạng thái danh mục "${cat.code}"`);
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
      );
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể đổi trạng thái danh mục');
    }
  };

  const handleDeleteCategory = async (cat: VoucherCategoryItem) => {
    try {
      await restaurantApi.deleteVoucherCategory(cat.id);
      message.success(`Đã xóa danh mục "${cat.code}"`);
      fetchCategories();
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Không thể xóa danh mục đang được sử dụng');
    }
  };

  const voucherColumns: ColumnsType<VoucherItem> = [
    {
      title: 'Mã & Danh mục',
      key: 'code',
      render: (_: any, record: VoucherItem) => (
        <div className="flex flex-col gap-1 items-start">
          <div className="flex items-center gap-1.5">
            <Tag color="volcano" className="font-mono font-bold text-xs uppercase px-2 py-0.5 m-0">
              <GlobalOutlined className="mr-1" />
              {record.code}
            </Tag>
            <Tag
              color={
                record.voucherCategory === 'FREESHIP'
                  ? 'cyan'
                  : record.voucherCategory === 'NEW_USER'
                  ? 'gold'
                  : 'blue'
              }
              className="text-[11px] font-semibold m-0"
            >
              {record.voucherCategory || 'DISCOUNT_FOOD'}
            </Tag>
          </div>
          <span className="text-[11px] text-slate-400">Áp dụng tất cả quán ăn</span>
        </div>
      ),
    },
    {
      title: 'Mức ưu đãi',
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
      title: 'Hiệu lực',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (expiry: string, record: VoucherItem) => {
        const isExpired = expiry ? new Date(expiry) < new Date() : false;
        return (
          <div className="space-y-0.5 text-xs">
            {record.startDate && <div className="text-slate-400">Từ: {formatDate(record.startDate)}</div>}
            <div className={isExpired ? 'text-rose-500 font-semibold' : 'text-slate-600'}>
              <ClockCircleOutlined className="mr-1 text-[11px]" />
              Đến: {expiry ? formatDate(expiry) : 'Vô thời hạn'}
            </div>
            {isExpired && <Tag color="error" className="text-[10px] m-0">Hết hạn</Tag>}
          </div>
        );
      },
    },
    {
      title: 'Trạng thái',
      key: 'isActive',
      width: 110,
      align: 'center',
      render: (_: any, record: VoucherItem) => {
        const isExpired = record.expiryDate ? new Date(record.expiryDate) < new Date() : false;
        return (
          <Switch
            checked={!!record.isActive && !isExpired}
            disabled={isExpired}
            onChange={() => handleToggleVoucher(record)}
            checkedChildren="Bật"
            unCheckedChildren="Tắt"
          />
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_: any, record: VoucherItem) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined className="text-blue-600" />}
              onClick={() => {
                setEditingVoucher(record);
                setIsVoucherModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa voucher toàn hệ thống?"
            description={`Xác nhận xóa mã "${record.code}"?`}
            onConfirm={() => handleDeleteVoucher(record)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" icon={<DeleteOutlined className="text-rose-600" />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const categoryColumns: ColumnsType<VoucherCategoryItem> = [
    {
      title: 'Mã danh mục',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      render: (code: string) => (
        <Tag color="geekblue" className="font-mono font-bold text-xs px-2.5 py-0.5">
          {code}
        </Tag>
      ),
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span className="font-semibold text-slate-800">{name}</span>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (desc?: string) => (
        <span className="text-xs text-slate-500">{desc || 'Không có mô tả'}</span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'isActive',
      width: 120,
      align: 'center',
      render: (_: any, record: VoucherCategoryItem) => (
        <Switch
          checked={!!record.isActive}
          onChange={() => handleToggleCategory(record)}
          checkedChildren="Bật"
          unCheckedChildren="Tắt"
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_: any, record: VoucherCategoryItem) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined className="text-blue-600" />}
            onClick={() => handleOpenEditCategory(record)}
          />
          <Popconfirm
            title="Xóa danh mục voucher?"
            description={`Bạn chắc chắn muốn xóa danh mục "${record.code}"?`}
            onConfirm={() => handleDeleteCategory(record)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" icon={<DeleteOutlined className="text-rose-600" />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 text-slate-800">
            Quản Lý Voucher &amp; Danh Mục Khuyến Mãi Toàn Sàn
          </Title>
          <Text className="text-slate-500 text-sm">
            Phát hành mã giảm giá toàn hệ thống (System Voucher: Freeship, Khách mới, Giảm món) và quản lý danh mục voucher.
          </Text>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            icon={<SyncOutlined spin={loadingVouchers || loadingCategories} />}
            onClick={() => {
              fetchSystemVouchers();
              fetchCategories();
            }}
            className="rounded-lg font-semibold"
          >
            Làm mới
          </Button>
          {activeTab === 'vouchers' ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingVoucher(null);
                setIsVoucherModalOpen(true);
              }}
              className="bg-orange-500 hover:bg-orange-600 border-none rounded-lg font-semibold"
            >
              Tạo Voucher Toàn Sàn
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateCategory}
              className="bg-orange-500 hover:bg-orange-600 border-none rounded-lg font-semibold"
            >
              Thêm Danh Mục
            </Button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card className="rounded-2xl border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-400 font-semibold">Tổng Voucher Toàn Sàn</div>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">{stats.totalVouchers}</div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="rounded-2xl border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-400 font-semibold">Đang Hoạt Động</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.activeCount}</div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="rounded-2xl border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-400 font-semibold">Tổng Lượt Đã Dùng</div>
            <div className="text-2xl font-extrabold text-orange-600 mt-1">{stats.totalUsed}</div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="rounded-2xl border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-400 font-semibold">Danh Mục Voucher</div>
            <div className="text-2xl font-extrabold text-blue-600 mt-1">{stats.totalCategories}</div>
          </Card>
        </Col>
      </Row>

      {/* Main Card with Tabs */}
      <Card className="rounded-2xl shadow-sm border-slate-200">
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as 'vouchers' | 'categories')}
          className="font-semibold"
          items={[
            {
              key: 'vouchers',
              label: (
                <span className="flex items-center gap-1.5">
                  <GiftOutlined />
                  Voucher Toàn Hệ Thống ({vouchers.length})
                </span>
              ),
              children: (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Input
                        placeholder="Tìm mã hoặc danh mục..."
                        prefix={<SearchOutlined className="text-slate-400" />}
                        allowClear
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-64 rounded-lg"
                      />
                      <Select
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        className="w-48"
                        options={[
                          { value: 'ALL', label: 'Tất cả danh mục' },
                          ...categories.map((c) => ({ value: c.code, label: `${c.name} (${c.code})` })),
                        ]}
                      />
                      <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        className="w-44"
                        options={[
                          { value: 'ALL', label: 'Tất cả trạng thái' },
                          { value: 'ACTIVE', label: 'Đang hoạt động' },
                          { value: 'INACTIVE', label: 'Tạm ngừng' },
                          { value: 'EXPIRED', label: 'Đã hết hạn' },
                        ]}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      Hiển thị <strong>{filteredVouchers.length}</strong> voucher toàn sàn
                    </span>
                  </div>

                  <Table
                    dataSource={filteredVouchers}
                    columns={voucherColumns}
                    rowKey="id"
                    loading={loadingVouchers}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'Chưa có voucher toàn hệ thống nào' }}
                  />
                </div>
              ),
            },
            {
              key: 'categories',
              label: (
                <span className="flex items-center gap-1.5">
                  <AppstoreOutlined />
                  Danh Mục Voucher ({categories.length})
                </span>
              ),
              children: (
                <div className="space-y-4 pt-2">
                  <Table
                    dataSource={categories}
                    columns={categoryColumns}
                    rowKey="id"
                    loading={loadingCategories}
                    pagination={false}
                    locale={{ emptyText: 'Chưa có danh mục voucher nào' }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Reuse VoucherFormModal in ADMIN mode */}
      <VoucherFormModal
        isOpen={isVoucherModalOpen}
        editingVoucher={editingVoucher}
        scopeMode="ADMIN"
        submitting={submittingVoucher}
        onClose={() => {
          setIsVoucherModalOpen(false);
          setEditingVoucher(null);
        }}
        onSubmit={handleSubmitVoucher}
      />

      {/* Category Modal */}
      <Modal
        open={isCategoryModalOpen}
        onCancel={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        title={
          <span className="font-bold text-slate-800">
            {editingCategory ? 'Chỉnh Sửa Danh Mục Voucher' : 'Thêm Danh Mục Voucher Mới'}
          </span>
        }
        footer={null}
        destroyOnClose
        centered
      >
        <Form form={categoryForm} layout="vertical" onFinish={handleSubmitCategory} className="pt-3">
          <Form.Item
            name="code"
            label={<span className="font-semibold">Mã danh mục (Code)</span>}
            rules={[
              { required: !editingCategory, message: 'Vui lòng nhập mã danh mục!' },
              {
                pattern: /^[A-Za-z0-9_]{2,50}$/,
                message: 'Chỉ gồm chữ, số, gạch dưới (VD: FREESHIP, FLASH_SALE)',
              },
            ]}
          >
            <Input
              disabled={!!editingCategory}
              placeholder="Ví dụ: FREESHIP, DISCOUNT_FOOD, NEW_USER"
              className="uppercase font-mono"
            />
          </Form.Item>
          <Form.Item
            name="name"
            label={<span className="font-semibold">Tên danh mục</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
          >
            <Input placeholder="Ví dụ: Miễn phí vận chuyển" />
          </Form.Item>
          <Form.Item name="description" label={<span className="font-semibold">Mô tả</span>}>
            <Input.TextArea rows={3} placeholder="Mô tả phạm vi áp dụng của nhóm voucher này" />
          </Form.Item>
          <Form.Item name="isActive" label={<span className="font-semibold">Kích hoạt</span>} valuePropName="checked">
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setIsCategoryModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submittingCategory}
              className="bg-orange-500 hover:bg-orange-600 border-none"
            >
              {editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminVoucherPage;

