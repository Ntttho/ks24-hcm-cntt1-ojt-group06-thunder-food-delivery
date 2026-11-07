import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Space } from 'antd';
import { AppstoreAddOutlined, EditOutlined, FolderOutlined } from '@ant-design/icons';
import type { MenuCategoryItem } from '@/services/modules/restaurantApi';

interface CategoryFormModalProps {
  isOpen: boolean;
  editingCategory: MenuCategoryItem | null;
  restaurantId: number | string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; restaurantId: number }) => Promise<void>;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  editingCategory,
  restaurantId,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      if (editingCategory) {
        form.setFieldsValue({
          name: editingCategory.name,
        });
      } else {
        form.resetFields();
      }
    }
  }, [isOpen, editingCategory, form]);

  const handleFinish = async (values: { name: string }) => {
    await onSubmit({
      name: values.name.trim(),
      restaurantId: Number(restaurantId),
    });
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2">
          {editingCategory ? (
            <EditOutlined className="text-orange-500 text-lg" />
          ) : (
            <AppstoreAddOutlined className="text-orange-500 text-lg" />
          )}
          <span className="font-bold text-slate-800">
            {editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
          </span>
        </div>
      }
      footer={null}
      destroyOnClose
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="pt-3"
      >
        <Form.Item
          name="name"
          label={<span className="font-semibold text-slate-700">Tên danh mục</span>}
          rules={[
            { required: true, message: 'Vui lòng nhập tên danh mục!' },
            { max: 100, message: 'Tên danh mục không được vượt quá 100 ký tự!' },
          ]}
        >
          <Input
            prefix={<FolderOutlined className="text-slate-400" />}
            placeholder="Ví dụ: Cơm tấm, Trà sữa, Món khai vị..."
            allowClear
            size="large"
          />
        </Form.Item>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Space>
            <Button onClick={onClose} disabled={submitting}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              className="bg-orange-500 hover:bg-orange-600 border-none font-semibold"
            >
              {editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

