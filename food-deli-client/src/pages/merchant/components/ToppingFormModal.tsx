import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Switch, Select, Button, Space } from 'antd';
import { TagsOutlined, DollarOutlined } from '@ant-design/icons';
import type { ToppingItem, CreateToppingPayload, UpdateToppingPayload } from '@/services/modules/restaurantApi';

interface ToppingFormModalProps {
  isOpen: boolean;
  editingTopping: ToppingItem | null;
  restaurantId: number | string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: CreateToppingPayload | UpdateToppingPayload) => Promise<void>;
}

const PRESET_GROUPS = [
  'Topping thêm',
  'Size ly',
  'Độ ngọt',
  'Mức đá',
  'Món ăn kèm',
  'Gia vị / Nước sốt',
];

export const ToppingFormModal: React.FC<ToppingFormModalProps> = ({
  isOpen,
  editingTopping,
  restaurantId,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      if (editingTopping) {
        form.setFieldsValue({
          name: editingTopping.name,
          groupName: editingTopping.groupName || 'Topping thêm',
          price: editingTopping.price,
          isAvailable: editingTopping.isAvailable ?? true,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          groupName: 'Topping thêm',
          price: 10000,
          isAvailable: true,
        });
      }
    }
  }, [isOpen, editingTopping, form]);

  const handleFinish = async (values: any) => {
    const payload = {
      restaurantId: Number(restaurantId),
      name: values.name.trim(),
      groupName: values.groupName?.trim() || 'Topping thêm',
      price: values.price,
      isAvailable: values.isAvailable ?? true,
    };
    await onSubmit(payload);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2">
          <TagsOutlined className="text-orange-500 text-lg" />
          <span className="text-base font-bold text-slate-800">
            {editingTopping ? `Chỉnh sửa topping: ${editingTopping.name}` : 'Thêm mới Topping cho quán'}
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
        className="pt-2"
        requiredMark="optional"
      >
        <Form.Item
          name="name"
          label={<span className="font-semibold text-slate-700">Tên Topping</span>}
          rules={[{ required: true, message: 'Vui lòng nhập tên topping' }]}
        >
          <Input placeholder="Ví dụ: Trân châu trắng, Trứng ốp la, Size L, 50% đường..." maxLength={100} showCount />
        </Form.Item>

        <Form.Item
          name="groupName"
          label={<span className="font-semibold text-slate-700">Nhóm Topping</span>}
          rules={[{ required: true, message: 'Vui lòng chọn hoặc nhập nhóm topping' }]}
          extra="Nhóm topping giúp khách hàng dễ chọn lựa (ví dụ: Size ly, Độ ngọt, Topping thêm...)"
        >
          <Select
            showSearch
            placeholder="Chọn hoặc nhập nhóm topping"
            options={PRESET_GROUPS.map((g) => ({ label: g, value: g }))}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          name="price"
          label={<span className="font-semibold text-slate-700">Giá phụ thu (VNĐ)</span>}
          rules={[{ required: true, message: 'Vui lòng nhập giá tiền topping' }]}
          extra="Nhập 0đ nếu là tùy chọn miễn phí (như 100% đường, đá bình thường)"
        >
          <InputNumber
            className="w-full"
            min={0}
            step={1000}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => (value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0) as any}
            prefix={<DollarOutlined className="text-slate-400" />}
            addonAfter="VNĐ"
          />
        </Form.Item>

        <Form.Item
          name="isAvailable"
          label={<span className="font-semibold text-slate-700">Trạng thái phục vụ</span>}
          valuePropName="checked"
        >
          <Switch checkedChildren="Còn hàng" unCheckedChildren="Hết hàng" />
        </Form.Item>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button onClick={onClose}>Hủy bỏ</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}
            className="font-bold shadow-sm"
          >
            {editingTopping ? 'Lưu thay đổi' : 'Thêm Topping'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
