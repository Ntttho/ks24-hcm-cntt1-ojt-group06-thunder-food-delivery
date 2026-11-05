import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Radio,
  Switch,
  Button,
  message,
} from 'antd';
import {
  EnvironmentOutlined,
  HomeOutlined,
  BankOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import type { UserAddress, AddressRequest } from '@/types';

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAddress: UserAddress | null;
  onSubmit: (values: AddressRequest) => Promise<void>;
  isSubmitting: boolean;
  isFirstAddress?: boolean;
}

export const AddressFormModal: React.FC<AddressFormModalProps> = ({
  isOpen,
  onClose,
  editingAddress,
  onSubmit,
  isSubmitting,
  isFirstAddress = false,
}) => {
  const [form] = Form.useForm();
  const [labelType, setLabelType] = useState<string>('Nhà riêng');

  useEffect(() => {
    if (isOpen) {
      if (editingAddress) {
        const knownLabels = ['Nhà riêng', 'Văn phòng'];
        const currentLabel = editingAddress.label || 'Khác';
        if (knownLabels.includes(currentLabel)) {
          setLabelType(currentLabel);
        } else {
          setLabelType('Khác');
        }

        form.resetFields();
        form.setFieldsValue({
          label: currentLabel,
          customLabel: knownLabels.includes(currentLabel) ? '' : currentLabel,
          address: editingAddress.address,
          latitude: editingAddress.latitude,
          longitude: editingAddress.longitude,
          isDefault: editingAddress.isDefault,
        });
      } else {
        setLabelType('Nhà riêng');
        form.resetFields();
        form.setFieldsValue({
          label: 'Nhà riêng',
          address: '',
          latitude: 10.762622,
          longitude: 106.660172,
          isDefault: isFirstAddress,
        });
      }
    }
  }, [isOpen, editingAddress, form, isFirstAddress]);

  const handleFinish = async (values: any) => {
    const finalLabel =
      values.label === 'Khác' ? values.customLabel || 'Khác' : values.label;

    const payload: AddressRequest = {
      address: values.address.trim(),
      label: finalLabel,
      latitude: values.latitude ? Number(values.latitude) : null,
      longitude: values.longitude ? Number(values.longitude) : null,
      isDefault: Boolean(values.isDefault),
    };

    await onSubmit(payload);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      message.warning('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setFieldsValue({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
        message.success('Đã lấy tọa độ vị trí hiện tại của bạn!');
      },
      (err) => {
        message.warning(`Không thể lấy vị trí hiện tại: ${err.message}`);
      }
    );
  };

  const handleSetPresetLocation = (city: 'HANOI' | 'HCM') => {
    if (city === 'HCM') {
      form.setFieldsValue({
        latitude: 10.7769,
        longitude: 106.7009,
      });
      message.info('Đã điền tọa độ mẫu TP. Hồ Chí Minh (Quận 1)');
    } else {
      form.setFieldsValue({
        latitude: 21.0285,
        longitude: 105.8542,
      });
      message.info('Đã điền tọa độ mẫu TP. Hà Nội (Hoàn Kiếm)');
    }
  };

  return (
    <Modal
      title={
        <div className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
          <EnvironmentOutlined className="text-orange-500" />
          <span>
            {editingAddress ? 'Chỉnh sửa địa chỉ nhận hàng' : 'Thêm địa chỉ nhận hàng mới'}
          </span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
      className="rounded-2xl overflow-hidden"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark={false}
        className="pt-2 space-y-3"
      >
        {/* Label selector */}
        <Form.Item
          label={<span className="font-bold text-gray-700">Loại địa chỉ</span>}
          name="label"
          rules={[{ required: true, message: 'Vui lòng chọn loại địa chỉ!' }]}
        >
          <Radio.Group
            onChange={(e) => setLabelType(e.target.value)}
            className="w-full grid grid-cols-3 gap-2"
          >
            <Radio.Button value="Nhà riêng" className="text-center rounded-lg">
              <HomeOutlined className="mr-1" /> Nhà riêng
            </Radio.Button>
            <Radio.Button value="Văn phòng" className="text-center rounded-lg">
              <BankOutlined className="mr-1" /> Văn phòng
            </Radio.Button>
            <Radio.Button value="Khác" className="text-center rounded-lg">
              <EnvironmentOutlined className="mr-1" /> Khác
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {labelType === 'Khác' && (
          <Form.Item
            label={<span className="font-semibold text-gray-700">Tên nhãn gợi nhớ</span>}
            name="customLabel"
            rules={[{ required: true, message: 'Vui lòng nhập tên nhãn gợi nhớ!' }]}
          >
            <Input placeholder="Ví dụ: Nhà bố mẹ, Ký túc xá, Phòng gym..." className="rounded-xl" />
          </Form.Item>
        )}

        {/* Full Address */}
        <Form.Item
          label={<span className="font-bold text-gray-700">Địa chỉ chi tiết</span>}
          name="address"
          rules={[
            { required: true, message: 'Vui lòng nhập địa chỉ nhận hàng!' },
            { min: 5, message: 'Địa chỉ quá ngắn. Vui lòng nhập chi tiết hơn!' },
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Số nhà, tên đường, khu phố/tòa nhà, phường/xã, quận/huyện, tỉnh/thành phố..."
            className="rounded-xl"
          />
        </Form.Item>

        {/* Lat / Lng inputs & GPS Helper */}
        <div className="bg-gray-50 p-3.5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-gray-600 flex items-center gap-1">
              <CompassOutlined /> Tọa độ định vị bản đồ (Tùy chọn)
            </span>
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              className="text-orange-600 font-bold hover:underline cursor-pointer"
            >
              📍 Lấy GPS hiện tại
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              label={<span className="text-xs font-semibold text-gray-500">Vĩ độ (Latitude)</span>}
              name="latitude"
              className="!mb-0"
            >
              <Input type="number" step="any" placeholder="10.7626" className="rounded-lg text-xs" />
            </Form.Item>
            <Form.Item
              label={<span className="text-xs font-semibold text-gray-500">Kinh độ (Longitude)</span>}
              name="longitude"
              className="!mb-0"
            >
              <Input type="number" step="any" placeholder="106.6601" className="rounded-lg text-xs" />
            </Form.Item>
          </div>

          <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-400">
            <span>Mẫu nhanh:</span>
            <button
              type="button"
              onClick={() => handleSetPresetLocation('HCM')}
              className="text-blue-600 hover:underline"
            >
              TP.HCM
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleSetPresetLocation('HANOI')}
              className="text-blue-600 hover:underline"
            >
              Hà Nội
            </button>
          </div>
        </div>

        {/* Default Switch */}
        <Form.Item
          name="isDefault"
          valuePropName="checked"
          className="!mb-4 pt-1"
        >
          <div className="flex items-center justify-between p-2 rounded-xl bg-orange-50/50 border border-orange-100">
            <span className="font-semibold text-gray-700 text-sm">
              Đặt làm địa chỉ nhận hàng mặc định
            </span>
            <Switch className="bg-gray-300" />
          </div>
        </Form.Item>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <Button onClick={onClose} className="rounded-xl">
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600 font-bold rounded-xl px-6"
          >
            {editingAddress ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddressFormModal;

