import React from 'react';

interface CartPriceSummaryProps {
  totalItemCount: number;
  subtotal: number;
  shippingFee: number;
  discountAmount?: number;
}

export const CartPriceSummary: React.FC<CartPriceSummaryProps> = ({
  totalItemCount,
  subtotal,
  shippingFee,
  discountAmount = 0,
}) => {
  return (
    <section className="px-4 mt-4">
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col gap-3">
        {/* Price breakdown rows */}
        <div className="flex flex-col gap-2.5 text-xs text-gray-500">
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
