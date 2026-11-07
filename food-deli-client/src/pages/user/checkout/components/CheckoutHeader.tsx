import React from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/constants';

interface CheckoutHeaderProps {
  shopName?: string;
  distance?: string;
}

export const CheckoutHeader: React.FC<CheckoutHeaderProps> = ({
  shopName = 'Thunder Food Delivery',
  distance = '1.8 km',
}) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 pt-safe bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-xl mx-auto h-16 px-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            aria-label="Quay lại giỏ hàng"
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex-shrink-0 cursor-pointer"
            onClick={() => navigate(APP_ROUTES.CART)}
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>

          {/* Logo with hover animation & click to Home */}
          <div
            onClick={() => navigate('/')}
            title="Quay về Trang chủ Thunder Food"
            className="flex items-center gap-2 cursor-pointer group p-1 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm group-hover:shadow-orange-200 group-hover:shadow-md transition-shadow">
              ⚡
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm text-gray-900 group-hover:text-orange-600 truncate font-extrabold !mb-0 leading-tight transition-colors">
                Xác nhận đơn hàng
              </h1>
              <div className="flex items-center gap-1 text-gray-400 truncate text-[11px]">
                <span className="material-symbols-outlined text-[13px] text-orange-500">storefront</span>
                <span className="truncate">
                  {shopName} {distance ? `• ${distance}` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Home Button */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:text-orange-600 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">home</span>
          <span className="hidden sm:inline">Trang chủ</span>
        </button>
      </div>
    </header>
  );
};

export default CheckoutHeader;
