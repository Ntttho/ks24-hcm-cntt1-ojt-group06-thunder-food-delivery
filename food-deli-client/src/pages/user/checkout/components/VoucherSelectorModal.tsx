import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Radio, Tag, Empty, Spin, Button, Input, Divider, message } from 'antd';
import { formatCurrency } from '@/utils/formatters';
import { restaurantApi, type VoucherItem } from '@/services/modules/restaurantApi';
import { orderApi } from '@/services/modules/orderApi';
import {
  calculateVoucherDiscount,
  checkVoucherEligibility,
  getVoucherCategoryLabel,
  isSystemScopeVoucher,
} from '@/utils/voucherUtils';

interface VoucherSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: number;
  subtotal: number;
  shippingFee: number;
  appliedRestaurantVoucher: VoucherItem | null;
  appliedSystemVoucher: VoucherItem | null;
  isNewUser?: boolean;
  onApplyVouchers: (selection: {
    restaurantVoucher: VoucherItem | null;
    systemVoucher: VoucherItem | null;
  }) => void;
}

export const VoucherSelectorModal: React.FC<VoucherSelectorModalProps> = ({
  isOpen,
  onClose,
  restaurantId,
  subtotal,
  shippingFee,
  appliedRestaurantVoucher,
  appliedSystemVoucher,
  isNewUser: initialIsNewUser = true,
  onApplyVouchers,
}) => {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isNewUser, setIsNewUser] = useState<boolean>(initialIsNewUser);
  const [selectedShopVoucherId, setSelectedShopVoucherId] = useState<number | null>(null);
  const [selectedSystemVoucherId, setSelectedSystemVoucherId] = useState<number | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [validatingCode, setValidatingCode] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setSelectedShopVoucherId(appliedRestaurantVoucher?.id ?? null);
    setSelectedSystemVoucherId(appliedSystemVoucher?.id ?? null);
    setManualCode('');
    setLoading(true);

    Promise.all([
      restaurantApi.getVouchers({ restaurantId, activeOnly: true }),
      orderApi.getVoucherEligibility().catch(() => null),
    ])
      .then(([vouchersRes, eligibilityRes]) => {
        if (!active) return;
        const list = Array.isArray(vouchersRes?.data) ? vouchersRes.data : [];
        setVouchers(list.filter((v) => v.isActive !== false));
        if (eligibilityRes?.data && typeof eligibilityRes.data.isNewUser === 'boolean') {
          setIsNewUser(eligibilityRes.data.isNewUser);
        }
      })
      .catch(() => {
        if (active) {
          message.error('Không thể tải danh sách mã giảm giá');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, restaurantId, appliedRestaurantVoucher, appliedSystemVoucher]);

  const shopVouchers = useMemo(
    () => vouchers.filter((v) => !isSystemScopeVoucher(v)),
    [vouchers]
  );

  const systemVouchers = useMemo(
    () => vouchers.filter((v) => isSystemScopeVoucher(v)),
    [vouchers]
  );

  const handleValidateManualCode = async () => {
    const trimmed = manualCode.trim().toUpperCase();
    if (!trimmed) {
      message.warning('Vui lòng nhập mã voucher');
      return;
    }
    setValidatingCode(true);
    try {
      const res = await restaurantApi.validateVoucher({
        code: trimmed,
        restaurantId,
        orderAmount: subtotal,
        shippingFee,
        isNewUser,
      });
      const result = res?.data;
      if (!result || !result.isValid || !result.voucherId) {
        message.error(result?.message || 'Mã voucher không hợp lệ');
        return;
      }

      let targetVoucher = vouchers.find((v) => v.id === result.voucherId);
      if (!targetVoucher) {
        try {
          const detailRes = await restaurantApi.getVoucherById(result.voucherId);
          if (detailRes?.data) {
            targetVoucher = detailRes.data;
            setVouchers((prev) => [detailRes.data, ...prev.filter((p) => p.id !== detailRes.data.id)]);
          }
        } catch {
          targetVoucher = {
            id: result.voucherId,
            restaurantId: result.restaurantId ?? null,
            isSystemVoucher: result.isSystemVoucher,
            voucherCategory: result.voucherCategory,
            code: result.code,
            discountType: result.discountType || 'FIXED',
            discountValue: result.discountValue || result.discountAmount || 0,
            discountAmount: result.discountAmount,
            minOrderValue: result.minOrderValue,
            expiryDate: new Date(Date.now() + 86400000).toISOString(),
            isActive: true,
          };
          setVouchers((prev) => [targetVoucher!, ...prev]);
        }
      }

      if (result.isSystemVoucher) {
        setSelectedSystemVoucherId(result.voucherId);
        message.success(`Đã chọn voucher toàn sàn ${result.code}`);
      } else {
        setSelectedShopVoucherId(result.voucherId);
        message.success(`Đã chọn voucher quán ${result.code}`);
      }
      setManualCode('');
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể kiểm tra mã voucher');
    } finally {
      setValidatingCode(false);
    }
  };

  const handleApply = () => {
    const shopVoucher = shopVouchers.find((v) => v.id === selectedShopVoucherId) || null;
    const sysVoucher = systemVouchers.find((v) => v.id === selectedSystemVoucherId) || null;

    if (shopVoucher) {
      const chk = checkVoucherEligibility(shopVoucher, subtotal, isNewUser);
      if (!chk.eligible) {
        message.warning(`${shopVoucher.code}: ${chk.reason}`);
        return;
      }
    }
    if (sysVoucher) {
      const chk = checkVoucherEligibility(sysVoucher, subtotal, isNewUser);
      if (!chk.eligible) {
        message.warning(`${sysVoucher.code}: ${chk.reason}`);
        return;
      }
    }

    onApplyVouchers({
      restaurantVoucher: shopVoucher,
      systemVoucher: sysVoucher,
    });
    if (!shopVoucher && !sysVoucher) {
      message.info('Đã bỏ chọn tất cả mã giảm giá');
    } else {
      const codes = [shopVoucher?.code, sysVoucher?.code].filter(Boolean).join(' + ');
      message.success(`Đã áp dụng voucher: ${codes}`);
    }
    onClose();
  };

  const renderVoucherGroup = (
    title: string,
    subtitle: string,
    list: VoucherItem[],
    selectedId: number | null,
    onSelect: (id: number | null) => void,
    isSystemGroup: boolean
  ) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-bold text-xs uppercase tracking-wide text-slate-700">{title}</span>
          <span className="ml-2 text-[11px] text-slate-400">({subtitle})</span>
        </div>
        {selectedId !== null && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-[11px] font-semibold text-orange-600 hover:underline cursor-pointer"
          >
            Bỏ chọn
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400 text-center">
          Không có mã nào trong nhóm này
        </div>
      ) : (
        list.map((voucher) => {
          const eligibility = checkVoucherEligibility(voucher, subtotal, isNewUser);
          const discount = calculateVoucherDiscount(voucher, subtotal, shippingFee, isNewUser);
          const isSelected = selectedId === voucher.id;
          const minVal = voucher.minOrderValue || 0;
          const catCode = (voucher.voucherCategory || 'DISCOUNT_FOOD').toUpperCase();

          return (
            <div
              key={voucher.id}
              className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                !eligibility.eligible
                  ? 'border-slate-200 bg-slate-50/60 opacity-65 cursor-not-allowed'
                  : isSelected
                  ? 'border-orange-500 bg-orange-50/40 shadow-xs cursor-pointer'
                  : 'border-slate-200 hover:border-orange-300 bg-white cursor-pointer'
              }`}
              onClick={() => {
                if (eligibility.eligible) {
                  onSelect(isSelected ? null : voucher.id);
                }
              }}
            >
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-1.5">
                  <span
                    className={`font-extrabold text-xs px-2 py-0.5 rounded border ${
                      isSystemGroup
                        ? 'text-blue-700 bg-blue-50 border-blue-200'
                        : 'text-orange-600 bg-orange-100/70 border-orange-300'
                    }`}
                  >
                    {voucher.code}
                  </span>
                  <Tag
                    color={catCode === 'FREESHIP' ? 'cyan' : catCode === 'NEW_USER' ? 'gold' : 'volcano'}
                    className="m-0 text-[10px] font-semibold"
                  >
                    {getVoucherCategoryLabel(catCode)}
                  </Tag>
                  <Tag color={voucher.discountType === 'PERCENTAGE' ? 'red' : 'green'} className="m-0 text-[10px]">
                    {voucher.discountType === 'PERCENTAGE'
                      ? `Giảm ${voucher.discountValue}%`
                      : `Giảm ${formatCurrency(voucher.discountValue)}`}
                  </Tag>
                </div>

                <div className="text-xs text-slate-600 font-medium">
                  {catCode === 'FREESHIP'
                    ? `Hỗ trợ phí giao hàng tối đa ${formatCurrency(voucher.discountValue)}`
                    : voucher.discountType === 'PERCENTAGE'
                    ? `Giảm ${voucher.discountValue}%${
                        voucher.maxDiscountAmount ? ` (Tối đa ${formatCurrency(voucher.maxDiscountAmount)})` : ''
                      }`
                    : `Giảm trực tiếp ${formatCurrency(voucher.discountValue)} vào đơn hàng`}
                </div>

                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                  <span>
                    Đơn tối thiểu: <strong>{formatCurrency(minVal)}</strong>
                  </span>
                  {voucher.expiryDate && (
                    <span>• HSD: {new Date(voucher.expiryDate).toLocaleDateString('vi-VN')}</span>
                  )}
                </div>

                {!eligibility.eligible && eligibility.reason && (
                  <span className="text-[11px] text-red-500 font-medium">{eligibility.reason}</span>
                )}
              </div>

              <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                <Radio
                  checked={isSelected}
                  disabled={!eligibility.eligible}
                  onChange={() => eligibility.eligible && onSelect(isSelected ? null : voucher.id)}
                />
                {eligibility.eligible && discount > 0 && (
                  <span className="text-xs font-bold text-emerald-600">-{formatCurrency(discount)}</span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <span className="material-symbols-outlined text-orange-500 text-xl">confirmation_number</span>
          <span className="font-bold text-base">Chọn Voucher Quán &amp; Hệ Thống</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Đóng
        </Button>,
        <Button
          key="apply"
          type="primary"
          style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}
          onClick={handleApply}
        >
          Áp dụng
        </Button>,
      ]}
      width={540}
      centered
      destroyOnClose
    >
      <div className="py-2 flex flex-col gap-3 max-h-[520px] overflow-y-auto pr-1">
        <div className="text-xs text-slate-600 bg-orange-50 p-2.5 rounded-lg border border-orange-200">
          Bạn có thể dùng đồng thời tối đa <strong>1 Voucher Quán ăn</strong> và <strong>1 Voucher Toàn Hệ Thống</strong> (như Freeship / Khách mới / Flash Sale).
        </div>

        {/* Manual Code Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Nhập mã voucher (VD: FREESHIP, FLASHFOOD20...)"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onPressEnter={handleValidateManualCode}
            className="uppercase font-mono text-xs"
          />
          <Button
            type="default"
            loading={validatingCode}
            onClick={handleValidateManualCode}
            className="font-semibold border-orange-400 text-orange-600 hover:bg-orange-50"
          >
            Kiểm tra
          </Button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Spin size="large" />
            <span className="text-xs text-slate-400">Đang tải voucher khả dụng...</span>
          </div>
        ) : vouchers.length === 0 ? (
          <Empty description="Hiện chưa có mã giảm giá nào khả dụng" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className="flex flex-col gap-3">
            {renderVoucherGroup(
              '1. Voucher Toàn Hệ Thống',
              'Áp dụng toàn sàn — Chọn tối đa 1 mã',
              systemVouchers,
              selectedSystemVoucherId,
              setSelectedSystemVoucherId,
              true
            )}
            <Divider className="my-1" />
            {renderVoucherGroup(
              '2. Voucher Riêng Của Quán',
              'Chọn tối đa 1 mã',
              shopVouchers,
              selectedShopVoucherId,
              setSelectedShopVoucherId,
              false
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default VoucherSelectorModal;
