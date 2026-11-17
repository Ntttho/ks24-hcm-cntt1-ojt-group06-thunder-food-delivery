import React, { useState } from 'react';
import { Form, Input, Select, Checkbox, Button, message, Tag } from 'antd';
import {
  IdcardOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  SendOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Bike, ShieldCheck } from '../icons';
import { useAuth } from '@/hooks/useAuth';
import { driverApi, type DriverRegistrationRequest } from '@/services/modules/driverApi';

interface DriverRegistrationViewProps {
  initialValues?: {
    licensePlate?: string | null;
    idCardNumber?: string | null;
    vehicleType?: string | null;
  };
  isEditing?: boolean;
  onSubmitted: () => void;
  onCancel?: () => void;
  onLogout: () => void;
}

const VEHICLE_TYPE_OPTIONS = [
  { label: 'Xe máy số (Wave, Sirius, Future, Blade...)', value: 'Xe máy số' },
  { label: 'Xe máy tay ga (Vision, Air Blade, Lead, SH...)', value: 'Xe máy tay ga' },
  { label: 'Xe máy điện (VinFast, Dat Bike, Yadea...)', value: 'Xe máy điện' },
  { label: 'Xe máy côn tay (Exciter, Winner, Raider...)', value: 'Xe máy côn tay' },
];

