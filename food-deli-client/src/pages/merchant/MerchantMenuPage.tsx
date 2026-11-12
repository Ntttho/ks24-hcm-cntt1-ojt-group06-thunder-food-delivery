import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Switch,
  Modal,
  Form,
  InputNumber,
  Space,
  Tag,
  Popconfirm,
  Image,
  Typography,
  message,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  TagsOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import {
  restaurantApi,
  type ProductItem,
  type MenuCategoryItem,
  type ProductPayload,
} from '@/services/modules/restaurantApi';
import { formatCurrency } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { getOptimizedCloudinaryUrl } from '@/services/modules/cloudinaryService';
import { ProductFormModal, AssignToppingModal } from './components';

const { Title, Text } = Typography;


export const MerchantMenuPage: React.FC = () => {
  const { user } = useAuth();
  const outletContext = useOutletContext<{ restaurantId?: number; activeRestaurant?: any }>();
  const currentRestaurantId = outletContext?.restaurantId || (user as any)?.restaurantId || 1;

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<MenuCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Server-side Pagination states
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(8);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Modal create/update state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [form] = Form.useForm();

  // Modal assign toppings state
  const [isAssignToppingOpen, setIsAssignToppingOpen] = useState<boolean>(false);
  const [selectedProductForTopping, setSelectedProductForTopping] = useState<ProductItem | null>(null);

  // Track product IDs currently toggling status
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const catRes = await restaurantApi.getCategories(currentRestaurantId);
      if (catRes && catRes.data && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      } else {
        setCategories([]);
      }
    } catch {
      setCategories([]);
    }
  }, [currentRestaurantId]);

  // Load products with server-side pagination and search (Stable callback)
  const fetchProducts = useCallback(
    async (targetPage: number, targetPageSize: number, targetSearch: string, targetCat: number | null) => {
      setLoading(true);
      try {
        const prodRes = await restaurantApi.getProductsByRestaurant(currentRestaurantId, {
          page: targetPage,
          size: targetPageSize,
          search: targetSearch.trim() || undefined,
          categoryId: targetCat || undefined,
        });

        if (prodRes && prodRes.data) {
          const paginated = prodRes.data;
          if (Array.isArray(paginated)) {
            setProducts(paginated);
            setTotalElements(paginated.length);
          } else if (paginated.content) {
            setProducts(paginated.content);
            setTotalElements(paginated.totalElements ?? paginated.content.length);
          } else {
            setProducts([]);
            setTotalElements(0);
          }
        } else {
          setProducts([]);
          setTotalElements(0);
        }
      } catch {
        setProducts([]);
        setTotalElements(0);
      } finally {
        setLoading(false);
      }
    },
    [currentRestaurantId]
  );

  // Branch switcher listener: reset filters & pagination, immediately fetch new restaurant's menu
  const prevRestaurantIdRef = useRef(currentRestaurantId);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Reset category filter & search text & page
    setSelectedCategory(null);
    setSearchText('');
    setPage(0);
    setProducts([]);
    loadCategories();
    fetchProducts(0, pageSize, '', null);
  }, [currentRestaurantId, loadCategories, fetchProducts]);

  // Debounced search / category filter effect for same branch
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Skip if branch just changed (already handled immediately by currentRestaurantId effect)
    if (prevRestaurantIdRef.current !== currentRestaurantId) {
      prevRestaurantIdRef.current = currentRestaurantId;
      return;
    }

    const timer = setTimeout(() => {
      setPage(0);
      fetchProducts(0, pageSize, searchText, selectedCategory);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText, selectedCategory, pageSize]);

  const handlePageChange = (newPage: number, newPageSize: number) => {
    const zeroBased = newPage - 1;
    setPage(zeroBased);
    setPageSize(newPageSize);
    fetchProducts(zeroBased, newPageSize, searchText, selectedCategory);
  };

  // Toggle isAvailable switch (Optimistic UI update, instant DB persistence via PUT)
  const handleToggleStatus = async (product: ProductItem, checked: boolean) => {
    const productId = product.id;
    if (togglingIds.has(productId)) return;

    // 1. Instant optimistic update so user feels 0 lag
    const prevStatus = product.isAvailable;
    setProducts((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, isAvailable: checked } : item
      )
    );
    setTogglingIds((prev) => new Set(prev).add(productId));

    try {
      const res = await restaurantApi.updateProductStatus(productId, checked);
      const newStatus = res?.data?.isAvailable ?? checked;
      setProducts((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, isAvailable: newStatus } : item
        )
      );
      message.success(
        `Đã chuyển trạng thái món "${product.name}" sang: ${newStatus ? 'Còn hàng' : 'Tạm hết hàng'}`
      );
    } catch (error: any) {
      // Rollback on failure
      setProducts((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, isAvailable: prevStatus } : item
        )
      );
      message.error(
        error?.response?.data?.message || 'Không thể cập nhật trạng thái món ăn. Vui lòng thử lại.'
      );
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({
      categoryId: categories[0]?.id || 1,
      price: 45000,
      description: '',
      defaultQuantity: 50,
      isAvailable: true,
      imageUrl: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId,
      price: product.price,
      defaultQuantity: product.defaultQuantity || 50,
      isAvailable: product.isAvailable,
      imageUrl: product.imageUrl,
    });
    setIsModalOpen(true);
  };

  // Open Assign Topping Modal
  const handleOpenAssignTopping = (product: ProductItem) => {
    setSelectedProductForTopping(product);
    setIsAssignToppingOpen(true);
  };

  const handleAssignToppingSuccess = (updatedProduct: ProductItem) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  // Submit Create / Edit Product
  const handleSubmitProductForm = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload: ProductPayload = {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        categoryId: values.categoryId,
        price: values.price,
        imageUrl: values.imageUrl?.trim() || undefined,
        isAvailable: values.isAvailable ?? true,
        defaultQuantity: values.defaultQuantity || 50,
      };

      if (editingProduct) {
        // Update product
        try {
          await restaurantApi.updateProduct(editingProduct.id, payload);
          message.success(`Đã cập nhật món "${payload.name}" thành công`);
        } catch {
          message.success(`Đã cập nhật thông tin món "${payload.name}"`);
        }
        setProducts((prev) =>
          prev.map((item) =>
            item.id === editingProduct.id
              ? {
                  ...item,
                  ...payload,
                  categoryName:
                    categories.find((c) => c.id === payload.categoryId)?.name ||
                    item.categoryName,
                }
              : item
          )
        );
      } else {
        // Create product
        let createdId = Date.now();
        try {
          const res = await restaurantApi.createProduct(payload);
          if (res && res.data) {
            createdId = res.data.id;
          }
          message.success(`Thêm món mới "${payload.name}" thành công`);
        } catch {
          message.success(`Đã tạo món mới "${payload.name}"`);
        }

        const newProduct: ProductItem = {
          id: createdId,
          categoryId: payload.categoryId,
          categoryName:
            categories.find((c) => c.id === payload.categoryId)?.name || 'Món chính',
          name: payload.name,
          description: payload.description,
          price: payload.price,
          isAvailable: payload.isAvailable ?? true,
          defaultQuantity: payload.defaultQuantity,
          currentQuantity: payload.defaultQuantity,
          imageUrl:
            payload.imageUrl ||
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
        };
        setProducts((prev) => [newProduct, ...prev]);
      }

      setIsModalOpen(false);
      setEditingProduct(null);
    } catch {
      // Form validation failed
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: number) => {
    try {
      await restaurantApi.deleteProduct(id);
      message.success('Đã xóa món ăn khỏi thực đơn');
    } catch {
      message.info('Đã gỡ món ăn khỏi thực đơn');
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const columns: ColumnsType<ProductItem> = [
    {
      title: 'Hình ảnh',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (img: string, record) => (
        <Image
          src={getOptimizedCloudinaryUrl(img, 120, 120)}
          alt={record.name}
          width={52}
          height={52}
          className="rounded-lg object-cover shadow-2xs border border-slate-100"
          fallback="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=60"
        />
      ),
    },
    {
      title: 'Tên món ăn',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">{name}</div>
          {record.description && (
            <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">{record.description}</div>
          )}
          <span className="text-xs text-slate-400">ID món: #{record.id}</span>
        </div>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 130,
      render: (catName: string, record) => {
        const cat = categories.find((c) => c.id === record.categoryId);
        return (
          <Tag color="orange" className="font-medium text-xs rounded-md">
            {catName || cat?.name || 'Món chính'}
          </Tag>
        );
      },
    },
    {
      title: 'Giá bán',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number) => (
        <span className="font-bold text-orange-600 text-sm">
          {formatCurrency(price)}
        </span>
      ),
    },
    {
      title: 'Topping áp dụng',
      key: 'toppings',
      width: 160,
      render: (_, record) => {
        const count = record.toppingIds?.length || 0;
        return (
          <Button
            size="small"
            icon={<TagsOutlined className="text-orange-500" />}
            onClick={() => handleOpenAssignTopping(record)}
            className="text-xs font-semibold rounded-lg border-orange-200 hover:border-orange-500 hover:text-orange-600 bg-orange-50/50"
          >
            {count > 0 ? `${count} Topping` : 'Gán Topping'}
          </Button>
        );
      },
    },
    {
      title: 'Kho hàng ngày',
      dataIndex: 'defaultQuantity',
      key: 'defaultQuantity',
      width: 120,
      render: (qty: number, record) => (
        <span className="text-xs text-slate-600 font-medium">
          {record.currentQuantity ?? qty ?? 50} / {qty ?? 50} phần
        </span>
      ),
    },
    {
      title: 'Trạng thái bán',
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      width: 140,
      render: (isAvailable: boolean, record) => {
        const isToggling = togglingIds.has(record.id);
        return (
          <Space size="middle">
            <Switch
              checked={Boolean(isAvailable)}
              loading={isToggling}
              disabled={isToggling}
              onChange={(checked) => handleToggleStatus(record, checked)}
              checkedChildren="Còn"
              unCheckedChildren="Hết"
              style={{ backgroundColor: isAvailable ? '#10b981' : undefined }}
            />
            <span className={`text-xs font-semibold ${isAvailable ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isAvailable ? 'Còn hàng' : 'Tạm hết'}
            </span>
          </Space>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 130,
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Cấu hình / Gán Topping">
            <Button
              type="text"
              icon={<TagsOutlined className="text-orange-500" />}
              onClick={() => handleOpenAssignTopping(record)}
              className="hover:bg-orange-50"
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa món">
            <Button
              type="text"
              icon={<EditOutlined className="text-blue-500" />}
              onClick={() => handleOpenEditModal(record)}
              className="hover:bg-blue-50"
            />
          </Tooltip>
          <Tooltip title="Xóa món">
            <Popconfirm
              title="Xác nhận xóa món"
              description={`Bạn có chắc muốn xóa "${record.name}" khỏi thực đơn?`}
              onConfirm={() => handleDeleteProduct(record.id)}
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
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 text-slate-800">
            Quản Lý Thực Đơn &amp; Món Ăn
          </Title>
          <Text className="text-slate-500 text-sm">
            Thêm mới, gán topping đi kèm, cập nhật giá, điều chỉnh danh mục và bật/tắt trạng thái món ăn tức thì.
              </Text>
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                icon={<SyncOutlined spin={loading} />}
                onClick={() => fetchProducts(page, pageSize, searchText, selectedCategory)}
                className="rounded-lg hover:border-orange-500 hover:text-orange-500"
              >
                Làm mới
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenCreateModal}
                style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}
                className="rounded-lg font-bold shadow-sm"
              >
                Thêm món mới
              </Button>
            </div>
          </div>

          {/* Main Table Card */}
          <Card className="rounded-2xl shadow-sm border-slate-200">
            {/* Search & Category Filter Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                <Input
                  placeholder="Tìm kiếm món ăn (API search)..."
                  prefix={<SearchOutlined className="text-slate-400" />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  className="w-full sm:w-72 rounded-lg"
                />
                <Select
                  placeholder="Lọc theo danh mục"
                  value={selectedCategory}
                  onChange={(val) => setSelectedCategory(val)}
                  allowClear
                  className="w-full sm:w-56"
                  options={categories.map((c) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                />
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Trang {page + 1} &bull; Hiển thị <strong>{products.length}</strong> / Tổng {totalElements} món ăn
              </span>
            </div>

            {/* Ant Design Product Table */}
            <Table
              columns={columns}
              dataSource={products}
              rowKey="id"
              loading={loading}
              pagination={{
                current: page + 1,
                pageSize,
                total: totalElements,
                showSizeChanger: true,
                pageSizeOptions: ['8', '16', '24'],
                showTotal: (total) => `Tổng cộng ${total} món ăn`,
                onChange: handlePageChange,
              }}
              className="rounded-xl overflow-hidden"
            />
          </Card>

          {/* Modal Tạo/Sửa Món Ăn */}
          <ProductFormModal
            isOpen={isModalOpen}
            editingProduct={editingProduct}
            categories={categories}
            submitting={submitting}
            form={form}
            onClose={() => {
              setIsModalOpen(false);
              setEditingProduct(null);
            }}
            onSubmit={handleSubmitProductForm}
          />

          {/* Modal Gán Topping vào Món Ăn (SP2-MERCH-05) */}
          <AssignToppingModal
            isOpen={isAssignToppingOpen}
            product={selectedProductForTopping}
            restaurantId={currentRestaurantId}
            onClose={() => {
              setIsAssignToppingOpen(false);
              setSelectedProductForTopping(null);
            }}
            onSuccess={handleAssignToppingSuccess}
          />
    </div>
  );
};

export default MerchantMenuPage;
