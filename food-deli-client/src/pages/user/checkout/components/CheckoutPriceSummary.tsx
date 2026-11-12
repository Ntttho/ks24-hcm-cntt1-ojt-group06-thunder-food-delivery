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
  serviceFee,
  vatAmount = 0,
  vatIncluded = true,
  totalDiscount,
  originalTotal,
  finalTotal,
  itemCount = 1,
  paymentMethodDiscount = 0,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col gap-2.5">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <span className="text-sm text-gray-900 font-extrabold">
          Chi tiết hóa đơn
        </span>
        <span className="text-xs text-gray-400 font-medium">
          {vatIncluded ? 'Đã bao gồm VAT' : 'Chưa bao gồm VAT'}
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

      {serviceFee > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Phí dịch vụ &amp; đóng gói</span>
          <span className="text-gray-900 font-semibold">
            {serviceFee.toLocaleString('vi-VN')}đ
          </span>
        </div>
      )}

      {!vatIncluded && vatAmount > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Thuế VAT</span>
          <span className="text-gray-900 font-semibold">
            {vatAmount.toLocaleString('vi-VN')}đ
          </span>
        </div>
      )}

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
