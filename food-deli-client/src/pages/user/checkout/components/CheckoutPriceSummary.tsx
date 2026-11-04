import React from 'react';

interface CheckoutPriceSummaryProps {
  itemsSubtotal: number;
  shippingFee: number;
  serviceFee: number;
  totalDiscount: number;
  originalTotal: number;
  finalTotal: number;
  paymentMethodDiscount?: number;
}

export const CheckoutPriceSummary: React.FC<CheckoutPriceSummaryProps> = ({
  itemsSubtotal,
  shippingFee,
  serviceFee,
  totalDiscount,
  originalTotal,
  finalTotal,
  paymentMethodDiscount = 0,
}) => {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-2.5">
      <div className="flex items-center justify-between pb-1 border-b border-surface-container-high/40">
        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
          Chi tiết hóa đơn
        </span>
        <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
          Đã bao gồm VAT
        </span>
      </div>

      <div className="flex items-center justify-between text-on-surface">
        <span className="font-body-md text-body-md text-on-surface-variant">
          Tiền món ăn (3 món)
        </span>
        <span className="font-body-md text-body-md font-medium">
          {itemsSubtotal.toLocaleString('vi-VN')}đ
        </span>
      </div>

      <div className="flex items-center justify-between text-on-surface">
        <div className="flex items-center gap-1 text-on-surface-variant">
          <span className="font-body-md text-body-md">Phí giao hàng (1.8 km)</span>
          <span className="material-symbols-outlined text-[15px] text-tertiary">info</span>
        </div>
        <span className="font-body-md text-body-md font-medium">
          {shippingFee.toLocaleString('vi-VN')}đ
        </span>
      </div>

      <div className="flex items-center justify-between text-on-surface">
        <div className="flex items-center gap-1 text-on-surface-variant">
          <span className="font-body-md text-body-md">Phí dịch vụ &amp; đóng gói</span>
          <span className="material-symbols-outlined text-[15px] text-tertiary">info</span>
        </div>
        <span className="font-body-md text-body-md font-medium">
          {serviceFee.toLocaleString('vi-VN')}đ
        </span>
      </div>

      <div className="flex items-center justify-between text-secondary">
        <span className="font-body-md text-body-md">Giảm giá món ăn (THUNDERNEW)</span>
        <span className="font-body-md text-body-md font-semibold">-25.000đ</span>
      </div>

      <div className="flex items-center justify-between text-primary">
        <span className="font-body-md text-body-md">Giảm phí vận chuyển (FREESHIP15K)</span>
        <span className="font-body-md text-body-md font-semibold">-15.000đ</span>
      </div>

      {paymentMethodDiscount > 0 && (
        <div className="flex items-center justify-between text-primary font-semibold">
          <span className="font-body-md text-body-md">Ưu đãi phương thức thanh toán</span>
          <span className="font-body-md text-body-md">
            -{paymentMethodDiscount.toLocaleString('vi-VN')}đ
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-surface-container-high my-1" />

      <div className="flex items-end justify-between pt-1">
        <div className="flex flex-col">
          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
            Tổng cộng thanh toán
          </span>
          <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">savings</span>
            Tiết kiệm được {totalDiscount.toLocaleString('vi-VN')}đ
          </span>
        </div>
        <div className="text-right">
          <div className="font-body-sm text-body-sm text-on-surface-variant line-through">
            {originalTotal.toLocaleString('vi-VN')}đ
          </div>
          <div className="font-headline-lg text-headline-lg text-primary font-extrabold leading-none">
            {finalTotal.toLocaleString('vi-VN')}đ
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPriceSummary;

