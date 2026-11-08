import React from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/constants';

interface CartBottomBarProps {
  totalAmount: number;
  itemCount: number;
  onProceedToCheckout?: () => void;
  disabled?: boolean;
}

export const CartBottomBar: React.FC<CartBottomBarProps> = ({
  totalAmount,
  itemCount,
  onProceedToCheckout,
  disabled = false,
}) => {
  const navigate = useNavigate();

  const handleCheckoutClick = () => {
    if (disabled) return;
    if (onProceedToCheckout) {
      onProceedToCheckout();
    } else {
      navigate(APP_ROUTES.CHECKOUT);
    }
  };

  return (
    <aside className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe border-t border-gray-100">
      <div className="max-w-xl mx-auto px-4 py-3">
        {/* Action Button Row */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-gray-400 font-medium">Tổng thanh toán</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-orange-600">
                {totalAmount.toLocaleString('vi-VN')}đ
              </span>
              <span className="text-xs text-gray-400 font-medium">
                ({itemCount} món)
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={disabled}
            className={`flex-1 h-12 rounded-xl text-base flex items-center justify-center gap-2 font-bold transition-all ${
              disabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white cursor-pointer shadow-md shadow-orange-500/20'
            }`}
            onClick={handleCheckoutClick}
          >
            <span>Tiến hành đặt hàng</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default CartBottomBar;
