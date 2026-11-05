import React, { useState, useEffect, useMemo } from 'react';
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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  TagsOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import {
  restaurantApi,
  type ToppingItem,
  type CreateToppingPayload,
  type UpdateToppingPayload,
} from '@/services/modules/restaurantApi';
import { formatCurrency } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { ToppingFormModal } from './components';

const { Title, Text } = Typography;

export const MerchantToppingPage: React.FC = () => {
  const { user } = useAuth();
  const currentRestaurantId = (user as any)?.restaurantId || 1;

  const [toppings, setToppings] = useState<ToppingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Modal Create/Edit state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTopping, setEditingTopping] = useState<ToppingItem | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadToppings = async () => {
    setLoading(true);
    try {
      const res = await restaurantApi.getToppingsByRestaurant(currentRestaurantId);
      if (res && res.data) {
        setToppings(res.data);
      }
    } catch {
      message.error('Không thể tải danh sách topping');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadToppings();
  }, [currentRestaurantId]);

  // Extract distinct groups for filter select
  const distinctGroups = useMemo(() => {
    const set = new Set<string>();
    toppings.forEach((t) => {
      if (t.groupName) set.add(t.groupName.trim());
    });
    return Array.from(set);
  }, [toppings]);

  // Filter toppings by search text and group
  const filteredToppings = useMemo(() => {
    return toppings.filter((t) => {
      const matchSearch =
        searchText.trim() === '' ||
        t.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (t.groupName && t.groupName.toLowerCase().includes(searchText.toLowerCase()));
      const matchGroup =
        selectedGroup === null || t.groupName === selectedGroup;
      return matchSearch && matchGroup;
    });
  }, [toppings, searchText, selectedGroup]);

  // Stats
  const activeCount = useMemo(() => toppings.filter((t) => t.isAvailable).length, [toppings]);
  const outOfStockCount = toppings.length - activeCount;

  // Toggle isAvailable status
  const handleToggleStatus = async (topping: ToppingItem, checked: boolean) => {
    try {
      await restaurantApi.updateToppingStatus(topping.id, checked);
      message.success(
        `Đã chuyển trạng thái topping "${topping.name}" sang: ${checked ? 'Còn hàng' : 'Tạm hết'}`
      );
      setToppings((prev) =>
        prev.map((item) =>
          item.id === topping.id ? { ...item, isAvailable: checked } : item
        )
      );
    } catch {
      message.error('Lỗi khi cập nhật trạng thái topping');
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingTopping(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (topping: ToppingItem) => {
    setEditingTopping(topping);
    setIsModalOpen(true);
  };

  // Delete Topping
  const handleDelete = async (id: number) => {
    try {
      await restaurantApi.deleteTopping(id);
      message.success('Đã xóa topping thành công');
      setToppings((prev) => prev.filter((t) => t.id !== id));
    } catch {
      message.error('Không thể xóa topping');
    }
  };

  // Submit Modal
  const handleSubmitModal = async (values: CreateToppingPayload | UpdateToppingPayload) => {
    setSubmitting(true);
    try {
      if (editingTopping) {
        await restaurantApi.updateTopping(editingTopping.id, values);
        message.success(`Đã cập nhật topping "${values.name}"`);
      } else {
        await restaurantApi.createTopping(values as CreateToppingPayload);
        message.success(`Đã thêm mới topping "${values.name}"`);
      }
      setIsModalOpen(false);
      setEditingTopping(null);
      await loadToppings();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu topping');
    } finally {
      setSubmitting(false);
    }
  };

  const getGroupTagColor = (groupName?: string) => {
    if (!groupName) return 'default';
    const lower = groupName.toLowerCase();
    if (lower.includes('size')) return 'blue';
    if (lower.includes('ngọt') || lower.includes('đường')) return 'green';
    if (lower.includes('đá')) return 'cyan';
    if (lower.includes('thêm')) return 'orange';
    if (lower.includes('kèm')) return 'purple';
    return 'geekblue';
  };

  const columns: ColumnsType<ToppingItem> = [
    {
      title: 'Mã',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      render: (id: number) => <span className="text-slate-400 text-xs">#{id}</span>,
    },
    {
      title: 'Tên Topping',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <span className="font-bold text-slate-800 text-sm">{name}</span>
        </div>
      ),
    },
    {
      title: 'Nhóm Topping',
      dataIndex: 'groupName',
      key: 'groupName',
      width: 170,
      render: (groupName: string) => (
        <Tag color={getGroupTagColor(groupName)} className="font-semibold text-xs px-2.5 py-0.5 rounded-md">
          {groupName || 'Topping thêm'}
        </Tag>
      ),
    },
    {
      title: 'Giá tiền phụ thu',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      render: (price: number) => (
        <span className={`font-bold text-sm ${price === 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
          {price === 0 ? 'Miễn phí (0đ)' : `+${formatCurrency(price)}`}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      width: 150,
      render: (isAvailable: boolean, record) => (
        <Space size="small">
          <Switch
            checked={isAvailable}
            onChange={(checked) => handleToggleStatus(record, checked)}
            checkedChildren="Còn"
            unCheckedChildren="Hết"
            style={{ backgroundColor: isAvailable ? '#10b981' : undefined }}
          />
          <span className={`text-xs font-semibold ${isAvailable ? 'text-emerald-600' : 'text-slate-400'}`}>
            {isAvailable ? 'Còn hàng' : 'Tạm hết'}
          </span>
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 110,
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa topping & giá">
            <Button
              type="text"
              icon={<EditOutlined className="text-blue-500" />}
              onClick={() => handleOpenEdit(record)}
              className="hover:bg-blue-50"
            />
          </Tooltip>
          <Tooltip title="Xóa topping">
            <Popconfirm
              title="Xác nhận xóa topping"
              description={`Bạn có chắc muốn xóa "${record.name}" khỏi danh sách topping của quán?`}
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                className="hover:bg-red-50"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 text-slate-800">
            Quản Lý Nhóm &amp; Bảng Giá Topping
          </Title>
          <Text className="text-slate-500 text-sm">
            Tạo mới các nhóm topping (Size ly, Độ ngọt, Trân châu, Trứng ốp la...), thiết lập phụ thu và gán vào từng món ăn.
          </Text>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            icon={<SyncOutlined spin={loading} />}
            onClick={loadToppings}
            className="rounded-lg hover:border-orange-500 hover:text-orange-500"
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}
            className="rounded-lg font-bold shadow-sm"
          >
            Thêm Topping mới
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-400 font-semibold uppercase">Tổng Topping</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{toppings.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Tất cả các lựa chọn</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-400 font-semibold uppercase">Số nhóm topping</div>
            <div className="text-2xl font-black text-blue-600 mt-1">{distinctGroups.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Phân loại theo nhóm</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-400 font-semibold uppercase">Đang phục vụ</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">Khách có thể chọn</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-2xl border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-400 font-semibold uppercase">Tạm hết hàng</div>
            <div className="text-2xl font-black text-rose-500 mt-1">{outOfStockCount}</div>
            <div className="text-[11px] text-rose-500/80 mt-0.5">Đã tắt trên menu</div>
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card className="rounded-2xl shadow-sm border-slate-200">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <Input
              placeholder="Tìm theo tên topping hoặc nhóm..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className="w-full sm:w-72 rounded-lg"
            />
            <Select
              placeholder="Lọc theo nhóm topping"
              value={selectedGroup}
              onChange={(val) => setSelectedGroup(val)}
              allowClear
              className="w-full sm:w-56"
              options={distinctGroups.map((g) => ({ label: g, value: g }))}
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Hiển thị <strong>{filteredToppings.length}</strong> / {toppings.length} topping
          </span>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredToppings}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `Tổng cộng ${total} topping`,
          }}
          className="rounded-xl overflow-hidden"
        />
      </Card>

      {/* Topping Form Modal */}
      <ToppingFormModal
        isOpen={isModalOpen}
        editingTopping={editingTopping}
        restaurantId={currentRestaurantId}
        submitting={submitting}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTopping(null);
        }}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
};

export default MerchantToppingPage;
