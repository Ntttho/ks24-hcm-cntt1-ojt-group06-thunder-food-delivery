import type { VoucherItem } from '@/services/modules/restaurantApi';

export interface VoucherEligibilityCheck {
  eligible: boolean;
  reason?: string;
}

export function isSystemScopeVoucher(voucher: VoucherItem): boolean {
  return voucher.isSystemVoucher === true || voucher.restaurantId === null || voucher.restaurantId === undefined;
}

export function getVoucherCategoryLabel(category?: string): string {
  switch ((category || 'DISCOUNT_FOOD').toUpperCase()) {
    case 'FREESHIP':
      return 'Miễn phí vận chuyển';
    case 'NEW_USER':
      return 'Khách hàng mới';
    case 'DISCOUNT_FOOD':
      return 'Giảm giá món';
    default:
      return (category || 'DISCOUNT_FOOD').toUpperCase();
  }
}

export function checkVoucherEligibility(
  voucher: VoucherItem,
  subtotal: number,
  isNewUser: boolean = true
): VoucherEligibilityCheck {
  const now = new Date();
  if (voucher.isActive === false) {
    return { eligible: false, reason: 'Mã đã ngừng áp dụng' };
  }
  if (voucher.startDate && new Date(voucher.startDate) > now) {
    return { eligible: false, reason: 'Chưa đến thời gian áp dụng' };
  }
  if (voucher.expiryDate && new Date(voucher.expiryDate) < now) {
    return { eligible: false, reason: 'Mã đã hết hạn' };
  }
  if (voucher.usageLimit !== undefined && voucher.usageLimit !== null && (voucher.usedCount ?? 0) >= voucher.usageLimit) {
    return { eligible: false, reason: 'Mã đã hết lượt sử dụng' };
  }
  if ((voucher.voucherCategory || '').toUpperCase() === 'NEW_USER' && !isNewUser) {
    return { eligible: false, reason: 'Chỉ áp dụng cho đơn đầu tiên của khách hàng mới' };
  }
  const minVal = voucher.minOrderValue || 0;
  if (subtotal < minVal) {
    return { eligible: false, reason: `Cần mua thêm ${(minVal - subtotal).toLocaleString('vi-VN')}đ` };
  }
  return { eligible: true };
}

export function calculateVoucherDiscount(
  voucher: VoucherItem | null,
  subtotal: number,
  shippingFee: number,
  isNewUser: boolean = true
): number {
  if (!voucher) return 0;
  if (!checkVoucherEligibility(voucher, subtotal, isNewUser).eligible) return 0;

  const category = (voucher.voucherCategory || 'DISCOUNT_FOOD').toUpperCase();
  const rawValue = voucher.discountValue || voucher.discountAmount || 0;

  if (category === 'FREESHIP') {
    if (voucher.discountType === 'PERCENTAGE') {
      const calc = Math.round((shippingFee * rawValue) / 100);
      const capped = voucher.maxDiscountAmount && voucher.maxDiscountAmount > 0
        ? Math.min(calc, voucher.maxDiscountAmount)
        : calc;
      return Math.min(capped, shippingFee);
    }
    return Math.min(rawValue, shippingFee);
  }

  if (voucher.discountType === 'PERCENTAGE') {
    const calc = Math.round((subtotal * rawValue) / 100);
    const capped = voucher.maxDiscountAmount && voucher.maxDiscountAmount > 0
      ? Math.min(calc, voucher.maxDiscountAmount)
      : calc;
    return Math.min(capped, subtotal);
  }
  return Math.min(rawValue, subtotal);
}

