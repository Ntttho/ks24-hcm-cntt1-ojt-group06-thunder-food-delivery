import React from 'react';

interface CheckoutBottomBarProps {
  paymentMethodName: string;
  originalTotal: number;
  finalTotal: number;
  orderState: 'idle' | 'loading' | 'success';
  onPlaceOrder: () => void;
}

export const CheckoutBottomBar: React.FC<CheckoutBottomBarProps> = ({
  paymentMethodName,
  originalTotal,
  finalTotal,
  orderState,
  onPlaceOrder,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-safe border-t border-gray-100">
      <div className="max-w-xl mx-auto px-4 pt-3 pb-3 flex flex-col gap-2">
        {/* Price & Method Strip */}
        <div className="flex items-center justify-between px-1 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-orange-500">payments</span>
            <span>Thanh toán: <strong className="text-gray-900 font-semibold">{paymentMethodName}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            {originalTotal > finalTotal && (
              <span className="text-xs text-gray-400 line-through">
                {originalTotal.toLocaleString('vi-VN')}đ
              </span>
            )}
            <span className="text-base font-extrabold text-orange-600">
              {finalTotal.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={orderState !== 'idle'}
          className="w-full h-12 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base flex items-center justify-between shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-80"
          onClick={onPlaceOrder}
        >
          {orderState === 'loading' ? (
            <div className="flex items-center justify-center gap-2 w-full text-white">
              <span className="material-symbols-outlined animate-spin text-[20px]">
                progress_activity
              </span>
              <span>Đang kết nối &amp; tạo đơn hàng...</span>
            </div>
          ) : orderState === 'success' ? (
            <div className="flex items-center justify-center gap-2 w-full text-white font-bold">
              <span className="material-symbols-outlined text-[22px]">check_circle</span>
              <span>Đặt đơn thành công!</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                <span>Đặt đơn ngay</span>
              </div>
              <div className="flex items-center gap-1 font-extrabold">
                <span>{finalTotal.toLocaleString('vi-VN')}đ</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CheckoutBottomBar;
