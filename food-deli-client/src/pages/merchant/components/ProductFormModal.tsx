import React from 'react';
import { Modal, Form, Input, Select, InputNumber, Switch, type FormInstance } from 'antd';
import type { ProductItem, MenuCategoryItem } from '@/services/modules/restaurantApi';
import { ImageUpload } from '@/components/common/ImageUpload';

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
        <div className="font-semibold text-slate-800 text-lg">
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
        className: 'h-10 px-5 font-medium rounded-lg shadow-sm shadow-orange-200 hover:!bg-orange-600',
      }}
      cancelText="Đóng"
      cancelButtonProps={{ className: 'h-10 px-5 rounded-lg border-slate-300 text-slate-600 hover:!border-slate-400' }}
      destroyOnClose
      width={600}
      classNames={{
        header: 'px-6 pt-6 pb-4 border-b border-slate-100 mb-0',
        body: 'px-6 py-5',
        footer: 'px-6 py-4 border-t border-slate-100 mt-0 flex justify-end gap-2.5',
      }}
    >
      <Form form={form} layout="vertical" requiredMark={false} className="flex flex-col gap-4">
        {/* Tên món */}
        <Form.Item
          name="name"
          label={
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-700">Tên món ăn</span>
              <span className="text-red-500 font-bold">*</span>
            </div>
          }
          rules={[{ required: true, message: 'Vui lòng nhập tên món ăn' }]}
          className="!mb-0"
        >
          <Input
            placeholder="Ví dụ: Cơm Sườn Bì Chả Đặc Biệt"
            className="rounded-lg h-10 border-slate-200 focus:border-orange-500 hover:border-orange-300 text-sm shadow-none"
          />
        </Form.Item>

        {/* Mô tả món ăn */}
        <Form.Item
          name="description"
          label={
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Mô tả món ăn</span>
              <span className="text-[11px] text-slate-400 font-normal">(Tùy chọn)</span>
            </div>
          }
          className="!mb-0"
        >
          <Input.TextArea
            rows={3}
            placeholder="Mô tả hương vị, nguyên liệu đặc trưng, khẩu vị (ví dụ: Sườn ướp mật ong thảo mộc nướng than hồng ăn kèm chả trứng hấp)..."
            className="rounded-lg border-slate-200 focus:border-orange-500 hover:border-orange-300 text-sm shadow-none"
          />
        </Form.Item>

        {/* Danh mục & Giá */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Form.Item
            name="categoryId"
            label={
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-700">Danh mục món</span>
                <span className="text-red-500 font-bold">*</span>
              </div>
            }
            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
            className="!mb-0"
          >
            <Select
              placeholder="Chọn danh mục"
              options={categories.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              className="rounded-lg h-10 w-full [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-slate-200"
            />
          </Form.Item>

          <Form.Item
            name="price"
            label={
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-700">Giá bán (VNĐ)</span>
                <span className="text-red-500 font-bold">*</span>
              </div>
            }
            rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
            className="!mb-0"
          >
            <InputNumber
              min={0}
              step={5000}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => (value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0) as any}
              placeholder="45,000"
              className="w-full rounded-lg h-10 flex items-center border-slate-200 text-sm shadow-none"
            />
          </Form.Item>
        </div>

        {/* Khẩu phần & Trạng thái bán */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Form.Item
            name="defaultQuantity"
            label={<span className="text-xs font-semibold text-slate-700">Khẩu phần/ngày</span>}
            className="!mb-0"
          >
            <InputNumber
              min={1}
              max={999}
              defaultValue={50}
              className="w-full rounded-lg h-10 flex items-center border-slate-200 text-sm shadow-none"
            />
          </Form.Item>

          <Form.Item
            name="isAvailable"
            label={<span className="text-xs font-semibold text-slate-700">Trạng thái bán</span>}
            valuePropName="checked"
            className="!mb-0"
          >
            <div className="h-10 flex items-center">
              <Switch
                checkedChildren="Còn hàng"
                unCheckedChildren="Tạm hết"
                className="bg-slate-300 [&.ant-switch-checked]:bg-emerald-500"
              />
            </div>
          </Form.Item>
        </div>

        {/* Thanh nhập liệu chọn file hình ảnh & Khung xem trước */}
        <Form.Item
          name="imageUrl"
          label={
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-700">Hình ảnh món ăn (Tải tệp từ máy tính)</span>
              <span className="text-red-500 font-bold">*</span>
              <span className="text-[11px] text-slate-400 font-normal ml-1">(Hỗ trợ PNG, JPG, WEBP tối đa 5MB)</span>
            </div>
          }
          rules={[{ required: true, message: 'Vui lòng tải lên hoặc chọn tệp ảnh món ăn' }]}
          className="!mb-0"
        >
          <ImageUpload
            folder="foodthunder/products"
            aspectRatio="square"
            placeholderText="Chưa có tệp ảnh. Nhấp 'Duyệt ảnh từ máy' để tải lên Cloudinary..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
