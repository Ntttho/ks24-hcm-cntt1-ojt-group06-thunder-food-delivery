import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from '../icons';
import type { DriverWalletSummary } from '@/services/modules/driverApi';
import { APP_ROUTES } from '@/constants';

interface ShipperWalletViewProps {
  walletData: DriverWalletSummary | null;
  loadingWallet: boolean;
  onRefresh: () => void;
}

export const ShipperWalletView: React.FC<ShipperWalletViewProps> = ({
  walletData,
  loadingWallet,
  onRefresh,
}) => {
  if (loadingWallet && !walletData) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
        Đang tải dữ liệu ví từ máy chủ...
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
        Không có dữ liệu ví.
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-600/20">
        <span className="text-xs font-semibold text-emerald-100 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          Thu nhập hôm nay
        </span>
        <div className="text-3xl font-black mt-2 tracking-tight">
          {walletData.todayEarnings.toLocaleString('vi-VN')} đ
        </div>
        <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-emerald-200 block text-[11px]">Cuốc xong hôm nay</span>
            <span className="font-black text-sm text-white">
              {walletData.completedTripsToday} chuyến
            </span>
          </div>
          <div>
            <span className="text-emerald-200 block text-[11px]">Tổng tích lũy</span>
            <span className="font-black text-sm text-white">
              {walletData.walletBalance.toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Chuyến hoàn thành gần nhất
          </h3>
          <button
            onClick={onRefresh}
            className="text-[11px] text-emerald-600 font-bold cursor-pointer hover:underline"
          >
            Làm mới
          </button>
        </div>

        {walletData.recentTrips.length > 0 ? (
          <div className="space-y-2 text-xs">
            {walletData.recentTrips.map((trip) => (
              <div
                key={trip.id}
                className="p-3 rounded-2xl bg-slate-50 flex items-center justify-between border border-slate-100"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-bold text-slate-800 block truncate">
                    {trip.orderCode} • {trip.restaurantName}
                  </span>
                  <span className="text-slate-400 text-[10px] block truncate">
                    {trip.address} • {trip.time}
                  </span>
                </div>
                <span className="font-black text-emerald-600 text-xs shrink-0">
                  +{trip.earning.toLocaleString('vi-VN')} đ
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">
            Chưa có chuyến xe nào hoàn thành.
          </p>
        )}

        <Link
          to={APP_ROUTES.SHIPPER_HISTORY}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
        >
          <span>Xem toàn bộ lịch sử đơn hàng &gt;</span>
        </Link>
      </div>
    </div>
  );
};

export default ShipperWalletView;

