import React from 'react';
import { Tag } from 'antd';
import type { Shop } from '@/services/modules/restaurantApi';

interface MerchantApprovalGateProps {
  activeRestaurant: Shop;
  restaurants: Shop[];
  onSelectShop: (shop: Shop) => void;
  onOpenAddShopModal: () => void;
}

export const MerchantPendingApprovalGate: React.FC<MerchantApprovalGateProps> = ({
  activeRestaurant,
  restaurants,
  onSelectShop,
  onOpenAddShopModal,
}) => {
  const otherApprovedShops = restaurants.filter(
    (s) => s.id !== activeRestaurant.id && s.approvalStatus === 'APPROVED'
  );

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white rounded-3xl shadow-xl border border-amber-200/80 overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-8 text-white text-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 ring-4 ring-white/30 text-4xl shadow-inner">
              🏪
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-900/30 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase mb-2 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping"></span>
              Đang Chờ Quản Trị Viên Phê Duyệt
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">{activeRestaurant.name}</h1>
            <p className="text-white/80 text-sm mt-1 max-w-xl">
              Hồ sơ chi nhánh quán ăn đang trong quy trình xét duyệt tiêu chuẩn hoạt động và an toàn thực phẩm.
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-200/60 space-y-3">
            <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
              <span>📋</span> Thông tin chi nhánh đã nộp xét duyệt
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-amber-200/50">
                <span className="text-slate-500">Mã chi nhánh:</span>
                <span className="font-bold text-slate-800">#{activeRestaurant.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-amber-200/50">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-extrabold text-amber-700 uppercase">CHỜ PHÊ DUYỆT (PENDING)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-amber-200/50 md:col-span-2">
                <span className="text-slate-500 shrink-0">Địa chỉ quán:</span>
                <span className="font-medium text-slate-800 text-right truncate ml-2">{activeRestaurant.address}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs text-slate-600">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span>🔒</span> Các tính năng tạm thời bị khóa:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-500">
              <div className="flex items-center gap-2 py-1">
                <span className="text-rose-500 font-bold">✕</span> Không thể mở cửa nhận đơn từ khách hàng
              </div>
              <div className="flex items-center gap-2 py-1">
                <span className="text-rose-500 font-bold">✕</span> Khóa tính năng tạo món ăn & thực đơn
              </div>
              <div className="flex items-center gap-2 py-1">
                <span className="text-rose-500 font-bold">✕</span> Khóa tạo danh mục món & Topping
              </div>
              <div className="flex items-center gap-2 py-1">
                <span className="text-rose-500 font-bold">✕</span> Khóa phát hành Voucher & Khuyến mãi
              </div>
            </div>
          </div>

          {/* If merchant owns other approved branches, allow fast switch */}
          {otherApprovedShops.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-700">
                Hoặc bạn có thể chuyển sang quản lý các chi nhánh khác đã được phê duyệt:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {otherApprovedShops.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => onSelectShop(shop)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 transition-all text-left text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{shop.name}</div>
                      <div className="text-slate-400 text-[10px] truncate max-w-[200px]">{shop.address}</div>
                    </div>
                    <span className="text-orange-500 font-bold">Chuyển →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              🔄 Kiểm tra lại trạng thái
            </button>
            <button
              onClick={onOpenAddShopModal}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
            >
              + Đăng ký thêm chi nhánh khác
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MerchantRejectedGate: React.FC<MerchantApprovalGateProps> = ({
  activeRestaurant,
  restaurants,
  onSelectShop,
  onOpenAddShopModal,
}) => {
  const otherApprovedShops = restaurants.filter(
    (s) => s.id !== activeRestaurant.id && s.approvalStatus === 'APPROVED'
  );

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white rounded-3xl shadow-xl border border-rose-200 overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-rose-500 to-red-600 p-8 text-white text-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 ring-4 ring-white/30 text-4xl shadow-inner">
              ⚠️
            </div>
            <Tag color="red" className="text-xs font-black uppercase px-3 py-1 rounded-full mb-2">
              Hồ sơ bị từ chối
            </Tag>
            <h1 className="text-2xl md:text-3xl font-black text-white">{activeRestaurant.name}</h1>
            <p className="text-white/80 text-sm mt-1 max-w-xl">
              Chi nhánh quán ăn chưa đủ điều kiện để kích hoạt trên hệ thống Thunder Deli.
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="bg-rose-50/70 rounded-2xl p-5 border border-rose-200/60 space-y-2 text-xs">
            <div className="font-bold text-rose-900 text-sm">Lý do từ chối từ Ban Quản Trị:</div>
            <p className="text-rose-700 font-medium leading-relaxed bg-white/70 p-3 rounded-xl border border-rose-100">
              {activeRestaurant.rejectReason ||
                'Thông tin giấy phép kinh doanh hoặc địa chỉ quán chưa đầy đủ / không hợp lệ. Vui lòng liên hệ Admin để được giải đáp chi tiết.'}
            </p>
          </div>

          {otherApprovedShops.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-700">
                Chuyển sang quản lý các chi nhánh hợp lệ khác của bạn:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {otherApprovedShops.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => onSelectShop(shop)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 transition-all text-left text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{shop.name}</div>
                      <div className="text-slate-400 text-[10px] truncate max-w-[200px]">{shop.address}</div>
                    </div>
                    <span className="text-orange-500 font-bold">Chuyển →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              🔄 Tải lại trang
            </button>
            <button
              onClick={onOpenAddShopModal}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
            >
              + Đăng ký chi nhánh mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
