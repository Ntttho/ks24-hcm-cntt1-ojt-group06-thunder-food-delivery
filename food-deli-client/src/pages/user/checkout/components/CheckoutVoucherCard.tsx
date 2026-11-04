import React from 'react';

interface CheckoutVoucherCardProps {
  totalDiscount: number;
  onOpenVoucherPicker?: () => void;
}

export const CheckoutVoucherCard: React.FC<CheckoutVoucherCardProps> = ({
  totalDiscount,
  onOpenVoucherPicker,
}) => {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              confirmation_number
            </span>
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            Khuyến mãi &amp; Mã giảm giá
          </span>
        </div>
        <button
          type="button"
          aria-label="Chọn hoặc nhập mã khác"
          className="font-label-md text-label-md text-primary font-bold flex items-center gap-0.5 active:scale-95 transition-transform cursor-pointer"
          onClick={onOpenVoucherPicker || (() => alert('Mã giảm giá tốt nhất đã được tự động áp dụng!'))}
        >
          Nhập mã khác
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
      </div>

      {/* Applied Vouchers Badges */}
      <div className="flex flex-col gap-2">
        {/* Voucher 1 */}
        <div className="flex items-center justify-between bg-secondary-fixed/30 rounded-xl p-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">sell</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md text-on-surface truncate font-bold">
                THUNDERNEW
              </span>
              <span className="font-body-sm text-body-sm text-secondary truncate">
                Giảm 25.000đ cho đơn đầu tiên
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-label-md text-label-md text-secondary font-bold">
              -25.000đ
            </span>
            <span
              className="material-symbols-outlined text-primary text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
        </div>

        {/* Voucher 2 */}
        <div className="flex items-center justify-between bg-primary-fixed/20 rounded-xl p-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">moped</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md text-on-surface truncate font-bold">
                FREESHIP15K
              </span>
              <span className="font-body-sm text-body-sm text-primary truncate">
                Hỗ trợ 15.000đ phí giao hàng
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-label-md text-label-md text-primary font-bold">
              -15.000đ
            </span>
            <span
              className="material-symbols-outlined text-primary text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-primary font-semibold">
        <span className="material-symbols-outlined text-[16px]">celebration</span>
        <span className="font-label-sm text-label-sm">
          Đã tiết kiệm được {totalDiscount.toLocaleString('vi-VN')}đ cho đơn hàng này!
        </span>
      </div>
    </div>
  );
};

export default CheckoutVoucherCard;

