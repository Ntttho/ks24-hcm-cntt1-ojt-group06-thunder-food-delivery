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
    <section className="px-4 mt-4">
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col gap-3">
        {/* Promo code trigger row */}
        <div
          className="flex items-center justify-between bg-orange-50/70 border border-orange-100 px-3.5 py-2.5 rounded-xl cursor-pointer hover:bg-orange-50 transition-colors"
          onClick={onOpenPromoSelector}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-500 text-[20px]">
              confirmation_number
            </span>
            <span className="text-xs text-gray-800 font-bold">
              Mã giảm giá Thunder Food
            </span>
          </div>
          <div className="flex items-center gap-1 text-orange-600 text-xs font-bold">
            <span>Chọn voucher</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </div>
        </div>

        {/* Price breakdown rows */}
        <div className="flex flex-col gap-2 pt-1 text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <span>Tổng tiền món ({totalItemCount} phần)</span>
            <span className="text-gray-900 font-bold text-sm">
              {subtotal.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Phí giao hàng dự kiến</span>
            <span className="font-semibold text-gray-800">{shippingFee.toLocaleString('vi-VN')}đ</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-orange-600 font-semibold">
              <span>Giảm giá</span>
              <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CartPriceSummary;
