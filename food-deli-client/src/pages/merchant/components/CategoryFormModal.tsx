import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, Space, Tag, Typography } from 'antd';
import { FolderAddOutlined, EditOutlined, AppstoreOutlined } from '@ant-design/icons';
import type { MenuCategoryItem } from '@/services/modules/restaurantApi';

const { Text } = Typography;

interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; displayOrder?: number }) => Promise<void>;
  initialData?: MenuCategoryItem | null;
  loading?: boolean;
}

const PRESET_CATEGORIES = [
  'Món khai vị',
  'Món chính',
  'Trà hoa quả',
  'Tráng miệng',
  'Đồ uống & Trà sữa',
  'Combo tiết kiệm',
  'Món ăn kèm',
  'Đặc sản quán',
];

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const isEditing = !!initialData;

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.setFieldsValue({
          name: initialData.name,
          displayOrder: initialData.displayOrder ?? 0,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          displayOrder: 0,
        });
      }
    }
  }, [open, initialData, form]);

  const handleFinish = async (values: any) => {
    await onSubmit({
      name: values.name.trim(),
      displayOrder: values.displayOrder !== undefined ? Number(values.displayOrder) : undefined,
    });
  };

  const handleSelectPreset = (presetName: string) => {
    form.setFieldsValue({ name: presetName });
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            {isEditing ? <EditOutlined /> : <FolderAddOutlined />}
          </div>
          <div>
            <div className="font-bold text-base">
              {isEditing ? 'Đổi tên / Chỉnh sửa Danh mục' : 'Thêm mới Danh mục Thực đơn'}
            </div>
            <div className="text-xs text-slate-400 font-normal">
              {isEditing
                ? `Cập nhật thông tin danh mục #${initialData?.id}`
                : 'Tạo nhóm món để khách hàng dễ dàng tìm kiếm trên thực đơn'}
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
      width={520}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-4 space-y-4"
        requiredMark={false}
      >
        <Form.Item
          name="name"
          label={<span className="font-semibold text-slate-700">Tên danh mục món</span>}
          rules={[
            { required: true, message: 'Vui lòng nhập tên danh mục!' },
            { max: 100, message: 'Tên danh mục không được vượt quá 100 ký tự!' },
            {
              validator: (_, value) => {
                if (value && value.trim().length === 0) {
                  return Promise.reject(new Error('Tên danh mục không được chỉ chứa khoảng trắng!'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input
            placeholder="Ví dụ: Món khai vị, Món chính, Trà hoa quả..."
            size="large"
            className="rounded-lg"
            maxLength={100}
            showCount
            prefix={<AppstoreOutlined className="text-slate-400 mr-1" />}
          />
        </Form.Item>

        {/* Quick Suggestion Chips */}
        {!isEditing && (
          <div>
            <div className="text-xs text-slate-500 font-medium mb-1.5">
              Gợi ý danh mục phổ biến (Nhấp để chọn nhanh):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CATEGORIES.map((preset) => (
                <Tag
                  key={preset}
                  className="cursor-pointer px-2.5 py-1 text-xs rounded-full border-slate-200 text-slate-600 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                  onClick={() => handleSelectPreset(preset)}
                >
                  + {preset}
                </Tag>
              ))}
            </div>
          </div>
        )}

        <Form.Item
          name="displayOrder"
          label={<span className="font-semibold text-slate-700">Thứ tự hiển thị trên Menu</span>}
          extra="Số nhỏ hơn sẽ hiển thị trước trên thực đơn của khách hàng (0, 1, 2...)"
        >
          <InputNumber
            min={0}
            max={999}
            className="w-full rounded-lg"
            size="large"
            placeholder="0"
          />
        </Form.Item>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <Button onClick={onClose} disabled={loading} className="rounded-lg">
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-sm"
          >
            {isEditing ? 'Lưu thay đổi' : 'Tạo danh mục ngay'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CategoryFormModal;
