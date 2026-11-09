import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  FolderOpenOutlined,
  AppstoreOutlined,
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
  const outletContext = useOutletContext<{ restaurantId?: number; activeRestaurant?: any }>();
  const currentRestaurantId = outletContext?.restaurantId || (user as any)?.restaurantId || 1;

  const [categories, setCategories] = useState<MenuCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');

  // Modal Create/Edit state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategoryItem | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch Categories from API
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await restaurantApi.getCategories(currentRestaurantId);
      if (res && res.data) {
        setCategories(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      message.error('Không thể tải danh sách danh mục món ăn');
    } finally {
      setLoading(false);
    }
  }, [currentRestaurantId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Client-side search filtering
  const filteredCategories = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchText]);

  // Handle open create modal
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (cat: MenuCategoryItem) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  // Handle submit create or update
  const handleSubmitCategory = async (values: { name: string; restaurantId: number }) => {
    setSubmitting(true);
    try {
      if (editingCategory) {
        await restaurantApi.updateCategory(editingCategory.id, {
          name: values.name,
          restaurantId: values.restaurantId,
        });
        message.success(`Đã cập nhật danh mục "${values.name}" thành công!`);
      } else {
        await restaurantApi.createCategory({
          name: values.name,
          restaurantId: values.restaurantId,
        });
        message.success(`Đã thêm danh mục mới "${values.name}" thành công!`);
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err?.message || 'Có lỗi xảy ra, vui lòng thử lại';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (cat: MenuCategoryItem) => {
    try {
      await restaurantApi.deleteCategory(cat.id);
      message.success(`Đã xóa danh mục "${cat.name}"`);
      fetchCategories();
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        'Không thể xóa danh mục. Vui lòng đảm bảo không còn món ăn nào thuộc danh mục này.';
      message.error(errorMsg);
    }
  };

  // Table columns definition
  const columns: ColumnsType<MenuCategoryItem> = [
    {
      title: 'Mã',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <span className="font-mono text-slate-500 text-xs">#{id}</span>,
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <FolderOpenOutlined className="text-base" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 text-sm">{name}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Số món ăn',
      key: 'itemCount',
      width: 140,
      align: 'center',
      render: (_: any, record: MenuCategoryItem) => {
        const c = record.itemCount ?? record.productCount ?? 0;
        return (
          <Tag color={c > 0 ? 'processing' : 'default'} className="font-semibold px-2 py-0.5">
            {c} món
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 130,
      align: 'center',
      render: (_: any, record: MenuCategoryItem) => {
        const hasItems = (record.itemCount ?? record.productCount ?? 0) > 0;
        return (
          <Space size="small">
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined className="text-blue-600" />}
                onClick={() => handleOpenEditModal(record)}
                className="hover:bg-blue-50"
              />
            </Tooltip>

            <Tooltip
              title={
                hasItems
                  ? 'Danh mục đang có món ăn, xóa sẽ thất bại nếu còn món!'
                  : 'Xóa danh mục này'
              }
            >
              <Popconfirm
                title="Xác nhận xóa danh mục?"
                description={
                  hasItems
                    ? `Danh mục "${record.name}" hiện có ${record.itemCount ?? record.productCount} món ăn. Bạn có chắc muốn xóa?`
                    : `Bạn có chắc muốn xóa danh mục "${record.name}"?`
                }
                onConfirm={() => handleDeleteCategory(record)}
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
        );
      },
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
                <AppstoreOutlined />
              </div>
              <div>
                <Title level={4} className="!mb-0 text-slate-800">
                  Quản Lý Danh Mục Món Ăn
                </Title>
                <Text className="text-slate-500 text-xs">
                  Phân loại và sắp xếp các nhóm món ăn trong thực đơn của quán
                </Text>
              </div>
            </div>
          </Col>

          <Col xs={24} md={10} className="flex justify-end gap-2">
            <Button
              icon={<SyncOutlined spin={loading} />}
              onClick={fetchCategories}
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
              Thêm Danh Mục
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 2. Main Table & Filter */}
      <Card className="rounded-2xl border-slate-200 shadow-xs">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Tìm theo tên danh mục..."
              prefix={<SearchOutlined className="text-slate-400" />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="rounded-lg"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Tổng cộng: <strong className="text-slate-700">{filteredCategories.length}</strong> danh mục
          </div>
        </div>

        <Table
          dataSource={filteredCategories}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} danh mục`,
          }}
          locale={{
            emptyText: 'Chưa có danh mục nào',
          }}
        />
      </Card>

      {/* 3. Form Modal */}
      <CategoryFormModal
        isOpen={isModalOpen}
        editingCategory={editingCategory}
        restaurantId={currentRestaurantId}
        submitting={submitting}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleSubmitCategory}
      />
    </div>
  );
};

export default MerchantCategoryPage;