export const DriverRegistrationView: React.FC<DriverRegistrationViewProps> = ({
  initialValues,
  isEditing = false,
  onSubmitted,
  onCancel,
  onLogout,
}) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const payload: DriverRegistrationRequest = {
        licensePlate: values.licensePlate.trim().toUpperCase(),
        idCardNumber: values.idCardNumber.trim(),
        vehicleType: values.vehicleType || 'Xe máy số',
      };

      const res = await driverApi.registerDriver(payload);
      if (res && res.status >= 200 && res.status < 300) {
        message.success(
          isEditing
            ? 'Cập nhật thông tin hồ sơ tài xế thành công! Vui lòng chờ Admin duyệt lại.'
            : 'Nộp hồ sơ đối tác tài xế thành công! Vui lòng chờ Ban quản trị duyệt.'
        );
        onSubmitted();
      } else {
        message.error(res?.message || 'Có lỗi xảy ra khi gửi hồ sơ');
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || err?.message || 'Không thể gửi hồ sơ đăng ký tài xế';
      message.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-3 sm:p-6">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-xs rounded-2xl flex items-center justify-center border border-white/30 shadow-xs">
                <Bike className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white m-0">
                  {isEditing ? 'Cập Nhật Hồ Sơ Phương Tiện' : 'Đăng Ký Hồ Sơ Đối Tác Tài Xế'}
                </h1>
                <p className="text-emerald-100 text-xs mt-0.5">
                  Food Thunder Shipper Delivery Hub
                </p>
              </div>
            </div>
            <Tag color="cyan" className="font-extrabold uppercase text-[10px] px-2.5 py-0.5 rounded-full border-0 shadow-xs">
              {isEditing ? 'Chỉnh sửa' : 'Bước 2 / 2'}
            </Tag>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-6">
          {/* Instructions Alert */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900 leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-950 block mb-1">
                {isEditing
                  ? 'Chỉnh sửa lại thông tin phương tiện'
                  : 'Hoàn thiện hồ sơ để bắt đầu nhận cuốc xe'}
              </span>
              Tài khoản của bạn đã được khởi tạo. Vui lòng cung cấp chính xác biển số xe và số CCCD để Ban quản trị đối soát, kích hoạt tài khoản đối tác trong vòng 24 giờ làm việc.
            </div>
          </div>

          {/* Account Profile Preview */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Thông tin tài khoản đã đăng ký
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500 flex items-center gap-1.5">
                <UserOutlined className="text-slate-400" /> Họ và tên:
              </span>
              <span className="font-bold text-slate-800">{user?.fullName || 'Tài xế đối tác'}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <PhoneOutlined className="text-slate-400" /> Số điện thoại:
              </span>
              <span className="font-bold text-slate-800">{user?.phone || 'Chưa cập nhật'}</span>
            </div>
          </div>

          {/* Registration Form */}
          <Form
            form={form}
            layout="vertical"
            requiredMark="optional"
            onFinish={handleSubmit}
            initialValues={{
              licensePlate: initialValues?.licensePlate || '',
              idCardNumber: initialValues?.idCardNumber || '',
              vehicleType: initialValues?.vehicleType || 'Xe máy số',
              agreement: true,
            }}
            className="space-y-4"
          >
            {/* License Plate Field */}
            <Form.Item
              name="licensePlate"
              label={
                <span className="font-bold text-xs text-slate-700 flex items-center gap-1">
                  Biển số xe giao hàng <span className="text-red-500">*</span>
                </span>
              }
              rules={[
                { required: true, message: 'Vui lòng cung cấp biển số xe giao hàng!' },
                {
                  pattern: /^[0-9]{2}[A-Za-z0-9\s.-]{4,10}$/,
                  message: 'Biển số chưa đúng định dạng chuẩn (VD: 59-X1 987.65 hoặc 29B1-12345)',
                },
              ]}
              extra={
                <span className="text-[11px] text-slate-400">
                  Ví dụ: <strong className="text-slate-600">59-X1 987.65</strong> hoặc{' '}
                  <strong className="text-slate-600">29B1-123.45</strong>
                </span>
              }
            >
              <Input
                size="large"
                placeholder="Nhập biển số xe (VD: 59-X1 987.65)"
                prefix={<Bike className="w-4 h-4 text-slate-400 mr-1" />}
                className="font-mono font-bold uppercase rounded-xl"
                maxLength={15}
              />
            </Form.Item>

            {/* ID Card / CCCD Field */}
            <Form.Item
              name="idCardNumber"
              label={
                <span className="font-bold text-xs text-slate-700 flex items-center gap-1">
                  Số CCCD / CMND <span className="text-red-500">*</span>
                </span>
              }
              rules={[
                { required: true, message: 'Vui lòng nhập số CCCD hoặc CMND!' },
                {
                  pattern: /^[0-9]{9,12}$/,
                  message: 'Số CCCD/CMND phải gồm 9 đến 12 chữ số hợp lệ',
                },
              ]}
              extra={
                <span className="text-[11px] text-slate-400">
                  Dãy 12 chữ số trên Căn cước công dân gắn chip của bạn
                </span>
              }
            >
              <Input
                size="large"
                placeholder="Nhập 12 chữ số CCCD (VD: 079201012345)"
                prefix={<IdcardOutlined className="text-slate-400 mr-1" />}
                className="font-mono font-bold rounded-xl"
                maxLength={12}
              />
            </Form.Item>

            {/* Vehicle Type Selection */}
            <Form.Item
              name="vehicleType"
              label={
                <span className="font-bold text-xs text-slate-700">
                  Loại phương tiện sử dụng
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng chọn loại phương tiện' }]}
            >
              <Select
                size="large"
                options={VEHICLE_TYPE_OPTIONS}
                className="rounded-xl font-medium"
              />
            </Form.Item>

            {/* Terms & Agreement Checkbox */}
            <Form.Item
              name="agreement"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error('Bạn cần đồng ý với quy chế đối tác để tiếp tục')
                        ),
                },
              ]}
            >
              <Checkbox className="text-xs text-slate-600 leading-normal">
                Tôi cam kết thông tin phương tiện, CCCD trên là chính xác và tuân thủ Luật An toàn
                giao thông cũng như Quy chế đối tác giao nhận của Food Thunder.
              </Checkbox>
            </Form.Item>

            {/* Actions */}
            <div className="pt-2 space-y-2.5">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={isSubmitting}
                icon={isEditing ? <CheckCircleOutlined /> : <SendOutlined />}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-extrabold rounded-2xl shadow-md text-sm border-0 flex items-center justify-center gap-2"
              >
                {isEditing ? 'Lưu & Gửi Duyệt Lại' : 'Nộp Hồ Sơ Xét Duyệt Đối Tác'}
              </Button>

              {isEditing && onCancel && (
                <Button
                  onClick={onCancel}
                  size="large"
                  disabled={isSubmitting}
                  icon={<ArrowLeftOutlined />}
                  className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl border-0"
                >
                  Quay lại trạng thái chờ duyệt
                </Button>
              )}

              {!isEditing && (
                <Button
                  onClick={onLogout}
                  size="large"
                  disabled={isSubmitting}
                  icon={<LogoutOutlined />}
                  className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl border-0"
                >
                  Đăng xuất tài khoản
                </Button>
              )}
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};
