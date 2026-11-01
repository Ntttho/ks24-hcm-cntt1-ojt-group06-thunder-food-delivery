import React from 'react';

interface CartPriceSummaryProps {
  totalItemCount: number;
  subtotal: number;
  shippingFee: number;
  discountAmount?: number;
  onOpenPromoSelector?: () => void;
}

export const CartPriceSummary: React.FC<CartPriceSummaryProps> = ({
  totalItemCount,
  subtotal,
  shippingFee,
  discountAmount = 0,
  onOpenPromoSelector,
}) => {
  return (
    <section className="px-gutter mt-space-md">
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-3">
        {/* Promo code trigger row */}
        <div
          className="flex items-center justify-between bg-surface-container-low px-3 py-2.5 rounded-lg cursor-pointer hover:bg-surface-container transition-colors"
          onClick={onOpenPromoSelector}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-container text-[20px]">
              confirmation_number
            </span>
            <span className="font-label-md text-label-md text-on-surface font-bold">
              Mã giảm giá ThunderFood
            </span>
          </div>
          <div className="flex items-center gap-1 text-primary font-label-md text-label-md font-semibold">
            <span>Áp dụng</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </div>
        </div>

        {/* Price breakdown rows */}
        <div className="flex flex-col gap-2 pt-2 text-body-sm font-body-sm text-on-surface-variant">
          <div className="flex justify-between items-center">
            <span>Tổng phụ món ăn ({totalItemCount} phần)</span>
            <span className="text-on-surface font-headline-sm text-headline-sm font-bold">
              {subtotal.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Phí áp dụng theo khoảng cách</span>
            <span className="font-semibold text-gray-800">{shippingFee.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between items-center text-primary font-label-md font-semibold">
            <span>Giảm giá món (Flash Deal)</span>
            <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartPriceSummary;

