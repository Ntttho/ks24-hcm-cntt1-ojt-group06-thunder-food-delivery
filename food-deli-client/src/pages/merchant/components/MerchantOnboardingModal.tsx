import React, { useState } from 'react';
import { Modal, Form, Input, Button, TimePicker, Typography, message } from 'antd';
import {
  ShopOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  PictureOutlined,
  AppstoreAddOutlined,
  ThunderboltFilled,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { restaurantApi, type Shop } from '@/services/modules/restaurantApi';
import { useAuth } from '@/hooks/useAuth';
import { LocationPickerMap } from './LocationPickerMap';

const { Title, Paragraph } = Typography;

export interface MerchantOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (shop: Shop) => void;
  title?: string;
  isFirstShop?: boolean;
}

const PRESET_IMAGES = [
  {
    label: '🍜 Cơm & Phở',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: '🧋 Trà Sữa & Cafe',
    url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: '🍕 Fastfood & Pizza',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: '🥗 Healthy & Đồ Chay',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
  },
];

export const MerchantOnboardingModal: React.FC<MerchantOnboardingModalProps> = ({
  open,
  onClose,
  onSuccess,
  title,
  isFirstShop = false,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedImg, setSelectedImg] = useState<string>(PRESET_IMAGES[0].url);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 10.7769,
    lng: 106.7009,
  });
  const { user } = useAuth();

  const handleSelectPreset = (url: string) => {
    setSelectedImg(url);
    form.setFieldsValue({ imageUrl: url });
  };

  const handleLocationChange = (lat: number, lng: number, address?: string) => {
    setCoords({ lat, lng });
    form.setFieldsValue({
      latitude: lat,
      longitude: lng,
    });
    if (address) {
      form.setFieldsValue({ address });
    }
  };

  const handleFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const openingTimeStr = values.openingTime
        ? dayjs(values.openingTime).format('HH:mm:ss')
        : '07:00:00';
      const closingTimeStr = values.closingTime
        ? dayjs(values.closingTime).format('HH:mm:ss')
        : '22:00:00';

      const payload = {
        name: values.name.trim(),
        address: values.address.trim(),
        openingTime: openingTimeStr,
        closingTime: closingTimeStr,
        imageUrl: values.imageUrl?.trim() || selectedImg,
        initialCategoryName: values.initialCategoryName?.trim() || 'Món chính',
        latitude: values.latitude || coords.lat,
        longitude: values.longitude || coords.lng,
      };

      const ownerId = Number(user?.id) || 3;

      const res = await restaurantApi.createRestaurant(payload, ownerId);
      if (res && res.data) {
        try {
          await restaurantApi.updateRestaurantDetails(res.data.id, payload, ownerId);
        } catch {
          // Non-blocking
        }

        message.success(
          isFirstShop
            ? '🎉 Đăng ký quán ăn đầu tiên thành công! Bắt đầu kinh doanh ngay thôi!'
            : 'Đã tạo thêm chi nhánh quán ăn thành công!'
        );
        form.resetFields();
        onSuccess(res.data);
      }
    } catch (err: any) {
      message.error(err?.message || 'Có lỗi xảy ra khi tạo quán ăn, vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      centered
      destroyOnClose
      maskClosable={!isFirstShop}
      closable={!isFirstShop}
      className="rounded-2xl overflow-hidden"
    >
      <div className="pt-2 pb-1 max-h-[85vh] overflow-y-auto px-1">
        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-md shadow-orange-500/20 mb-2">
            <ThunderboltFilled className="text-2xl" />
          </div>
          <Title level={4} className="!mb-1 text-slate-800 font-extrabold">
            {title || (isFirstShop ? 'Đăng ký Quán ăn Đầu tiên của bạn' : 'Mở thêm Chi nhánh Quán mới')}
          </Title>
          <Paragraph className="text-slate-500 text-xs !mb-0 max-w-md mx-auto">
            {isFirstShop
              ? 'Thiết lập thông tin thương hiệu của bạn để bắt đầu tiếp nhận đơn hàng và quản lý thực đơn trên Thunder Food Delivery.'
              : 'Thêm quán ăn mới thuộc quyền quản lý Multi-shops của tài khoản đối tác.'}
          </Paragraph>
        </div>

        {/* Register Form */}
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleFinish}
          initialValues={{
            openingTime: dayjs('07:00:00', 'HH:mm:ss'),
            closingTime: dayjs('22:00:00', 'HH:mm:ss'),
            initialCategoryName: 'Món chính',
            imageUrl: PRESET_IMAGES[0].url,
            latitude: 10.7769,
            longitude: 106.7009,
          }}
        >
          {/* Tên Quán */}
          <Form.Item
            label={<span className="font-semibold text-slate-700 text-xs">Tên Quán ăn / Thương hiệu</span>}
            name="name"
            rules={[
              { required: true, message: 'Vui lòng nhập tên quán ăn!' },
              { min: 3, message: 'Tên quán tối thiểu 3 ký tự!' },
            ]}
          >
            <Input
              size="large"
              prefix={<ShopOutlined className="text-orange-500 mr-1" />}
              placeholder="Ví dụ: Trà Sữa Gong Cha - Cầu Giấy, Cơm Tấm Ba Ghiền..."
              className="rounded-xl hover:border-orange-400 focus:border-orange-500"
            />
          </Form.Item>

          {/* Bản đồ định vị Google Map / GPS & Tọa độ */}
          <div className="mb-4">
            <LocationPickerMap
              latitude={coords.lat}
              longitude={coords.lng}
              onLocationChange={handleLocationChange}
            />
          </div>

          <Form.Item name="latitude" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="longitude" hidden>
            <Input />
          </Form.Item>

          {/* Địa chỉ */}
          <Form.Item
            label={
              <span className="font-semibold text-slate-700 text-xs">
                Địa chỉ kinh doanh (Tự động điền theo GPS hoặc nhập tay)
              </span>
            }
            name="address"
            rules={[
              { required: true, message: 'Vui lòng nhập địa chỉ quán ăn!' },
              { min: 5, message: 'Địa chỉ quán tối thiểu 5 ký tự!' },
            ]}
          >
            <Input
              size="large"
              prefix={<EnvironmentOutlined className="text-orange-500 mr-1" />}
              placeholder="Ví dụ: 123 Đường Cầu Giấy, Phường Quan Hoa, Hà Nội"
              className="rounded-xl hover:border-orange-400 focus:border-orange-500"
            />
          </Form.Item>

          {/* Giờ hoạt động & Danh mục khởi đầu */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Form.Item
              label={<span className="font-semibold text-slate-700 text-xs">Giờ mở cửa</span>}
              name="openingTime"
              rules={[{ required: true, message: 'Chọn giờ mở cửa' }]}
            >
              <TimePicker
                size="large"
                format="HH:mm"
                className="w-full rounded-xl"
                prefix={<ClockCircleOutlined className="text-orange-500 mr-1" />}
              />
            </Form.Item>

            <Form.Item
              label={<span className="font-semibold text-slate-700 text-xs">Giờ đóng cửa</span>}
              name="closingTime"
              rules={[{ required: true, message: 'Chọn giờ đóng cửa' }]}
            >
              <TimePicker
                size="large"
                format="HH:mm"
                className="w-full rounded-xl"
                prefix={<ClockCircleOutlined className="text-slate-400 mr-1" />}
              />
            </Form.Item>

            <Form.Item
              label={<span className="font-semibold text-slate-700 text-xs">Danh mục đầu tiên</span>}
              name="initialCategoryName"
              rules={[{ required: true, message: 'Nhập danh mục đầu tiên' }]}
              extra={<span className="text-[11px] text-slate-400">Tự tạo danh mục để đăng món</span>}
            >
              <Input
                size="large"
                prefix={<AppstoreAddOutlined className="text-orange-500 mr-1" />}
                placeholder="Món chính"
                className="rounded-xl"
              />
            </Form.Item>
          </div>

          {/* Ảnh đại diện & Gợi ý ảnh nhanh */}
          <Form.Item
            label={<span className="font-semibold text-slate-700 text-xs">Hình ảnh đại diện quán ăn</span>}
            name="imageUrl"
            rules={[{ required: true, message: 'Vui lòng cung cấp URL ảnh quán!' }]}
          >
            <Input
              size="large"
              prefix={<PictureOutlined className="text-orange-500 mr-1" />}
              placeholder="https://..."
              className="rounded-xl"
              onChange={(e) => setSelectedImg(e.target.value)}
            />
          </Form.Item>

          {/* Quick preset chips */}
          <div className="space-y-1.5 mb-5">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Gợi ý ảnh mẫu (Nhấp để chọn nhanh):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_IMAGES.map((preset, idx) => {
                const isCurrent = selectedImg === preset.url;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectPreset(preset.url)}
                    className={`cursor-pointer rounded-xl border p-1.5 flex flex-col items-center gap-1.5 transition-all text-center ${
                      isCurrent
                        ? 'border-orange-500 bg-orange-50/70 shadow-xs ring-1 ring-orange-500/30'
                        : 'border-slate-200 hover:border-orange-300 bg-white'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-14 object-cover rounded-lg"
                    />
                    <span
                      className={`text-[11px] font-bold truncate max-w-full ${
                        isCurrent ? 'text-orange-600' : 'text-slate-600'
                      }`}
                    >
                      {preset.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            {!isFirstShop && (
              <Button size="large" onClick={onClose} disabled={submitting} className="rounded-xl font-medium">
                Hủy bỏ
              </Button>
            )}
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={submitting}
              icon={<CheckCircleOutlined />}
              className={`rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-none font-bold shadow-md shadow-orange-500/20 text-white ${
                isFirstShop ? 'w-full !h-12 text-base' : 'px-6'
              }`}
            >
              {isFirstShop ? 'Hoàn tất Đăng ký & Bắt đầu Bán hàng 🚀' : 'Tạo Quán mới'}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default MerchantOnboardingModal;
