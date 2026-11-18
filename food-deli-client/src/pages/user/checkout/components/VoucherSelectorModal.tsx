import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Radio, Tag, Empty, Spin, Button, Input, message } from 'antd';
import { formatCurrency } from '@/utils/formatters';
import {
  restaurantApi,
  type VoucherCategoryItem,
  type VoucherItem,
} from '@/services/modules/restaurantApi';
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
  appliedVouchers: VoucherItem[];
  isNewUser?: boolean;
  onApplyVouchers: (selectedVouchers: VoucherItem[]) => void;
}

const DEFAULT_CATEGORY_ORDER: Record<string, number> = {
  DISCOUNT_FOOD: 1,
  FREESHIP: 2,
  NEW_USER: 3,
};

const normalizeCategory = (category?: string): string =>
  (category || 'DISCOUNT_FOOD').trim().toUpperCase();

const buildInitialSelection = (appliedVouchers: VoucherItem[]): Record<string, number> => {
  const initialSelection: Record<string, number> = {};
  for (const v of appliedVouchers) {
    initialSelection[normalizeCategory(v.voucherCategory)] = v.id;
  }
  return initialSelection;
};

type VoucherSelectorBodyProps = Omit<VoucherSelectorModalProps, 'isOpen'>;

const VoucherSelectorBody: React.FC<VoucherSelectorBodyProps> = ({
  onClose,
  restaurantId,
  subtotal,
  shippingFee,
  appliedVouchers,
  isNewUser: initialIsNewUser = true,
  onApplyVouchers,
}) => {
  const [vouchers, setVouchers] = useState<VoucherItem[]>(appliedVouchers);
  const [categoryMetaMap, setCategoryMetaMap] = useState<Record<string, VoucherCategoryItem>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [isNewUser, setIsNewUser] = useState<boolean>(initialIsNewUser);
  // Key = normalized voucher_category, Value = selected voucher ID (strictly max 1 per category)
  const [selectedByCategory, setSelectedByCategory] = useState<Record<string, number>>(() =>
    buildInitialSelection(appliedVouchers)
  );
  const [manualCode, setManualCode] = useState<string>('');
  const [validatingCode, setValidatingCode] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    Promise.all([
      restaurantApi.getVouchers({ restaurantId, activeOnly: true }),
      restaurantApi.getVoucherCategories(true).catch(() => null),
      orderApi.getVoucherEligibility().catch(() => null),
    ])
      .then(([vouchersRes, categoriesRes, eligibilityRes]) => {
        if (!active) return;
        const fetched = Array.isArray(vouchersRes?.data)
          ? vouchersRes.data.filter((v) => v.isActive !== false)
          : [];
        const fetchedIds = new Set(fetched.map((v) => v.id));
        const merged = [
          ...fetched,
          ...appliedVouchers.filter((av) => !fetchedIds.has(av.id)),
        ];
        setVouchers(merged);

        if (Array.isArray(categoriesRes?.data)) {
          const catMap: Record<string, VoucherCategoryItem> = {};
          for (const cat of categoriesRes.data) {
            if (cat.code) {
              catMap[normalizeCategory(cat.code)] = cat;
            }
          }
          setCategoryMetaMap(catMap);
        }

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
  }, [restaurantId, appliedVouchers]);

  const categoryGroups = useMemo(() => {
    const grouped: Record<string, VoucherItem[]> = {};
    for (const voucher of vouchers) {
      const cat = normalizeCategory(voucher.voucherCategory);
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(voucher);
    }

    return Object.entries(grouped).sort(([catA], [catB]) => {
      const orderA = DEFAULT_CATEGORY_ORDER[catA] ?? (categoryMetaMap[catA]?.id ? 10 + categoryMetaMap[catA].id : 99);
      const orderB = DEFAULT_CATEGORY_ORDER[catB] ?? (categoryMetaMap[catB]?.id ? 10 + categoryMetaMap[catB].id : 99);
      if (orderA !== orderB) return orderA - orderB;
      return catA.localeCompare(catB);
    });
  }, [vouchers, categoryMetaMap]);

  const handleToggleSelectInCategory = (category: string, voucherId: number) => {
    setSelectedByCategory((prev) => {
      if (prev[category] === voucherId) {
        const next = { ...prev };
        delete next[category];
        return next;
      }
      return { ...prev, [category]: voucherId };
    });
  };

  const handleClearCategory = (category: string) => {
    setSelectedByCategory((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  };

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
      const validVoucherId = result.voucherId;

      let targetVoucher = vouchers.find((v) => v.id === validVoucherId);
      if (!targetVoucher) {
        try {
          const detailRes = await restaurantApi.getVoucherById(validVoucherId);
          if (detailRes?.data) {
            targetVoucher = detailRes.data;
            setVouchers((prev) => [detailRes.data, ...prev.filter((p) => p.id !== detailRes.data.id)]);
          }
        } catch {
          targetVoucher = {
            id: validVoucherId,
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

      const catCode = normalizeCategory(targetVoucher?.voucherCategory || result.voucherCategory);
      const catLabel = categoryMetaMap[catCode]?.name || getVoucherCategoryLabel(catCode);
      const replacedPrevious =
        selectedByCategory[catCode] !== undefined && selectedByCategory[catCode] !== validVoucherId;

      setSelectedByCategory((prev) => ({
        ...prev,
        [catCode]: validVoucherId,
      }));
      setManualCode('');

      if (replacedPrevious) {
        message.success(`Đã chọn ${result.code} (thay thế mã cùng loại "${catLabel}")`);
      } else {
        message.success(`Đã chọn ${result.code} (${catLabel})`);
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể kiểm tra mã voucher');
    } finally {
      setValidatingCode(false);
    }
  };

  const selectedVoucherList = useMemo(() => {
    const selectedIds = new Set(Object.values(selectedByCategory));
    return vouchers.filter((v) => selectedIds.has(v.id));
  }, [vouchers, selectedByCategory]);

  const handleApply = () => {
    for (const v of selectedVoucherList) {
      const chk = checkVoucherEligibility(v, subtotal, isNewUser);
      if (!chk.eligible) {
        message.warning(`${v.code}: ${chk.reason}`);
        return;
      }
    }

    onApplyVouchers(selectedVoucherList);
    if (selectedVoucherList.length === 0) {
      message.info('Đã bỏ chọn tất cả mã giảm giá');
    } else {
      const codes = selectedVoucherList.map((v) => v.code).join(' + ');
      message.success(`Đã áp dụng voucher: ${codes}`);
    }
    onClose();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="py-2 flex flex-col gap-3 max-h-[520px] overflow-y-auto pr-1">
        <div className="text-xs text-slate-600 bg-orange-50 p-2.5 rounded-lg border border-orange-200 leading-relaxed">
          Mỗi <strong>loại voucher</strong> (Giảm món, Freeship, Khách mới...) chỉ được áp dụng{' '}
          <strong>tối đa 1 mã</strong> cho mỗi đơn hàng. Bạn có thể kết hợp đồng thời nhiều voucher
          thuộc <strong>các loại khác nhau</strong>.
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
        ) : categoryGroups.length === 0 ? (
          <Empty description="Hiện chưa có mã giảm giá nào khả dụng" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className="flex flex-col gap-4">
            {categoryGroups.map(([catCode, list]) => {
              const selectedId = selectedByCategory[catCode];
              const categoryTitle = categoryMetaMap[catCode]?.name || getVoucherCategoryLabel(catCode);
              const catTagColor =
                catCode === 'FREESHIP' ? 'cyan' : catCode === 'NEW_USER' ? 'gold' : 'volcano';

              return (
                <div
                  key={catCode}
                  className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/40 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center flex-wrap gap-2">
                      <Tag color={catTagColor} className="m-0 font-bold text-xs">
                        {categoryTitle}
                      </Tag>
                      <span className="text-[11px] text-slate-500">Chọn tối đa 1 mã</span>
                    </div>
                    {selectedId !== undefined && (
                      <button
                        type="button"
                        onClick={() => handleClearCategory(catCode)}
                        className="text-[11px] font-semibold text-orange-600 hover:underline cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {list.map((voucher) => {
                      const eligibility = checkVoucherEligibility(voucher, subtotal, isNewUser);
                      const discount = calculateVoucherDiscount(voucher, subtotal, shippingFee, isNewUser);
                      const isSelected = selectedId === voucher.id;
                      const minVal = voucher.minOrderValue || 0;
                      const isSystem = isSystemScopeVoucher(voucher);

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
                              handleToggleSelectInCategory(catCode, voucher.id);
                            }
                          }}
                        >
                          <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <div className="flex items-center flex-wrap gap-1.5">
                              <span
                                className={`font-extrabold text-xs px-2 py-0.5 rounded border ${
                                  isSystem
                                    ? 'text-blue-700 bg-blue-50 border-blue-200'
                                    : 'text-orange-600 bg-orange-100/70 border-orange-300'
                                }`}
                              >
                                {voucher.code}
                              </span>
                              <Tag color={isSystem ? 'blue' : 'orange'} className="m-0 text-[10px] font-bold">
                                {isSystem ? 'Toàn sàn' : 'Quán ăn'}
                              </Tag>
                              <Tag
                                color={voucher.discountType === 'PERCENTAGE' ? 'red' : 'green'}
                                className="m-0 text-[10px]"
                              >
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
                                    voucher.maxDiscountAmount
                                      ? ` (Tối đa ${formatCurrency(voucher.maxDiscountAmount)})`
                                      : ''
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
                              onChange={() =>
                                eligibility.eligible && handleToggleSelectInCategory(catCode, voucher.id)
                              }
                            />
                            {eligibility.eligible && discount > 0 && (
                              <span className="text-xs font-bold text-emerald-600">
                                -{formatCurrency(discount)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        <Button onClick={onClose}>Đóng</Button>
        <Button
          type="primary"
          style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}
          onClick={handleApply}
        >
          {selectedVoucherList.length > 0
            ? `Áp dụng (${selectedVoucherList.length} mã)`
            : 'Áp dụng'}
        </Button>
      </div>
    </div>
  );
};

export const VoucherSelectorModal: React.FC<VoucherSelectorModalProps> = ({
  isOpen,
  onClose,
  ...bodyProps
}) => {
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
      footer={null}
      width={560}
      centered
      destroyOnClose
    >
      {isOpen && <VoucherSelectorBody {...bodyProps} onClose={onClose} />}
    </Modal>
  );
};

export default VoucherSelectorModal;
