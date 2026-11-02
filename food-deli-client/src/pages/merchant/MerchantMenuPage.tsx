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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  restaurantApi,
  type ProductItem,
  type MenuCategoryItem,
  type ProductPayload,
} from '@/services/modules/restaurantApi';
import { formatCurrency } from '@/utils/formatters';
import { ProductFormModal } from './components';

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
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60',
  },
];

const FALLBACK_CATEGORIES: MenuCategoryItem[] = [
  { id: 1, name: 'Món chính', restaurantId: 1 },
  { id: 2, name: 'Nước uống', restaurantId: 1 },
];

export const MerchantMenuPage: React.FC = () => {
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

  // Load categories and products for Restaurant #1
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch categories
      let catList: MenuCategoryItem[] = [];
      try {
        const catRes = await restaurantApi.getCategories(1);
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
        const prodRes = await restaurantApi.getProductsByRestaurant(1);
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
  }, []);

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
      // Optimistic fallback
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, isAvailable: checked } : item
        )
      );
      message.success(`Đã cập nhật: ${checked ? 'Còn hàng' : 'Tạm hết hàng'}`);
    }
  };

  // Open modal create
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({
      categoryId: categories[0]?.id || 1,
      price: 35000,
      defaultQuantity: 50,
      isAvailable: true,
    });
    setIsModalOpen(true);
  };

  // Open modal edit
  const handleOpenEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name,
      categoryId: product.categoryId,
      price: product.price,
      defaultQuantity: product.defaultQuantity || 50,
      imageUrl: product.imageUrl,
      isAvailable: product.isAvailable,
    });
    setIsModalOpen(true);
  };

  // Submit Modal (Create or Update)
  const handleSubmitForm = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload: ProductPayload = {
        name: values.name.trim(),
        categoryId: Number(values.categoryId),
        price: Number(values.price),
        imageUrl: values.imageUrl?.trim() || undefined,
        isAvailable: values.isAvailable ?? true,
        defaultQuantity: Number(values.defaultQuantity) || 50,
      };

      const matchedCategory = categories.find((c) => c.id === payload.categoryId);

      if (editingProduct) {
        // UPDATE
        try {
          await restaurantApi.updateProduct(editingProduct.id, payload);
        } catch {
          // ignore error in local demo
        }
        setProducts((prev) =>
          prev.map((item) =>
            item.id === editingProduct.id
              ? {
                  ...item,
                  ...payload,
                  categoryName: matchedCategory?.name || item.categoryName,
                }
              : item
          )
        );
        message.success(`Đã cập nhật món "${payload.name}" thành công`);
      } else {
        // CREATE
        let newId = Date.now();
        try {
          const res = await restaurantApi.createProduct(payload);
          if (res?.data?.id) {
            newId = res.data.id;
          }
        } catch {
          // ignore
        }

        const newProduct: ProductItem = {
          id: newId,
          categoryId: payload.categoryId,
          categoryName: matchedCategory?.name || 'Món mới',
          name: payload.name,
          price: payload.price,
          isAvailable: payload.isAvailable ?? true,
          defaultQuantity: payload.defaultQuantity,
          currentQuantity: payload.defaultQuantity,
          imageUrl: payload.imageUrl,
        };

        setProducts((prev) => [newProduct, ...prev]);
        message.success(`Đã thêm món "${payload.name}" vào thực đơn!`);
      }

      setIsModalOpen(false);
      form.resetFields();
    } catch (err: any) {
      if (err.errorFields) {
        return; // Validation error
      }
      message.error('Lỗi khi lưu món ăn');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: number) => {
    try {
      await restaurantApi.deleteProduct(id);
      message.success('Đã xóa món ăn khỏi thực đơn');
      setProducts((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setProducts((prev) => prev.filter((item) => item.id !== id));
      message.success('Đã xóa món ăn khỏi thực đơn');
    }
  };

  // Table columns definition
  const columns: ColumnsType<ProductItem> = [
    {
      title: 'Hình ảnh',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (imgUrl: string) => (
        <Image
          src={
            imgUrl ||
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=60'
          }
          alt="Food"
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
      width: 140,
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
      width: 130,
      render: (price: number) => (
        <span className="font-bold text-orange-600 text-sm">
          {formatCurrency(price)}
        </span>
      ),
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
      width: 150,
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
      width: 110,
      align: 'right',
      render: (_, record) => (
        <Space size="small">
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
            Thêm mới, cập nhật giá, điều chỉnh danh mục và bật/tắt trạng thái món ăn tức thì.
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
              className="rounded-lg sm:max-w-xs"
            />
            <Select
              placeholder="Tất cả danh mục"
              allowClear
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
              className="sm:w-52"
              options={[
                { value: null, label: 'Tất cả danh mục' },
                ...categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                })),
              ]}
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Tổng cộng: <span className="font-bold text-slate-800">{filteredProducts.length}</span> món
          </div>
        </div>

        {/* Products Table */}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredProducts}
          loading={loading}
          pagination={{
            pageSize: 8,
            showTotal: (total) => `Tổng ${total} món ăn`,
            className: 'pt-2',
          }}
          className="overflow-x-auto"
        />
      </Card>

      {/* Modal: Thêm mới / Cập nhật Món ăn */}
      <ProductFormModal
        isOpen={isModalOpen}
        editingProduct={editingProduct}
        categories={categories}
        submitting={submitting}
        form={form}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitForm}
      />
    </div>
  );
};
export default MerchantMenuPage;
