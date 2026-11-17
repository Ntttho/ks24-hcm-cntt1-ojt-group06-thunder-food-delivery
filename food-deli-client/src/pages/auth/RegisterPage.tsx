import React, { useState } from 'react';
import { Form, Input, Button, Alert, Checkbox, message, Select } from 'antd';
import {
  LockOutlined,
  UserOutlined,
  PhoneOutlined,
  ShopOutlined,
  CarOutlined,
  MailOutlined,
  CheckCircleFilled,
  ArrowRightOutlined,
  FireFilled,
  IdcardOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';
import { getRoleDefaultPath } from '@/utils/navigation';
import type { RegisterRequest } from '@/types';
import { driverApi, type DriverRegistrationRequest } from '@/services/modules/driverApi';
import { PasswordStrengthMeter } from './components/PasswordStrengthMeter';
import { SocialAuthButtons } from './components/SocialAuthButtons';

type UserRole = 'CUSTOMER' | 'MERCHANT' | 'DRIVER';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuth();
  const [form] = Form.useForm();
  const [selectedRole, setSelectedRole] = useState<UserRole>('CUSTOMER');
  const [passwordValue, setPasswordValue] = useState<string>('');

  const roleCards = [
    {
      id: 'CUSTOMER' as UserRole,
      title: 'Khách hàng',
      tagline: 'Đặt món giao siêu tốc 15 phút',
      badge: 'Phổ biến',
      icon: <UserOutlined className="text-xl" />,
      perk: 'Voucher giảm 50k cho đơn đầu tiên',
    },
    {
      id: 'MERCHANT' as UserRole,
      title: 'Đối tác Quán',
      tagline: 'Mở rộng doanh thu x3 cùng số hóa',
      badge: '0% Phí tháng đầu',
      icon: <ShopOutlined className="text-xl" />,
      perk: 'Hỗ trợ máy POS & chụp ảnh menu',
    },
    {
      id: 'DRIVER' as UserRole,
      title: 'Tài xế giao hàng',
      tagline: 'Thu nhập linh hoạt, nhận tiền theo ngày',
      badge: 'Thưởng 2.5tr/tuần',
      icon: <CarOutlined className="text-xl" />,
      perk: 'Bảo hiểm chuyến đi độc quyền',
    },
  ];

  // Vietnamese phone validation
  const validatePhone = (_: any, value: string) => {
    if (!value?.trim()) {
      return Promise.reject(new Error('Vui lòng cung cấp số điện thoại!'));
    }
    const clean = value.trim();
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$|^[0-9]{10}$/;
    if (!phoneRegex.test(clean)) {
      return Promise.reject(new Error('Số điện thoại 10 chữ số chưa hợp lệ'));
    }
    return Promise.resolve();
  };

  const handleRegister = async (values: any) => {
    try {
      const payload: RegisterRequest = {
        fullName: values.fullName.trim(),
        phone: values.phone.trim(),
        email: values.email ? values.email.trim() : undefined,
        password: values.password,
        role: selectedRole,
      };

      await register(payload);

      // Nếu người dùng đăng ký vai trò Tài xế: tự động ghi nhận ngay thông tin xe & CCCD vào bảng driver_details
      if (selectedRole === 'DRIVER') {
        try {
          const driverPayload: DriverRegistrationRequest = {
            licensePlate: (values.licensePlate || '').trim().toUpperCase(),
            idCardNumber: (values.idCardNumber || '').trim(),
            vehicleType: values.vehicleType || 'Xe máy số',
          };
          await driverApi.registerDriver(driverPayload);
        } catch (driverErr) {
          console.warn('Lưu thông tin phương tiện tài xế lỗi:', driverErr);
        }
      }

      message.success('Đăng ký tài khoản thành công! Bạn có thể bắt đầu sử dụng ngay.');
      navigate(getRoleDefaultPath(selectedRole), { replace: true });
    } catch {
      // Handled in Redux and displayed via Alert
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-6 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold mb-2">
          <FireFilled className="text-orange-500" />
          <span>Gia nhập hơn 250,000+ thành viên Thunder</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Đăng ký tài khoản
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Lựa chọn tư cách tham gia để nhận trải nghiệm tối ưu nhất cho bạn.
        </p>
      </div>

      {/* Role Selector UX - Cards with visual state */}
      <div className="mb-6 space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
          Bạn muốn tham gia dưới vai trò gì?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {roleCards.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <div
                key={role.id}
                onClick={() => {
                  setSelectedRole(role.id);
                  clearError();
                }}
                className={`relative p-3.5 rounded-2xl cursor-pointer border-2 transition-all duration-200 select-none flex flex-col justify-between ${
                  isSelected
                    ? 'border-orange-500 bg-linear-to-b from-orange-50/70 to-white shadow-md shadow-orange-500/10 ring-1 ring-orange-500'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 text-orange-500">
                    <CheckCircleFilled className="text-base" />
                  </div>
                )}
                <div>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-colors ${
                      isSelected
                        ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/40'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {role.icon}
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">{role.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                    {role.tagline}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="font-medium text-orange-700 bg-orange-100/70 px-1.5 py-0.5 rounded">
                    {role.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          message="Lỗi đăng ký"
          description={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          className="mb-4 rounded-xl border-red-200 text-xs"
        />
      )}

      {/* Form Details */}
      <Form
        form={form}
        name="register"
        layout="vertical"
        onFinish={handleRegister}
        requiredMark={false}
        size="large"
        initialValues={{ terms: true }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Họ và tên đầy đủ</span>}
            name="fullName"
            rules={[
              { required: true, message: 'Vui lòng nhập họ và tên!' },
              { min: 2, message: 'Tối thiểu 2 ký tự!' },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-slate-400 mr-1" />}
              placeholder="Nguyễn Văn An"
              className="!rounded-xl border-slate-200 hover:border-orange-400 focus:border-orange-500"
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Số điện thoại đăng nhập</span>}
            name="phone"
            rules={[{ validator: validatePhone }]}
          >
            <Input
              prefix={<PhoneOutlined className="text-slate-400 mr-1" />}
              placeholder="0912 345 678"
              className="!rounded-xl border-slate-200 hover:border-orange-400 focus:border-orange-500"
            />
          </Form.Item>
        </div>

        <Form.Item
          label={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-semibold text-slate-700">Địa chỉ Email (Tùy chọn)</span>
              <span className="text-[11px] text-slate-400 font-normal">Để nhận hóa đơn GTGT</span>
            </div>
          }
          name="email"
          rules={[{ type: 'email', message: 'Email không đúng định dạng!' }]}
        >
          <Input
            prefix={<MailOutlined className="text-slate-400 mr-1" />}
            placeholder="an.nguyen@company.com"
            className="!rounded-xl border-slate-200 hover:border-orange-400 focus:border-orange-500"
          />
        </Form.Item>

        {/* Khối khai báo thông tin xe & giấy tờ chỉ hiển thị khi chọn vai trò Tài xế */}
        {selectedRole === 'DRIVER' && (
          <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 mb-5 space-y-3.5 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 border-b border-emerald-200/60 pb-2">
              <IdcardOutlined className="text-emerald-700 text-base" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 m-0">
                  Thông tin phương tiện & Giấy tờ đối tác
                </h4>
                <p className="text-[11px] text-emerald-700 m-0">
                  Khai báo để Ban quản trị phê duyệt kích hoạt tài khoản đối tác
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Biển số xe giao hàng <span className="text-red-500">*</span></span>}
                name="licensePlate"
                rules={[
                  { required: true, message: 'Vui lòng nhập biển số xe!' },
                  {
                    pattern: /^[0-9]{2}[A-Za-z0-9\s.-]{4,10}$/,
                    message: 'Biển số chưa đúng định dạng chuẩn (VD: 59-X1 987.65)',
                  },
                ]}
                extra={<span className="text-[10px] text-slate-400">VD: 59-X1 987.65, 29B1-123.45</span>}
              >
                <Input
                  prefix={<CarOutlined className="text-slate-400 mr-1" />}
                  placeholder="59-X1 987.65"
                  className="!rounded-xl border-slate-200 uppercase font-mono font-bold"
                  maxLength={15}
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Số CCCD / CMND <span className="text-red-500">*</span></span>}
                name="idCardNumber"
                rules={[
                  { required: true, message: 'Vui lòng nhập số CCCD!' },
                  {
                    pattern: /^[0-9]{9,12}$/,
                    message: 'Số CCCD gồm 9 đến 12 chữ số hợp lệ',
                  },
                ]}
                extra={<span className="text-[10px] text-slate-400">12 chữ số trên CCCD gắn chip</span>}
              >
                <Input
                  prefix={<IdcardOutlined className="text-slate-400 mr-1" />}
                  placeholder="079201012345"
                  className="!rounded-xl border-slate-200 font-mono font-bold"
                  maxLength={12}
                />
              </Form.Item>
            </div>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-700">Loại phương tiện sử dụng</span>}
              name="vehicleType"
              initialValue="Xe máy số"
            >
              <Select
                options={[
                  { label: 'Xe máy số (Wave, Sirius, Future, Blade...)', value: 'Xe máy số' },
                  { label: 'Xe máy tay ga (Vision, Air Blade, Lead, SH...)', value: 'Xe máy tay ga' },
                  { label: 'Xe máy điện (VinFast, Dat Bike, Yadea...)', value: 'Xe máy điện' },
                  { label: 'Xe máy côn tay (Exciter, Winner, Raider...)', value: 'Xe máy côn tay' },
                ]}
                className="rounded-xl font-medium"
              />
            </Form.Item>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Tạo mật khẩu</span>}
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Tối thiểu 6 ký tự!' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-slate-400 mr-1" />}
              placeholder="Mật khẩu bảo mật"
              onChange={(e) => setPasswordValue(e.target.value)}
              className="!rounded-xl border-slate-200 hover:border-orange-400 focus:border-orange-500"
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Xác nhận mật khẩu</span>}
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu nhập lại không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-slate-400 mr-1" />}
              placeholder="Nhập lại mật khẩu"
              className="!rounded-xl border-slate-200 hover:border-orange-400 focus:border-orange-500"
            />
          </Form.Item>
        </div>

        {/* Dynamic Strength Indicator */}
        {passwordValue && (
          <div className="mb-4">
            <PasswordStrengthMeter password={passwordValue} />
          </div>
        )}

        <Form.Item
          name="terms"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(new Error('Cần xác nhận đồng ý điều khoản dịch vụ')),
            },
          ]}
        >
          <Checkbox className="text-xs text-slate-600 leading-tight">
            Tôi đã đọc kỹ và đồng ý với{' '}
            <a href="#terms" className="text-orange-600 font-semibold hover:underline">
              Quy chế hoạt động
            </a>{' '}
            và{' '}
            <a href="#privacy" className="text-orange-600 font-semibold hover:underline">
              Chính sách bảo mật dữ liệu
            </a>{' '}
            của hệ sinh thái Thunder Food.
          </Checkbox>
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          block
          className="!h-12 !rounded-xl !bg-linear-to-r !from-orange-500 !via-amber-500 !to-orange-600 hover:!opacity-95 !border-none !text-white !font-bold !text-base shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
        >
          <span>Khởi tạo tài khoản ngay</span>
          <ArrowRightOutlined className="text-sm" />
        </Button>
      </Form>

      {/* Social Register & Fast Switch */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500 mb-3">Hoặc tiếp tục nhanh chóng với</p>
        <SocialAuthButtons />

        <p className="text-xs text-slate-500">
          Đã có tài khoản trên hệ thống?{' '}
          <Link
            to={APP_ROUTES.LOGIN}
            className="font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
