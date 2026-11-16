import React from 'react';
import { Tag } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { ShieldCheck, RotateCcw, Clock } from '../icons';
import type { DriverStatusResponse } from '@/services/modules/driverApi';

interface DriverApprovalGateProps {
  driverProfile: DriverStatusResponse | null;
  onRefresh: () => void;
  onLogout: () => void;
}

export const DriverPendingApprovalView: React.FC<DriverApprovalGateProps> = ({
  driverProfile,
  onRefresh,
  onLogout,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-amber-200/80 p-6 md:p-8 text-center space-y-6">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-10 h-10 text-amber-600" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
          </span>
        </div>

        <div className="space-y-2">
          <Tag color="gold" className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Đang chờ xét duyệt
          </Tag>
          <h2 className="text-xl font-black text-slate-800">
            Hồ sơ tài xế đang chờ Admin phê duyệt
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Hồ sơ thông tin xe và bằng lái của bạn đã được ghi nhận. Quản trị viên đang tiến hành xét duyệt (thường trong vòng 24 giờ). Khi được duyệt, bạn sẽ có thể bật trực tuyến và nhận cuốc xe ngay lập tức.
          </p>
        </div>

        <div className="bg-amber-50/60 rounded-2xl p-4 text-left border border-amber-100 space-y-2 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-amber-100/60">
            <span className="text-slate-500">Mã tài xế:</span>
            <span className="font-bold text-slate-800">#{driverProfile?.userId || '...'}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-amber-100/60">
            <span className="text-slate-500">Biển số đăng ký:</span>
            <span className="font-bold text-amber-700">{driverProfile?.licensePlate || 'Đang cập nhật'}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-amber-100/60">
            <span className="text-slate-500">Loại phương tiện:</span>
            <span className="font-bold text-slate-800">{driverProfile?.vehicleType || 'Xe máy'}</span>
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="text-slate-500">Trạng thái:</span>
            <span className="font-extrabold text-amber-600 uppercase">CHỜ DUYỆT (PENDING)</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Thời gian xét duyệt thông thường từ 1 - 24 giờ làm việc.</span>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={onRefresh}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Kiểm tra lại trạng thái
          </button>
          <button
            onClick={onLogout}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition-all cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export const DriverRejectedView: React.FC<DriverApprovalGateProps> = ({
  onRefresh,
  onLogout,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-rose-200 p-6 md:p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <ExclamationCircleOutlined className="text-4xl" />
        </div>

        <div className="space-y-2">
          <Tag color="red" className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Hồ sơ bị từ chối
          </Tag>
          <h2 className="text-xl font-black text-slate-800">
            Hồ sơ đối tác chưa được chấp thuận
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Hồ sơ đăng ký tài xế của bạn chưa đạt yêu cầu của Ban Quản Trị hoặc thông tin xe/bằng lái chưa hợp lệ. Vui lòng liên hệ Admin để được hỗ trợ.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={onRefresh}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Tải lại trang
          </button>
          <button
            onClick={onLogout}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition-all cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};
