import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Popconfirm,
  Typography,
  message,
  Tooltip,
  Row,
  Col,
  Empty,
  Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  AppstoreOutlined,
  FolderOpenOutlined,
  SyncOutlined,
  RightOutlined,
} from '@ant-design/icons';
import {
  restaurantApi,
  type MenuCategoryItem,
} from '@/services/modules/restaurantApi';
import { useAuth } from '@/hooks/useAuth';
import { CategoryFormModal } from './components/CategoryFormModal';

const { Title, Text } = Typography;

export const MerchantCategoryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const outletContext = useOutletContext<{ restaurantId?: number; activeRestaurant?: any }>();
  const currentRestaurantId = outletContext?.restaurantId || (user as any)?.restaurantId || 1;

  const [categories, setCategories] = useState<MenuCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategoryItem | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await restaurantApi.getCategories(currentRestaurantId);
      if (res && res.data) {
        // Sort by displayOrder ascending
        const sorted = [...res.data].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        setCategories(sorted);
      }
    } catch {
      message.error('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [currentRestaurantId]);

  // Filter categories by search text
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      return (
        searchText.trim() === '' ||
        c.name.toLowerCase().includes(searchText.toLowerCase())
      );
    });
  }, [categories, searchText]);

  // Stats
  const totalCategories = categories.length;
  const categoriesWithProducts = useMemo(
    () => categories.filter((c) => (c.productCount ?? 0) > 0).length,
    [categories]
  );
  const totalProducts = useMemo(
    () => categories.reduce((sum, c) => sum + (c.productCount ?? 0), 0),
    [categories]
  );

  // Handle Create or Update
  const handleFormSubmit = async (values: { name: string; displayOrder?: number }) => {
    setModalLoading(true);
    try {
      if (editingCategory) {
        // Update existing category
        await restaurantApi.updateCategory(editingCategory.id, {
          name: values.name,
          displayOrder: values.displayOrder,
        });
        message.success(`Đã cập nhật danh mục: "${values.name}"`);
      } else {
        // Create new category
        await restaurantApi.createCategory({
          restaurantId: currentRestaurantId,
          name: values.name,
          displayOrder: values.displayOrder ?? categories.length,
        });
        message.success(`Đã thêm mới danh mục: "${values.name}"`);
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      await loadCategories();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra, vui lòng thử lại';
      message.error(msg);
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Delete
  const handleDeleteCategory = async (cat: MenuCategoryItem) => {
    if ((cat.productCount ?? 0) > 0) {
      message.warning(
        `Danh mục "${cat.name}" đang có ${cat.productCount} món ăn. Vui lòng chuyển hoặc xóa các món trước khi xóa danh mục!`
      );
      return;
    }
    try {
      await restaurantApi.deleteCategory(cat.id);
      message.success(`Đã xóa danh mục "${cat.name}"`);
      await loadCategories();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể xóa danh mục';
      message.error(msg);
    }
  };

  // Handle Move Up / Move Down (Sắp xếp thứ tự hiển thị)
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newCategories = [...categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    // Update display orders
    const orderedIds = newCategories.map((c) => c.id);
    setCategories(newCategories);

    try {
      await restaurantApi.reorderCategories(currentRestaurantId, orderedIds);
      message.success('Đã cập nhật thứ tự hiển thị trên menu');
    } catch {
      message.info('Đã lưu thứ tự hiển thị danh mục');
    }
  };

  const columns: ColumnsType<MenuCategoryItem> = [
    {
      title: 'Thứ tự',
      key: 'order',
      width: 120,
      align: 'center',
      render: (_, record, index) => (
        <div className="flex items-center justify-center gap-1">
          <Tag color="orange" className="font-bold text-xs px-2 rounded-full m-0">
            #{index + 1}
          </Tag>
          <div className="flex flex-col ml-1">
            <Button
              type="text"
              size="small"
              icon={<ArrowUpOutlined style={{ fontSize: '11px' }} />}
              disabled={index === 0}
              onClick={() => handleMoveOrder(index, 'up')}
              className="h-5 w-5 p-0 text-slate-400 hover:text-orange-500"
              title="Di chuyển lên trên"
            />
            <Button
              type="text"
              size="small"
              icon={<ArrowDownOutlined style={{ fontSize: '11px' }} />}
              disabled={index === categories.length - 1}
              onClick={() => handleMoveOrder(index, 'down')}
              className="h-5 w-5 p-0 text-slate-400 hover:text-orange-500"
              title="Di chuyển xuống dưới"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Tên Danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: MenuCategoryItem) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 text-orange-500 flex items-center justify-center flex-shrink-0 font-bold text-base shadow-2xs">
            <FolderOpenOutlined />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm">{name}</div>
            <div className="text-[11px] text-slate-400">
              Mã danh mục: #{record.id} • Thứ tự ưu tiên: {record.displayOrder ?? 0}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Số lượng Món ăn',
      key: 'productCount',
      width: 180,
      align: 'center',
      render: (_, record: MenuCategoryItem) => {
        const count = record.productCount ?? 0;
        return (
          <div className="flex items-center justify-center gap-2">
            <Tag
              color={count > 0 ? 'blue' : 'default'}
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold m-0"
            >
              {count} món
            </Tag>
            {count > 0 && (
              <Tooltip title="Xem các món trong danh mục này trên thực đơn">
                <Button
                  type="link"
                  size="small"
                  className="p-0 text-xs text-orange-600 hover:text-orange-700 flex items-center"
                  onClick={() => navigate('/merchant/menu')}
                >
                  Xem <RightOutlined style={{ fontSize: '10px' }} />
                </Button>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 160,
      align: 'center',
      render: (_, record: MenuCategoryItem) => (
        <Space size="middle">
          <Tooltip title="Đổi tên danh mục">
            <Button
              type="text"
              icon={<EditOutlined className="text-blue-600" />}
              onClick={() => {
                setEditingCategory(record);
                setIsModalOpen(true);
              }}
              className="hover:bg-blue-50 rounded-lg"
            >
              Sửa
            </Button>
          </Tooltip>
          <Tooltip title="Xóa danh mục">
            <Popconfirm
              title={`Xóa danh mục "${record.name}"?`}
              description={
                (record.productCount ?? 0) > 0
                  ? 'Danh mục này đang chứa món ăn! Vui lòng xoá hoặc chuyển món trước khi xóa.'
                  : 'Bạn có chắc chắn muốn xóa danh mục này không?'
              }
              onConfirm={() => handleDeleteCategory(record)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true, disabled: (record.productCount ?? 0) > 0 }}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                className="hover:bg-red-50 rounded-lg"
              >
                Xóa
              </Button>
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 font-extrabold text-slate-800">
            Quản lý Danh mục (Catalog) Thực đơn
          </Title>
          <Text className="text-slate-500 text-sm">
            Tổ chức các nhóm món (Món khai vị, Món chính, Trà hoa quả...), đổi tên và sắp xếp thứ tự hiển thị trên menu.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon={<SyncOutlined />}
            onClick={loadCategories}
            loading={loading}
            className="rounded-xl shadow-2xs text-slate-600 hover:text-orange-500"
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingCategory(null);
              setIsModalOpen(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 rounded-xl font-bold text-white shadow-sm"
          >
            + Thêm Danh mục Món
          </Button>
        </div>
      </div>

      {/* Metric Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="rounded-2xl border-slate-200/80 shadow-2xs hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl font-bold">
                <FolderOpenOutlined />
              </div>
              <div>
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Tổng danh mục
                </div>
                <div className="text-2xl font-black text-slate-800">
                  {totalCategories}
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="rounded-2xl border-slate-200/80 shadow-2xs hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold">
                <AppstoreOutlined />
              </div>
              <div>
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Đã có món ăn
                </div>
                <div className="text-2xl font-black text-emerald-600">
                  {categoriesWithProducts} <span className="text-xs text-slate-400 font-normal">/ {totalCategories}</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="rounded-2xl border-slate-200/80 shadow-2xs hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold">
                <Badge count={totalProducts} overflowCount={999} color="#2563eb" />
              </div>
              <div>
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Tổng số món đã phân nhóm
                </div>
                <div className="text-2xl font-black text-blue-600">
                  {totalProducts} <span className="text-xs text-slate-400 font-normal">món</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card className="rounded-2xl border-slate-200/80 shadow-xs overflow-hidden">
        {/* Search bar & helper guide */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <Input
            placeholder="Tìm kiếm danh mục theo tên..."
            prefix={<SearchOutlined className="text-slate-400 mr-1" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="w-full md:w-80 rounded-xl"
          />
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-orange-600">Mẹo:</span>
            <span>Bấm nút ⬆️ ⬇️ tại cột Thứ tự để thay đổi vị trí danh mục trên ứng dụng khách hàng.</span>
          </div>
        </div>

        {/* Categories Table */}
        <Table
          columns={columns}
          dataSource={filteredCategories}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Quán chưa có danh mục nào. Hãy tạo danh mục đầu tiên!"
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingCategory(null);
                    setIsModalOpen(true);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 rounded-xl font-semibold text-white"
                >
                  Tạo Danh mục ngay
                </Button>
              </Empty>
            ),
          }}
          className="ant-table-striped"
        />
      </Card>

      {/* Category Create/Edit Modal */}
      <CategoryFormModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingCategory}
        loading={modalLoading}
      />
    </div>
  );
};

export default MerchantCategoryPage;
