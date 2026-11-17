import React from 'react';
import { Tag } from 'antd';
import { formatCurrency } from '@/utils/formatters';
import type { VoucherItem } from '@/services/modules/restaurantApi';
import { getVoucherCategoryLabel } from '@/utils/voucherUtils';

interface CheckoutVoucherCardProps {
  totalDiscount: number;
  shopDiscount: number;
  systemDiscount: number;
  appliedRestaurantVoucher: VoucherItem | null;
  appliedSystemVoucher: VoucherItem | null;
  onOpenVoucherPicker: () => void;
  onRemoveRestaurantVoucher: () => void;
  onRemoveSystemVoucher: () => void;
}

export const CheckoutVoucherCard: React.FC<CheckoutVoucherCardProps> = ({
  totalDiscount,
  shopDiscount,
  systemDiscount,
  appliedRestaurantVoucher,
  appliedSystemVoucher,
  onOpenVoucherPicker,
  onRemoveRestaurantVoucher,
  onRemoveSystemVoucher,
}) => {
  const hasAny = !!appliedRestaurantVoucher || !!appliedSystemVoucher;

  const renderBadge = (
    voucher: VoucherItem,
    discount: number,
    scopeLabel: string,
    isSystem: boolean,
    onRemove: () => void
  ) => (
    <div
      key={voucher.id}
      className={`flex items-center justify-between rounded-xl p-3 border ${
        isSystem ? 'bg-blue-50/70 border-blue-200' : 'bg-orange-50 border-orange-200'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-8 h-8 rounded-lg text-white flex items-center justify-center flex-shrink-0 shadow-sm ${
            isSystem ? 'bg-blue-600' : 'bg-orange-500'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {voucher.voucherCategory === 'FREESHIP' ? 'local_shipping' : 'sell'}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-xs text-slate-900 font-extrabold truncate">{voucher.code}</span>
            <Tag color={isSystem ? 'blue' : 'orange'} className="m-0 text-[10px] font-bold">
              {scopeLabel}
            </Tag>
            <Tag color="cyan" className="m-0 text-[10px]">
              {getVoucherCategoryLabel(voucher.voucherCategory)}
            </Tag>
          </div>
          <span className="text-[11px] text-slate-500 truncate">
            {voucher.discountType === 'PERCENTAGE'
              ? `Giảm ${voucher.discountValue}%`
              : `Giảm ${formatCurrency(voucher.discountValue)}`}
            {' • '}
            {voucher.minOrderValue
              ? `Đơn tối thiểu ${formatCurrency(voucher.minOrderValue)}`
              : 'Không yêu cầu đơn tối thiểu'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-emerald-600 font-extrabold">-{formatCurrency(discount)}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
          title="Bỏ áp dụng mã này"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );

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
            Khuyến mãi Quán &amp; Hệ thống (1 Quán + 1 Toàn sàn)
          </span>
        </div>
        <button
          type="button"
          aria-label="Chọn hoặc nhập mã khác"
          className="text-xs text-orange-600 font-bold flex items-center gap-0.5 hover:text-orange-700 active:scale-95 transition-all cursor-pointer"
          onClick={onOpenVoucherPicker}
        >
          {hasAny ? 'Đổi mã khác' : 'Chọn mã'}
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
      </div>

      {hasAny ? (
        <div className="flex flex-col gap-2">
          {appliedSystemVoucher &&
            renderBadge(appliedSystemVoucher, systemDiscount, 'Toàn sàn', true, onRemoveSystemVoucher)}
          {appliedRestaurantVoucher &&
            renderBadge(appliedRestaurantVoucher, shopDiscount, 'Quán ăn', false, onRemoveRestaurantVoucher)}
        </div>
      ) : (
        <div
          onClick={onOpenVoucherPicker}
          className="flex items-center justify-between bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3 cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all"
        >
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <span className="material-symbols-outlined text-orange-500 text-lg">local_offer</span>
            <span>Chọn mã giảm giá quán ăn hoặc mã Freeship / Toàn sàn</span>
          </div>
          <span className="text-xs font-semibold text-orange-600">Chọn mã ưu đãi &gt;</span>
        </div>
      )}

      {totalDiscount > 0 && (
        <div className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
          <span className="material-symbols-outlined text-[16px]">celebration</span>
          <span>Bạn đã tiết kiệm được {formatCurrency(totalDiscount)} với các mã ưu đãi đã chọn!</span>
        </div>
      )}
    </div>
  );
};

export default CheckoutVoucherCard;
