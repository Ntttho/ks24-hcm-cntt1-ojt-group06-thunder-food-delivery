import React from 'react';
import { Modal, Form, Input, Select, InputNumber, Switch, type FormInstance } from 'antd';
import type { ProductItem, MenuCategoryItem } from '@/services/modules/restaurantApi';

interface ProductFormModalProps {
  isOpen: boolean;
  editingProduct: ProductItem | null;
  categories: MenuCategoryItem[];
  submitting: boolean;
  form: FormInstance;
  onClose: () => void;
  onSubmit: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  editingProduct,
  categories,
  submitting,
  form,
  onClose,
  onSubmit,
}) => {
  return (
    <Modal
      title={
        <div className="font-bold text-slate-800 text-base">
          {editingProduct ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Mới Vào Thực Đơn'}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      onOk={onSubmit}
      confirmLoading={submitting}
      okText={editingProduct ? 'Lưu thay đổi' : 'Tạo món ăn'}
      okButtonProps={{
        style: { backgroundColor: '#f97316', borderColor: '#f97316' },
        className: 'font-semibold',
      }}
      cancelText="Đóng"
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="pt-3">
        <Form.Item
          name="name"
          label={<span className="text-xs font-semibold text-slate-700">Tên món ăn</span>}
          rules={[{ required: true, message: 'Vui lòng nhập tên món ăn' }]}
        >
          <Input placeholder="Ví dụ: Cơm Sườn Bì Chả Đặc Biệt" className="rounded-lg" />
        </Form.Item>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Form.Item
            name="categoryId"
            label={<span className="text-xs font-semibold text-slate-700">Danh mục món</span>}
            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
          >
            <Select
              placeholder="Chọn danh mục"
              options={categories.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="price"
            label={<span className="text-xs font-semibold text-slate-700">Giá bán (VNĐ)</span>}
            rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
          >
            <InputNumber
              min={0}
              step={5000}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => (value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0) as any}
              placeholder="Ví dụ: 45000"
              className="w-full rounded-lg"
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Form.Item
            name="defaultQuantity"
            label={<span className="text-xs font-semibold text-slate-700">Số lượng chuẩn bị mỗi ngày</span>}
          >
            <InputNumber min={1} max={999} className="w-full rounded-lg" />
          </Form.Item>

          <Form.Item
            name="isAvailable"
            label={<span className="text-xs font-semibold text-slate-700">Trạng thái mở bán</span>}
            valuePropName="checked"
          >
            <Switch checkedChildren="Còn hàng" unCheckedChildren="Tạm hết" />
          </Form.Item>
        </div>

        <Form.Item
          name="imageUrl"
          label={<span className="text-xs font-semibold text-slate-700">Link hình ảnh món ăn (URL)</span>}
        >
          <Input
            placeholder="https://images.unsplash.com/photo-..."
            className="rounded-lg"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
