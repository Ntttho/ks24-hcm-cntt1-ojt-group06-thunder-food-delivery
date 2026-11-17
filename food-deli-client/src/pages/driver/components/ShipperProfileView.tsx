import React, { useState } from 'react';
import { Tag, Modal, Form, Input, Select, Button, message } from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Bike, ShieldCheck, Wallet, Star } from '../icons';
import { useAuth } from '@/hooks/useAuth';
import {
  driverApi,
  type DriverStatusResponse,
  type DriverRegistrationRequest,
} from '@/services/modules/driverApi';

interface ShipperProfileViewProps {
  driverProfile: DriverStatusResponse | null;
  onProfileUpdated: () => Promise<void>;
  onLogout: () => void;
}

const VEHICLE_TYPE_OPTIONS = [
  { label: 'Xe máy số (Wave, Sirius, Future, Blade...)', value: 'Xe máy số' },
  { label: 'Xe máy tay ga (Vision, Air Blade, Lead, SH...)', value: 'Xe máy tay ga' },
  { label: 'Xe máy điện (VinFast, Dat Bike, Yadea...)', value: 'Xe máy điện' },
  { label: 'Xe máy côn tay (Exciter, Winner, Raider...)', value: 'Xe máy côn tay' },
];

export const ShipperProfileView: React.FC<ShipperProfileViewProps> = ({
  driverProfile,
  onProfileUpdated,
  onLogout,
}) => {
  const { user, updateProfile } = useAuth();

  // Modals state
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isPersonalModalOpen, setIsPersonalModalOpen] = useState(false);
  const [vehicleForm] = Form.useForm();
  const [personalForm] = Form.useForm();
  const [updatingVehicle, setUpdatingVehicle] = useState(false);
  const [updatingPersonal, setUpdatingPersonal] = useState(false);

  // Status badge helper
  const getApprovalStatusBadge = (status?: string) => {
    switch ((status || '').toUpperCase()) {
      case 'APPROVED':
        return (
          <Tag color="success" icon={<CheckCircleOutlined />} className="font-bold px-2.5 py-1 rounded-md text-xs">
            ĐÃ PHÊ DUYỆT (SẴN SÀNG NHẬN ĐƠN)
          </Tag>
        );
      case 'PENDING':
        return (
          <Tag color="warning" icon={<ClockCircleOutlined />} className="font-bold px-2.5 py-1 rounded-md text-xs">
            ĐANG CHỜ ADMIN XÉT DUYỆT
          </Tag>
        );
      case 'REJECTED':
        return (
          <Tag color="error" icon={<CloseCircleOutlined />} className="font-bold px-2.5 py-1 rounded-md text-xs">
            HỒ SƠ BỊ TỪ CHỐI
          </Tag>
        );
      default:
        return (
          <Tag color="default" className="font-bold px-2.5 py-1 rounded-md text-xs">
            CHƯA ĐĂNG KÝ PHƯƠNG TIỆN
          </Tag>
        );
    }
  };

  // Submit update vehicle
  const handleUpdateVehicle = async (values: any) => {
    setUpdatingVehicle(true);
    try {
      const payload: DriverRegistrationRequest = {
        licensePlate: values.licensePlate.trim().toUpperCase(),
        idCardNumber: values.idCardNumber.trim(),
        vehicleType: values.vehicleType || 'Xe máy số',
      };
      await driverApi.registerDriver(payload);
      message.success('Cập nhật thông tin phương tiện thành công! Hồ sơ đã gửi đến Admin để duyệt lại.');
      setIsVehicleModalOpen(false);
      await onProfileUpdated();
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || err?.message || 'Không thể cập nhật thông tin phương tiện';
      message.error(errMsg);
    } finally {
      setUpdatingVehicle(false);
    }
  };

  // Submit update personal profile
  const handleUpdatePersonal = async (values: any) => {
    setUpdatingPersonal(true);
    try {
      await updateProfile({
        fullName: values.fullName.trim(),
      });
      message.success('Cập nhật họ tên tài xế thành công!');
      setIsPersonalModalOpen(false);
      await onProfileUpdated();
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || err?.message || 'Không thể cập nhật thông tin cá nhân';
      message.error(errMsg);
    } finally {
      setUpdatingPersonal(false);
    }
  };

  return (
    <div className="w-full space-y-4 px-3 sm:px-4 pb-6">
      {/* 1. Header Hero Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 text-white shadow-inner">
              <UserOutlined className="text-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white m-0 tracking-tight">
                  {user?.fullName || 'Tài xế giao vận'}
                </h2>
                <Tag color="cyan" className="font-extrabold uppercase text-[10px] m-0 border-0">
                  Đối Tác Giao Vận
                </Tag>
              </div>
              <p className="text-emerald-100 text-xs mt-0.5">
                Mã tài xế: <strong className="text-white font-mono">#{user?.id || '...'}</strong> • SĐT: {user?.phone || 'Chưa cập nhật'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
          <span className="text-[11px] text-emerald-100">Trạng thái phê duyệt:</span>
          <div>{getApprovalStatusBadge(driverProfile?.approvalStatus)}</div>
        </div>
      </div>

      {/* 2. Rejection Alert (If Rejected) */}
      {driverProfile?.approvalStatus === 'REJECTED' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
            <CloseCircleOutlined />
            <span>Lý do từ chối từ Ban Quản Trị:</span>
          </div>
          <p className="text-xs text-rose-900 bg-white p-2.5 rounded-xl border border-rose-100 font-medium m-0 leading-relaxed">
            {driverProfile.rejectReason || 'Thông tin phương tiện hoặc giấy tờ chưa đáp ứng điều kiện sàn.'}
          </p>
        </div>
      )}

      {/* 3. Card Thông tin phương tiện & Giấy tờ */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 m-0">
                Phương tiện & Giấy tờ đăng ký
              </h3>
              <p className="text-[11px] text-slate-400 m-0">Thông tin đối soát xe lưu trên hệ thống</p>
            </div>
          </div>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              vehicleForm.setFieldsValue({
                licensePlate: driverProfile?.licensePlate || '',
                idCardNumber: driverProfile?.idCardNumber || '',
                vehicleType: driverProfile?.vehicleType || 'Xe máy số',
              });
              setIsVehicleModalOpen(true);
            }}
            className="text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 rounded-xl"
          >
            Đổi xe / Sửa biển số
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="text-[11px] text-slate-400 font-medium">Biển số xe giao hàng:</div>
            <div className="font-mono font-black text-slate-800 text-sm mt-0.5">
              {driverProfile?.licensePlate || <span className="text-slate-400 font-normal">Chưa cập nhật</span>}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="text-[11px] text-slate-400 font-medium">Số CCCD / CMND:</div>
            <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
              {driverProfile?.idCardNumber || <span className="text-slate-400 font-normal">Chưa cập nhật</span>}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 sm:col-span-2">
            <div className="text-[11px] text-slate-400 font-medium">Loại phương tiện:</div>
            <div className="font-bold text-slate-800 mt-0.5">
              {driverProfile?.vehicleType || 'Xe máy số (Tiêu chuẩn)'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Card Thông tin cá nhân */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <IdcardOutlined className="text-base" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 m-0">
                Thông tin tài khoản tài xế
              </h3>
              <p className="text-[11px] text-slate-400 m-0">Tài khoản đăng nhập trên hệ thống</p>
            </div>
          </div>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              personalForm.setFieldsValue({
                fullName: user?.fullName || '',
              });
              setIsPersonalModalOpen(true);
            }}
            className="text-xs font-bold text-blue-700 border-blue-300 hover:bg-blue-50 rounded-xl"
          >
            Chỉnh sửa họ tên
          </Button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-2">
              <UserOutlined className="text-slate-400" /> Họ và tên đầy đủ:
            </span>
            <span className="font-bold text-slate-800">{user?.fullName || 'Chưa cập nhật'}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-2">
              <PhoneOutlined className="text-slate-400" /> Số điện thoại đăng nhập:
            </span>
            <span className="font-bold text-slate-800 font-mono">{user?.phone || 'Chưa cập nhật'}</span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-slate-500 flex items-center gap-2">
              <MailOutlined className="text-slate-400" /> Địa chỉ Email:
            </span>
            <span className="font-bold text-slate-800">{user?.email || 'Chưa cập nhật email'}</span>
          </div>
        </div>
      </div>

      {/* 5. Nút Đăng xuất an toàn */}
      <div className="pt-2">
        <Button
          danger
          onClick={onLogout}
          icon={<LogoutOutlined />}
          className="w-full h-11 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          Đăng xuất khỏi ca làm
        </Button>
      </div>

      {/* Modal Cập nhật phương tiện */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800 font-black">
            <Bike className="w-5 h-5 text-emerald-600" />
            <span>Cập Nhật Phương Tiện / Đổi Xe Mới</span>
          </div>
        }
        open={isVehicleModalOpen}
        onCancel={() => setIsVehicleModalOpen(false)}
        footer={null}
        destroyOnClose
        className="rounded-3xl"
      >
        <Form
          form={vehicleForm}
          layout="vertical"
          onFinish={handleUpdateVehicle}
          className="mt-4 space-y-3"
        >
          <Form.Item
            name="licensePlate"
            label={<span className="font-bold text-xs text-slate-700">Biển số xe mới <span className="text-red-500">*</span></span>}
            rules={[
              { required: true, message: 'Vui lòng nhập biển số xe!' },
              {
                pattern: /^[0-9]{2}[A-Za-z0-9\s.-]{4,10}$/,
                message: 'Biển số chưa đúng định dạng chuẩn (VD: 59-X1 987.65)',
              },
            ]}
          >
            <Input
              placeholder="VD: 59-X1 987.65"
              className="rounded-xl font-mono uppercase font-bold"
              maxLength={15}
            />
          </Form.Item>

          <Form.Item
            name="idCardNumber"
            label={<span className="font-bold text-xs text-slate-700">Số CCCD / CMND <span className="text-red-500">*</span></span>}
            rules={[
              { required: true, message: 'Vui lòng nhập số CCCD!' },
              {
                pattern: /^[0-9]{9,12}$/,
                message: 'Số CCCD gồm 9 đến 12 chữ số hợp lệ',
              },
            ]}
          >
            <Input
              placeholder="12 chữ số CCCD"
              className="rounded-xl font-mono font-bold"
              maxLength={12}
            />
          </Form.Item>

          <Form.Item
            name="vehicleType"
            label={<span className="font-bold text-xs text-slate-700">Loại phương tiện</span>}
            rules={[{ required: true, message: 'Vui lòng chọn loại xe' }]}
          >
            <Select options={VEHICLE_TYPE_OPTIONS} className="rounded-xl" />
          </Form.Item>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800">
            ⚠️ Lưu ý: Khi gửi thông tin xe mới, hồ sơ của bạn sẽ chuyển về trạng thái <strong>CHỜ XÉT DUYỆT (PENDING)</strong> để Ban quản trị đối soát lại.
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setIsVehicleModalOpen(false)}
              className="flex-1 rounded-xl font-bold"
            >
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={updatingVehicle}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold border-0"
            >
              Lưu & Gửi Duyệt
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Cập nhật thông tin cá nhân */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800 font-black">
            <UserOutlined className="text-blue-600" />
            <span>Chỉnh Sửa Họ Tên Tài Xế</span>
          </div>
        }
        open={isPersonalModalOpen}
        onCancel={() => setIsPersonalModalOpen(false)}
        footer={null}
        destroyOnClose
        className="rounded-3xl"
      >
        <Form
          form={personalForm}
          layout="vertical"
          onFinish={handleUpdatePersonal}
          className="mt-4 space-y-3"
        >
          <Form.Item
            name="fullName"
            label={<span className="font-bold text-xs text-slate-700">Họ và tên đầy đủ <span className="text-red-500">*</span></span>}
            rules={[
              { required: true, message: 'Vui lòng nhập họ và tên!' },
              { min: 2, message: 'Tối thiểu 2 ký tự' },
            ]}
          >
            <Input placeholder="Nguyễn Văn A" className="rounded-xl font-medium" />
          </Form.Item>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setIsPersonalModalOpen(false)}
              className="flex-1 rounded-xl font-bold"
            >
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={updatingPersonal}
              className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold border-0"
            >
              Cập Nhật
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
