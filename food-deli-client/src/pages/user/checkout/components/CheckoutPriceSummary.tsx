import React from 'react';

interface CheckoutPriceSummaryProps {
  itemsSubtotal: number;
  shippingFee: number;
  serviceFee: number;
  vatAmount?: number;
  vatIncluded?: boolean;
  totalDiscount: number;
  originalTotal: number;
  finalTotal: number;
  itemCount?: number;
  paymentMethodDiscount?: number;
}

export const CheckoutPriceSummary: React.FC<CheckoutPriceSummaryProps> = ({
  itemsSubtotal,
  shippingFee,
  serviceFee: _serviceFee,
  vatAmount: _vatAmount = 0,
  vatIncluded = true,
  totalDiscount,
  originalTotal,
  finalTotal,
  itemCount = 1,
  paymentMethodDiscount: _paymentMethodDiscount = 0,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col gap-2.5">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <span className="text-sm text-gray-900 font-extrabold">
          Chi tiết thanh toán
        </span>
        <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
          {vatIncluded ? 'Giá đã gồm thuế' : 'Giao nhanh'}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Tiền món ăn ({itemCount} món)</span>
        <span className="text-gray-900 font-semibold">
          {itemsSubtotal.toLocaleString('vi-VN')}đ
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Phí giao hàng</span>
        <span className="text-gray-900 font-semibold">
          {shippingFee.toLocaleString('vi-VN')}đ
        </span>
      </div>

      {totalDiscount > 0 && (
        <div className="flex items-center justify-between text-xs text-orange-600 font-semibold">
          <span>Khuyến mãi &amp; giảm giá</span>
          <span>-{totalDiscount.toLocaleString('vi-VN')}đ</span>
        </div>
      )}

      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-900">Tổng thanh toán cuối cùng</span>
        <div className="flex items-baseline gap-1.5">
          {originalTotal > finalTotal && (
            <span className="text-xs text-gray-400 line-through">
              {originalTotal.toLocaleString('vi-VN')}đ
            </span>
          )}
          <span className="text-lg font-extrabold text-orange-600">
            {finalTotal.toLocaleString('vi-VN')}đ
          </span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPriceSummary;
