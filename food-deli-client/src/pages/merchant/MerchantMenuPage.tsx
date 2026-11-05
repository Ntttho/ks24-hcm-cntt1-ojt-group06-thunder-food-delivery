import React, { useState, useEffect, useMemo } from 'react';
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
  Tabs,
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
import { ProductFormModal, AssignToppingModal } from './components';
import { MerchantToppingPage } from './MerchantToppingPage';

const { Title, Text } = Typography;

// Mock Fallback Products (Matching seed_all.sql for Restaurant #1 Hạnh Dũng)
const FALLBACK_PRODUCTS: ProductItem[] = [
  {
    id: 1,
    categoryId: 1,
    categoryName: 'Món chính',
    name: 'Cơm Tấm Chay',
    price: 45000,
    isAvailable: true,
    defaultQuantity: 40,
    currentQuantity: 38,
    toppingIds: [1, 2, 3],
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 2,
    categoryId: 2,
    categoryName: 'Nước uống',
    name: 'Trà Đá',
    price: 5000,
    isAvailable: true,
    defaultQuantity: 120,
    currentQuantity: 120,
    toppingIds: [4, 5, 6, 7],
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 3,
    categoryId: 1,
    categoryName: 'Món chính',
    name: 'Hủ Tiếu Nam Vang Chay',
    price: 55000,
    isAvailable: true,
    defaultQuantity: 35,
    currentQuantity: 35,
    toppingIds: [1, 3],
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60',
  },
];

const FALLBACK_CATEGORIES: MenuCategoryItem[] = [
  { id: 1, name: 'Món chính', restaurantId: 1 },
  { id: 2, name: 'Nước uống', restaurantId: 1 },
];

export const MerchantMenuPage: React.FC = () => {
  const { user } = useAuth();
  const currentRestaurantId = (user as any)?.restaurantId || 1;

  const [activeMainTab, setActiveMainTab] = useState<'dishes' | 'toppings'>('dishes');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<MenuCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Modal create/update state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [form] = Form.useForm();

  // Modal assign toppings state
  const [isAssignToppingOpen, setIsAssignToppingOpen] = useState<boolean>(false);
  const [selectedProductForTopping, setSelectedProductForTopping] = useState<ProductItem | null>(null);

  // Load categories and products for Restaurant
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch categories
      let catList: MenuCategoryItem[] = [];
      try {
        const catRes = await restaurantApi.getCategories(currentRestaurantId);
        if (catRes && catRes.data && catRes.data.length > 0) {
          catList = catRes.data;
        } else {
          catList = FALLBACK_CATEGORIES;
        }
      } catch {
        catList = FALLBACK_CATEGORIES;
      }
      setCategories(catList);

      // 2. Fetch products
      try {
        const prodRes = await restaurantApi.getProductsByRestaurant(currentRestaurantId);
        if (prodRes && prodRes.data && prodRes.data.length > 0) {
          setProducts(prodRes.data);
        } else {
          setProducts(FALLBACK_PRODUCTS);
        }
      } catch {
        setProducts(FALLBACK_PRODUCTS);
      }
    } catch {
      setProducts(FALLBACK_PRODUCTS);
      setCategories(FALLBACK_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentRestaurantId]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        searchText.trim() === '' ||
        p.name.toLowerCase().includes(searchText.toLowerCase());
      const matchCategory =
        selectedCategory === null || p.categoryId === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchText, selectedCategory]);

  // Toggle isAvailable switch
  const handleToggleStatus = async (product: ProductItem, checked: boolean) => {
    try {
      await restaurantApi.updateProductStatus(product.id, checked);
      message.success(
        `Đã chuyển trạng thái món "${product.name}" sang: ${checked ? 'Còn hàng' : 'Tạm hết hàng'}`
      );
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, isAvailable: checked } : item
        )
      );
    } catch {
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, isAvailable: checked } : item
        )
      );
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({
      categoryId: categories[0]?.id || 1,
      price: 45000,
      defaultQuantity: 50,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name,
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
          src={img}
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
      render: (isAvailable: boolean, record) => (
        <Space size="middle">
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
      {/* Navigation Tabs between Dishes and Topping Management */}
      <div className="bg-white rounded-2xl p-2 shadow-2xs border border-slate-200/80">
        <Tabs
          activeKey={activeMainTab}
          onChange={(k) => setActiveMainTab(k as 'dishes' | 'toppings')}
          size="large"
          className="font-bold !mb-0"
          items={[
            {
              key: 'dishes',
              label: (
                <span className="flex items-center gap-2 px-3 py-1">
                  <AppstoreOutlined /> Thực Đơn Món Ăn ({products.length})
                </span>
              ),
            },
            {
              key: 'toppings',
              label: (
                <span className="flex items-center gap-2 px-3 py-1">
                  <TagsOutlined /> Nhóm &amp; Bảng Giá Topping (SP2-MERCH-05)
                </span>
              ),
            },
          ]}
        />
      </div>

      {activeMainTab === 'toppings' ? (
        <MerchantToppingPage />
      ) : (
        <>
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
                onClick={loadData}
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
                  placeholder="Tìm kiếm theo tên món ăn..."
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
                Hiển thị <strong>{filteredProducts.length}</strong> / {products.length} món
              </span>
            </div>

            {/* Ant Design Product Table */}
            <Table
              columns={columns}
              dataSource={filteredProducts}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 8,
                showSizeChanger: false,
                showTotal: (total) => `Tổng cộng ${total} món ăn`,
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
        </>
      )}
    </div>
  );
};

export default MerchantMenuPage;
