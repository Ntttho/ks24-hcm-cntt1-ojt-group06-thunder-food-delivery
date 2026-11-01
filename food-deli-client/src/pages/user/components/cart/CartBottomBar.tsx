import React from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/constants';

interface CartBottomBarProps {
  selectedPaymentMethod: string;
  totalAmount: number;
  itemCount: number;
  onOpenPaymentModal: () => void;
  onProceedToCheckout?: () => void;
  disabled?: boolean;
}

export const CartBottomBar: React.FC<CartBottomBarProps> = ({
  selectedPaymentMethod,
  totalAmount,
  itemCount,
  onOpenPaymentModal,
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
    <aside className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-safe border-t border-surface-container">
      <div className="max-w-xl mx-auto px-gutter py-3 flex flex-col gap-2">
        {/* Small order note & payment method preview */}
        <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">payments</span>
            <span>Thanh toán: <strong className="text-gray-900">{selectedPaymentMethod}</strong></span>
          </div>
          <button
            type="button"
            className="text-primary hover:underline font-bold cursor-pointer"
            onClick={onOpenPaymentModal}
          >
            Thay đổi
          </button>
        </div>

        {/* Action Button Row */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-label-sm font-label-sm text-on-surface-variant">Tổng tạm tính</span>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-lg text-headline-lg text-primary font-extrabold">
                {totalAmount.toLocaleString('vi-VN')}đ
              </span>
              <span className="text-label-sm font-label-sm text-on-surface-variant font-medium">
                ({itemCount} món)
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled={disabled}
            className={`flex-1 h-12 rounded-xl font-headline-sm text-headline-sm flex items-center justify-center gap-2 shadow-md font-bold transition-all ${
              disabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-container hover:bg-primary-tint active:scale-[0.98] text-on-primary cursor-pointer'
            }`}
            onClick={handleCheckoutClick}
          >
            <span>Tiến hành đặt hàng</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default CartBottomBar;

