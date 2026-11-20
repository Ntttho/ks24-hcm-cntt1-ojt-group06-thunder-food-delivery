import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Tooltip,
  Avatar,
  Modal,
  Popconfirm,
  Badge,
  Descriptions,
  List,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ShopOutlined,
  SearchOutlined,
  SyncOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  StarFilled,
  LockOutlined,
  UnlockOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { restaurantApi, type Shop, type ProductItem } from '@/services/modules/restaurantApi';

const { Title, Text } = Typography;

export const AdminRestaurantPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Shop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [isOpenFilter, setIsOpenFilter] = useState<string>('ALL');
  const [approvalFilter, setApprovalFilter] = useState<string>('ALL');
  const [deletedFilter, setDeletedFilter] = useState<string>('ALL');

  // Server-side pagination states
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Detail Modal states
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [shopProducts, setShopProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);

  // Lock / Unlock action state
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Fetch restaurants
  const fetchRestaurants = useCallback(
    async (
      targetPage: number,
      targetPageSize: number,
      search: string,
      isOpenVal: string,
      approvalVal: string,
      deletedVal: string
    ) => {
      setLoading(true);
      try {
        const isOpenParam = isOpenVal === 'OPEN' ? true : isOpenVal === 'CLOSED' ? false : undefined;
        const approvalParam = approvalVal !== 'ALL' ? approvalVal : undefined;
        const includeDeletedParam = deletedVal === 'DELETED' ? true : deletedVal === 'ACTIVE' ? false : true;

        const res = await restaurantApi.getAdminRestaurants({
          page: targetPage,
          size: targetPageSize,
          search: search.trim() || undefined,
          isOpen: isOpenParam,
          approvalStatus: approvalParam,
          includeDeleted: includeDeletedParam,
        });

        if (res && res.data) {
          const paginated = res.data;
          let list = paginated.content || [];

          // Local refinement if deletedVal === 'DELETED'
          if (deletedVal === 'DELETED') {
            list = list.filter((s: any) => s.deletedAt != null);
          } else if (deletedVal === 'ACTIVE') {
            list = list.filter((s: any) => s.deletedAt == null);
          }

          setRestaurants(list);
          setTotalElements(paginated.totalElements ?? list.length);
        } else {
          setRestaurants([]);
          setTotalElements(0);
        }
      } catch (err: any) {
        message.error(err?.message || 'Không thể tải danh sách quán ăn');
        setRestaurants([]);
        setTotalElements(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchRestaurants(page, pageSize, searchText, isOpenFilter, approvalFilter, deletedFilter);
  }, [fetchRestaurants, page, pageSize, searchText, isOpenFilter, approvalFilter, deletedFilter]);

  // Handle View Detail
  const handleOpenDetail = async (shop: Shop) => {
    setSelectedShop(shop);
    setIsDetailModalOpen(true);
    setLoadingProducts(true);
    try {
      const res = await restaurantApi.getProducts({ restaurantId: shop.id, size: 50 });
      if (res && res.data) {
        const prodData = res.data as any;
        setShopProducts(Array.isArray(prodData) ? prodData : (prodData.content || []));
      } else {
        setShopProducts([]);
      }
    } catch {
      setShopProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle Toggle Lock (Soft-delete / Restore)
  const handleToggleLock = async (shop: Shop) => {
    setActionLoadingId(shop.id);
    try {
      const isLocked = !!(shop as any).deletedAt;
      const res = await restaurantApi.toggleRestaurantLock(
        shop.id,
        isLocked ? undefined : 'Quán bị tạm dừng kinh doanh bởi Quản trị viên'
      );
      if (res && res.data) {
        message.success(
          isLocked
            ? `Đã mở khóa quán ăn "${shop.name}" thành công!`
            : `Đã tạm khóa quán ăn "${shop.name}" thành công!`
        );
        fetchRestaurants(page, pageSize, searchText, isOpenFilter, approvalFilter, deletedFilter);
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Không thể cập nhật trạng thái quán');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Stat computations
  const totalCount = totalElements;
  const activeCount = restaurants.filter((r) => !(r as any).deletedAt && r.isOpen).length;
  const closedCount = restaurants.filter((r) => !(r as any).deletedAt && !r.isOpen).length;
  const lockedCount = restaurants.filter((r) => !!(r as any).deletedAt).length;

  const columns: ColumnsType<Shop> = [
    {
      title: 'Mã Quán',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      render: (id) => <span className="font-mono text-slate-500 font-bold text-xs">#{id}</span>,
    },
    {
      title: 'Thông tin Quán ăn',
      key: 'shopInfo',
      render: (_, record) => (
        <div className="flex items-start gap-3">
          <Avatar
            src={record.imageUrl}
            shape="square"
            size={52}
            icon={<ShopOutlined />}
            className="rounded-xl border border-slate-200 shrink-0 bg-orange-50 text-orange-600"
          />
          <div className="min-w-0">
            <div className="font-bold text-slate-800 text-sm hover:text-orange-600 cursor-pointer" onClick={() => handleOpenDetail(record)}>
              {record.name}
            </div>
            {record.address && (
              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <EnvironmentOutlined className="text-orange-500 text-[11px] shrink-0" />
                <span className="truncate max-w-sm" title={record.address}>{record.address}</span>
              </div>
            )}
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Chủ sở hữu: <span className="font-semibold text-slate-600">Đối tác #{record.ownerId}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Giờ mở cửa',
      key: 'operatingHours',
      width: 150,
      render: (_, record) => {
        const open = record.openingTime ? record.openingTime.substring(0, 5) : '--:--';
        const close = record.closingTime ? record.closingTime.substring(0, 5) : '--:--';
        return (
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <ClockCircleOutlined className="text-slate-400" />
            <span className="font-medium font-mono">{open} - {close}</span>
          </div>
        );
      },
    },
    {
      title: 'Đánh giá',
      dataIndex: 'ratingAvg',
      key: 'ratingAvg',
      width: 110,
      render: (val) => {
        const score = typeof val === 'number' ? val.toFixed(1) : (val ? Number(val).toFixed(1) : '5.0');
        return (
          <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg w-max border border-amber-200/60">
            <StarFilled className="text-amber-500 text-xs" />
            <span>{score}</span>
          </div>
        );
      },
    },
    {
      title: 'Hoạt động',
      key: 'operatingStatus',
      width: 130,
      render: (_, record) => {
        if ((record as any).deletedAt) {
          return (
            <Tag color="error" icon={<CloseCircleOutlined />} className="font-semibold px-2 py-0.5 rounded-md">
              Đã khóa
            </Tag>
          );
        }
        return record.isOpen ? (
          <Tag color="success" icon={<CheckCircleOutlined />} className="font-semibold px-2 py-0.5 rounded-md">
            Mở cửa
          </Tag>
        ) : (
          <Tooltip title={record.temporaryClosedReason || 'Quán đang tạm đóng cửa'}>
            <Tag color="default" icon={<ClockCircleOutlined />} className="font-semibold px-2 py-0.5 rounded-md">
              Đóng cửa
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Duyệt sàn',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 120,
      render: (status) => {
        switch (status?.toUpperCase()) {
          case 'APPROVED':
            return <Tag color="blue" className="font-semibold px-2.5 py-0.5 rounded-md">Đã duyệt</Tag>;
          case 'REJECTED':
            return <Tag color="red" className="font-semibold px-2.5 py-0.5 rounded-md">Từ chối</Tag>;
          case 'PENDING':
          default:
            return <Tag color="warning" icon={<ClockCircleOutlined />} className="font-semibold px-2.5 py-0.5 rounded-md">Chờ duyệt</Tag>;
        }
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 130,
      fixed: 'right',
      render: (_, record) => {
        const isLocked = !!(record as any).deletedAt;
        return (
          <Space size="small">
            <Tooltip title="Xem chi tiết & thực đơn món">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined className="text-slate-600" />}
                onClick={() => handleOpenDetail(record)}
                className="hover:!bg-slate-100 rounded-lg"
              />
            </Tooltip>
            <Tooltip title={isLocked ? 'Mở khóa quán ăn' : 'Tạm khóa quán ăn'}>
              <Popconfirm
                title={isLocked ? 'Mở khóa quán ăn này?' : 'Tạm khóa kinh doanh quán ăn này?'}
                description={
                  isLocked
                    ? `Quán "${record.name}" sẽ được phục hồi và cho phép hoạt động trở lại.`
                    : `Quán "${record.name}" sẽ bị đóng cửa và ẩn khỏi trang tìm kiếm của khách hàng.`
                }
                onConfirm={() => handleToggleLock(record)}
                okText={isLocked ? 'Mở khóa' : 'Khóa quán'}
                cancelText="Hủy"
                okButtonProps={{ danger: !isLocked }}
              >
                <Button
                  type="text"
                  size="small"
                  loading={actionLoadingId === record.id}
                  icon={
                    isLocked ? (
                      <UnlockOutlined className="text-emerald-600" />
                    ) : (
                      <LockOutlined className="text-red-500" />
                    )
                  }
                  className={isLocked ? 'hover:!bg-emerald-50 rounded-lg' : 'hover:!bg-red-50 rounded-lg'}
                />
              </Popconfirm>
            </Tooltip>
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
            <ShopOutlined className="text-orange-500" /> Quản Lý Đối Tác Quán Ăn
          </Title>
          <Text className="text-slate-500 text-sm">
            Danh sách toàn bộ các đối tác nhà hàng, quán ăn trên nền tảng Food Thunder Deli ({totalElements} đối tác).
          </Text>
        </div>
        <Button
          icon={<SyncOutlined spin={loading} />}
          onClick={() => fetchRestaurants(page, pageSize, searchText, isOpenFilter, approvalFilter, deletedFilter)}
          className="rounded-xl border-slate-200"
        >
          Làm mới
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 shadow-sm" bodyStyle={{ padding: '16px' }}>
          <Text className="text-xs text-slate-500 font-medium">Tổng số Quán Ăn</Text>
          <div className="text-2xl font-black text-slate-800 mt-1">{totalCount}</div>
        </Card>
        <Card className="rounded-2xl border-slate-200 shadow-sm" bodyStyle={{ padding: '16px' }}>
          <Text className="text-xs text-emerald-600 font-medium">Đang Mở Cửa</Text>
          <div className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</div>
        </Card>
        <Card className="rounded-2xl border-slate-200 shadow-sm" bodyStyle={{ padding: '16px' }}>
          <Text className="text-xs text-amber-600 font-medium">Đang Đóng Cửa</Text>
          <div className="text-2xl font-black text-amber-600 mt-1">{closedCount}</div>
        </Card>
        <Card className="rounded-2xl border-slate-200 shadow-sm" bodyStyle={{ padding: '16px' }}>
          <Text className="text-xs text-red-500 font-medium">Đã Khóa / Tạm Dừng</Text>
          <div className="text-2xl font-black text-red-500 mt-1">{lockedCount}</div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-2xl shadow-sm border-slate-200" bodyStyle={{ padding: '20px' }}>
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Input
            placeholder="Tìm theo tên quán, địa chỉ hoặc #ID..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full sm:w-80 rounded-xl"
            allowClear
          />

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={isOpenFilter}
              onChange={(val) => {
                setIsOpenFilter(val);
                setPage(0);
              }}
              className="w-36"
              options={[
                { label: 'Giờ mở cửa: Tất cả', value: 'ALL' },
                { label: 'Đang mở cửa', value: 'OPEN' },
                { label: 'Đang đóng cửa', value: 'CLOSED' },
              ]}
            />

            <Select
              value={approvalFilter}
              onChange={(val) => {
                setApprovalFilter(val);
                setPage(0);
              }}
              className="w-36"
              options={[
                { label: 'Duyệt: Tất cả', value: 'ALL' },
                { label: 'Đã duyệt', value: 'APPROVED' },
                { label: 'Chờ duyệt', value: 'PENDING' },
                { label: 'Từ chối', value: 'REJECTED' },
              ]}
            />

            <Select
              value={deletedFilter}
              onChange={(val) => {
                setDeletedFilter(val);
                setPage(0);
              }}
              className="w-40"
              options={[
                { label: 'Tình trạng: Tất cả', value: 'ALL' },
                { label: 'Đang hoạt động', value: 'ACTIVE' },
                { label: 'Đã khóa / Tạm dừng', value: 'DELETED' },
              ]}
            />
          </div>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={restaurants}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page + 1,
            pageSize: pageSize,
            total: totalElements,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            onChange: (p, ps) => {
              setPage(p - 1);
              setPageSize(ps);
            },
            showTotal: (total) => `Tổng cộng ${total} quán ăn`,
          }}
          scroll={{ x: 900 }}
          className="rounded-xl overflow-hidden"
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)} className="rounded-xl">
            Đóng
          </Button>,
        ]}
        width={760}
        title={
          <div className="flex items-center gap-2 text-slate-800">
            <ShopOutlined className="text-orange-500" />
            <span>Chi Tiết Quán Ăn #{selectedShop?.id}</span>
          </div>
        }
      >
        {selectedShop && (
          <div className="space-y-6 pt-2">
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <Avatar
                src={selectedShop.imageUrl}
                shape="square"
                size={72}
                icon={<ShopOutlined />}
                className="rounded-xl border border-slate-200 shrink-0 bg-white text-orange-600"
              />
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold text-slate-800">{selectedShop.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <EnvironmentOutlined className="text-orange-500" />
                  <span>{selectedShop.address}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                  <span>Chủ sở hữu ID: <b>#{selectedShop.ownerId}</b></span>
                  <span>Đánh giá: <b>⭐ {selectedShop.ratingAvg ? Number(selectedShop.ratingAvg).toFixed(1) : '5.0'}</b></span>
                  <span>Giờ mở cửa: <b>{selectedShop.openingTime?.substring(0, 5)} - {selectedShop.closingTime?.substring(0, 5)}</b></span>
                </div>
              </div>
            </div>

            <Descriptions column={2} size="small" bordered className="rounded-xl overflow-hidden">
              <Descriptions.Item label="Trạng thái kinh doanh">
                {selectedShop.isOpen ? (
                  <Tag color="success">Đang mở cửa</Tag>
                ) : (
                  <Tag color="default">Đóng cửa</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái phê duyệt">
                <Tag color={selectedShop.approvalStatus === 'APPROVED' ? 'blue' : 'warning'}>
                  {selectedShop.approvalStatus || 'PENDING'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tọa độ GPS" span={2}>
                Vĩ độ: {selectedShop.latitude} &bull; Kinh độ: {selectedShop.longitude}
              </Descriptions.Item>
              {selectedShop.temporaryClosedReason && (
                <Descriptions.Item label="Lý do đóng cửa" span={2}>
                  <span className="text-amber-600">{selectedShop.temporaryClosedReason}</span>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Menu Products Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-slate-800 text-sm">
                  Thực đơn món ăn ({shopProducts.length} món)
                </div>
              </div>
              <List
                loading={loadingProducts}
                dataSource={shopProducts}
                className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl px-3"
                renderItem={(item) => (
                  <List.Item className="!py-2.5">
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={item.imageUrl}
                          shape="square"
                          size={40}
                          className="rounded-lg border border-slate-200"
                        />
                      }
                      title={<span className="text-sm font-semibold text-slate-800">{item.name}</span>}
                      description={
                        <span className="text-xs text-slate-500">
                          {item.categoryName || 'Món ăn'} &bull; Giá:{' '}
                          <span className="font-bold text-orange-600">
                            {item.price?.toLocaleString('vi-VN')} đ
                          </span>
                        </span>
                      }
                    />
                    <Tag color={item.isAvailable ? 'success' : 'default'} className="rounded-md text-[11px]">
                      {item.isAvailable ? 'Còn món' : 'Hết món'}
                    </Tag>
                  </List.Item>
                )}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminRestaurantPage;
