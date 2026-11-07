import React from 'react';
import { formatCurrency } from '@/utils/formatters';
import type { VoucherItem } from '@/services/modules/restaurantApi';

interface CheckoutVoucherCardProps {
  totalDiscount: number;
  appliedVoucher: VoucherItem | null;
  onOpenVoucherPicker: () => void;
  onRemoveVoucher: () => void;
}

export const CheckoutVoucherCard: React.FC<CheckoutVoucherCardProps> = ({
  totalDiscount,
  appliedVoucher,
  onOpenVoucherPicker,
  onRemoveVoucher,
}) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              confirmation_number
            </span>
          </div>
          <span className="font-bold text-sm text-slate-800">
            Khuyến mãi &amp; Mã giảm giá (Tối đa 1 mã)
          </span>
        </div>
        <button
          type="button"
          aria-label="Chọn hoặc nhập mã khác"
          className="text-xs text-orange-600 font-bold flex items-center gap-0.5 hover:text-orange-700 active:scale-95 transition-all cursor-pointer"
          onClick={onOpenVoucherPicker}
        >
          {appliedVoucher ? 'Đổi mã khác' : 'Chọn mã'}
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
      </div>

      {/* Applied Voucher Badge or Placeholder */}
      {appliedVoucher ? (
        <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl p-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">sell</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-900 font-extrabold truncate">
                  {appliedVoucher.code}
                </span>
                <span className="text-[10px] font-bold bg-orange-200/80 text-orange-800 px-1.5 py-0.2 rounded">
                  {appliedVoucher.discountType === 'PERCENTAGE'
                    ? `Giảm ${appliedVoucher.discountValue}%`
                    : `Giảm ${formatCurrency(appliedVoucher.discountValue)}`}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 truncate">
                {appliedVoucher.minOrderValue
                  ? `Đơn tối thiểu ${formatCurrency(appliedVoucher.minOrderValue)}`
                  : 'Không giới hạn đơn tối thiểu'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-600 font-extrabold">
              -{formatCurrency(totalDiscount)}
            </span>
            <button
              type="button"
              onClick={onRemoveVoucher}
              className="text-slate-400 hover:text-red-500 transition-colors p-1"
              title="Bỏ áp dụng mã này"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={onOpenVoucherPicker}
          className="flex items-center justify-between bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3 cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all"
        >
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <span className="material-symbols-outlined text-orange-500 text-lg">local_offer</span>
            <span>Chưa chọn mã giảm giá nào cho đơn này</span>
          </div>
          <span className="text-xs font-semibold text-orange-600">Chọn mã ưu đãi &gt;</span>
        </div>
      )}

      {totalDiscount > 0 && (
        <div className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
          <span className="material-symbols-outlined text-[16px]">celebration</span>
          <span>Bạn đã tiết kiệm được {formatCurrency(totalDiscount)} với mã giảm giá này!</span>
        </div>
      )}
    </div>
  );
};

export default CheckoutVoucherCard;
