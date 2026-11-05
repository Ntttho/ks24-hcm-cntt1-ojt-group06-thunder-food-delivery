import React, { useState } from 'react';
import { Card, Form, Input, Button, TimePicker, Typography, message, Tag } from 'antd';
import {
  ShopOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  PictureOutlined,
  AppstoreAddOutlined,
  ThunderboltFilled,
  RocketFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { restaurantApi, type Shop } from '@/services/modules/restaurantApi';
import { useAuth } from '@/hooks/useAuth';
import { LocationPickerMap } from './LocationPickerMap';

const { Text, Title, Paragraph } = Typography;

export interface MerchantOnboardingViewProps {
  onSuccess: (newShop: Shop) => void;
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

export const MerchantOnboardingView: React.FC<MerchantOnboardingViewProps> = ({ onSuccess }) => {
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

      // 1. Create restaurant
      const res = await restaurantApi.createRestaurant(payload, ownerId);
      if (res && res.data) {
        // 2. Also record details in restaurant_change_requests endpoint as requested by Thọ
        try {
          await restaurantApi.updateRestaurantDetails(res.data.id, payload, ownerId);
        } catch {
          // Non-blocking if change request fails
        }

        message.success('🎉 Đăng ký quán ăn đầu tiên thành công! Chào mừng đối tác mới.');
        onSuccess(res.data);
      }
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Có lỗi xảy ra khi tạo quán ăn, vui lòng thử lại!';
      message.error(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-6">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-orange-500/15 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-10 opacity-15 text-[180px] pointer-events-none select-none">
          <ShopOutlined />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <Tag className="!border-none !bg-white/20 !text-white font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider inline-flex items-center gap-1.5">
            <ThunderboltFilled /> Đối tác nhà hàng mới
          </Tag>
          <Title level={2} className="!text-white !mb-0 font-black tracking-tight">
            Chào mừng bạn đến với Thunder Food Delivery!
          </Title>
          <Paragraph className="text-orange-50 text-sm sm:text-base leading-relaxed !mb-0">
            Tài khoản của bạn hiện chưa liên kết với quán ăn nào. Hãy đăng ký thông tin quán ăn đầu tiên để bắt đầu mở bán, tải lên thực đơn và tiếp nhận đơn hàng thời gian thực ngay hôm nay!
          </Paragraph>
        </div>
      </div>

      {/* 3 Steps Value Proposition */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-slate-200/80 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
              1
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">Đăng ký thông tin quán</div>
              <div className="text-slate-500 text-xs mt-0.5">
                Thiết lập tên quán, địa chỉ và khung giờ mở cửa đón khách.
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
              2
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">Lên thực đơn & Topping</div>
              <div className="text-slate-500 text-xs mt-0.5">
                Đăng tải món ăn, định giá và cấu hình topping thêm đa dạng.
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
              3
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">Nhận đơn hàng Realtime</div>
              <div className="text-slate-500 text-xs mt-0.5">
                Chuông báo tức thì mỗi khi có đơn mới đổ về từ khách hàng.
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Registration Form Card */}
      <Card className="rounded-3xl border-slate-200/80 shadow-md p-2 sm:p-4">
        <div className="mb-6 pb-4 border-b border-slate-100">
          <Title level={4} className="!mb-1 font-extrabold text-slate-800 flex items-center gap-2">
            <ShopOutlined className="text-orange-500" /> Điền thông tin quán ăn đầu tiên của bạn
          </Title>
          <Text className="text-slate-400 text-xs">
            Vui lòng nhập thông tin chính xác để khách hàng và tài xế dễ dàng tìm kiếm quán ăn của bạn.
          </Text>
        </div>

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
            label={<span className="font-bold text-slate-700 text-sm">Tên Quán ăn / Thương hiệu</span>}
            name="name"
            rules={[
              { required: true, message: 'Vui lòng nhập tên quán ăn!' },
              { min: 3, message: 'Tên quán tối thiểu 3 ký tự!' },
            ]}
          >
            <Input
              size="large"
              prefix={<ShopOutlined className="text-orange-500 mr-1.5" />}
              placeholder="Ví dụ: Cơm Tấm Sài Gòn 1985, Trà Sữa Gong Cha..."
              className="rounded-xl hover:border-orange-400 focus:border-orange-500 text-base py-2.5"
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

          {/* Hidden/Synced Inputs for Form values */}
          <Form.Item name="latitude" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="longitude" hidden>
            <Input />
          </Form.Item>

          {/* Địa chỉ */}
          <Form.Item
            label={
              <span className="font-bold text-slate-700 text-sm">
                Địa chỉ kinh doanh (Tự động điền theo GPS hoặc nhập tay)
              </span>
            }
            name="address"
            rules={[
              { required: true, message: 'Vui lòng nhập địa chỉ kinh doanh!' },
              { min: 5, message: 'Địa chỉ quán tối thiểu 5 ký tự!' },
            ]}
          >
            <Input
              size="large"
              prefix={<EnvironmentOutlined className="text-orange-500 mr-1.5" />}
              placeholder="Ví dụ: 123 Đường Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội"
              className="rounded-xl hover:border-orange-400 focus:border-orange-500 text-base py-2.5"
            />
          </Form.Item>

          {/* Giờ mở - đóng cửa & Danh mục đầu tiên */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              label={<span className="font-semibold text-slate-700 text-xs">Danh mục món đầu tiên</span>}
              name="initialCategoryName"
              rules={[{ required: true, message: 'Nhập tên danh mục món đầu tiên' }]}
              extra={<span className="text-[11px] text-slate-400">Khởi tạo sẵn để bạn thêm món ngay</span>}
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
            label={<span className="font-bold text-slate-700 text-sm">Ảnh đại diện quán ăn</span>}
            name="imageUrl"
            rules={[{ required: true, message: 'Vui lòng cung cấp URL ảnh quán!' }]}
          >
            <Input
              size="large"
              prefix={<PictureOutlined className="text-orange-500 mr-1.5" />}
              placeholder="https://..."
              className="rounded-xl"
              onChange={(e) => setSelectedImg(e.target.value)}
            />
          </Form.Item>

          {/* Quick preset chips */}
          <div className="space-y-2 mb-6">
            <span className="text-xs font-semibold text-slate-600 block">
              Gợi ý ảnh mẫu theo phong cách ẩm thực (Nhấp để chọn nhanh):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_IMAGES.map((preset, idx) => {
                const isCurrent = selectedImg === preset.url;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectPreset(preset.url)}
                    className={`cursor-pointer rounded-2xl border p-2 flex flex-col items-center gap-2 transition-all text-center ${
                      isCurrent
                        ? 'border-orange-500 bg-orange-50/80 shadow-sm ring-2 ring-orange-500/30'
                        : 'border-slate-200 hover:border-orange-300 bg-white hover:shadow-2xs'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-20 object-cover rounded-xl"
                    />
                    <span
                      className={`text-xs font-bold truncate max-w-full ${
                        isCurrent ? 'text-orange-600' : 'text-slate-700'
                      }`}
                    >
                      {preset.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Submit Button */}
          <div className="pt-4 border-t border-slate-100">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={submitting}
              icon={<RocketFilled />}
              block
              className="h-14 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-none font-black text-lg shadow-lg shadow-orange-500/25 text-white tracking-wide"
            >
              Hoàn tất Đăng ký & Bắt đầu Bán hàng Ngay 🚀
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default MerchantOnboardingView;
