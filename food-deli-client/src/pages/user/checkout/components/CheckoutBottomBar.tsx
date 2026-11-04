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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-safe border-t border-surface-container">
      <div className="max-w-xl mx-auto px-gutter pt-3 pb-3 flex flex-col gap-2.5">
        {/* Price & Method Strip */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#A50064] text-white flex items-center justify-center font-bold text-[10px]">
              M
            </div>
            <span className="font-label-md text-label-md text-on-surface font-medium">
              {paymentMethodName} •••• 888
            </span>
            <span className="font-label-sm text-label-sm text-primary font-bold">(Đã kết nối)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-body-sm text-body-sm text-on-surface-variant line-through">
              {originalTotal.toLocaleString('vi-VN')}đ
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
              {finalTotal.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={orderState !== 'idle'}
          className="w-full h-13 py-3.5 px-space-lg rounded-xl bg-primary-container text-on-primary font-headline-sm text-headline-sm flex items-center justify-between shadow-md active:scale-[0.98] transition-all hover:bg-primary cursor-pointer disabled:opacity-90 font-bold"
          onClick={onPlaceOrder}
        >
          {orderState === 'loading' ? (
            <div className="flex items-center justify-center gap-2 w-full">
              <span className="material-symbols-outlined animate-spin text-[22px]">
                progress_activity
              </span>
              <span>Đang tạo đơn hàng...</span>
            </div>
          ) : orderState === 'success' ? (
            <div className="flex items-center justify-center gap-2 w-full text-on-primary">
              <span className="material-symbols-outlined text-[24px]">check_circle</span>
              <span>Đặt đơn thành công!</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
                <span>Đặt đơn ngay</span>
              </div>
              <div className="flex items-center gap-1 font-bold font-headline-sm text-headline-sm">
                <span>{finalTotal.toLocaleString('vi-VN')}đ</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </div>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CheckoutBottomBar;

