import React, { useState, useEffect } from 'react';
import { Modal, Radio, Tag, Empty, Spin, Button, message } from 'antd';
import { formatCurrency } from '@/utils/formatters';
import { restaurantApi, type VoucherItem } from '@/services/modules/restaurantApi';

interface VoucherSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: number;
  subtotal: number;
  appliedVoucher: VoucherItem | null;
  onSelectVoucher: (voucher: VoucherItem | null) => void;
}

export const VoucherSelectorModal: React.FC<VoucherSelectorModalProps> = ({
  isOpen,
  onClose,
  restaurantId,
  subtotal,
  appliedVoucher,
  onSelectVoucher,
}) => {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tempSelectedId, setTempSelectedId] = useState<number | null>(appliedVoucher?.id || null);

  useEffect(() => {
    if (isOpen) {
      setTempSelectedId(appliedVoucher?.id || null);
      loadVouchers();
    }
  }, [isOpen, restaurantId, appliedVoucher]);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const res = await restaurantApi.getVouchers(restaurantId);
      const list = Array.isArray(res.data) ? res.data : [];
      setVouchers(list.filter((v) => v.isActive !== false));
    } catch {
      message.error('Không thể tải danh sách mã giảm giá của quán');
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = (voucher: VoucherItem): number => {
    const minVal = voucher.minOrderValue || 0;
    if (subtotal < minVal) return 0;

    if (voucher.discountType === 'PERCENTAGE') {
      const calculated = (subtotal * voucher.discountValue) / 100;
      if (voucher.maxDiscountAmount && voucher.maxDiscountAmount > 0) {
        return Math.min(calculated, voucher.maxDiscountAmount);
      }
      return calculated;
    }
    return voucher.discountValue || voucher.discountAmount || 0;
  };

  const handleApply = () => {
    if (tempSelectedId === null) {
      onSelectVoucher(null);
      message.info('Đã hủy áp dụng mã giảm giá');
      onClose();
      return;
    }

    const selected = vouchers.find((v) => v.id === tempSelectedId);
    if (selected) {
      const minVal = selected.minOrderValue || 0;
      if (subtotal < minVal) {
        message.warning(`Đơn hàng tối thiểu ${formatCurrency(minVal)} để áp dụng mã này!`);
        return;
      }
      onSelectVoucher(selected);
      message.success(`Đã áp dụng mã giảm giá: ${selected.code}`);
    }
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <span className="material-symbols-outlined text-orange-500 text-xl">confirmation_number</span>
          <span className="font-bold text-base">Chọn 1 Mã Giảm Giá Quán Ăn</span>
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
      width={460}
      centered
      destroyOnClose
    >
      <div className="py-2 flex flex-col gap-3 max-h-[420px] overflow-y-auto">
        <div className="text-xs text-slate-500 bg-orange-50 p-2.5 rounded-lg border border-orange-200">
          💡 <strong>Quy định:</strong> Mỗi đơn hàng chỉ áp dụng duy nhất 1 mã giảm giá từ quán ăn.
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Spin size="large" />
            <span className="text-xs text-slate-400">Đang tìm mã ưu đãi của quán...</span>
          </div>
        ) : vouchers.length === 0 ? (
          <Empty
            description="Hiện quán chưa có mã giảm giá nào đang diễn ra"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {/* Option to clear voucher */}
            <div
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                tempSelectedId === null
                  ? 'border-orange-500 bg-orange-50/50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setTempSelectedId(null)}
            >
              <span className="text-xs font-semibold text-slate-700">Không sử dụng mã giảm giá</span>
              <Radio checked={tempSelectedId === null} />
            </div>

            {/* List of Vouchers */}
            {vouchers.map((voucher) => {
              const discount = calculateDiscount(voucher);
              const minVal = voucher.minOrderValue || 0;
              const isEligible = subtotal >= minVal;
              const isSelected = tempSelectedId === voucher.id;

              return (
                <div
                  key={voucher.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    !isEligible
                      ? 'border-slate-200 bg-slate-50/60 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'border-orange-500 bg-orange-50/40 shadow-sm cursor-pointer'
                      : 'border-slate-200 hover:border-orange-300 bg-white cursor-pointer'
                  }`}
                  onClick={() => {
                    if (isEligible) {
                      setTempSelectedId(voucher.id);
                    }
                  }}
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded border border-orange-300">
                        {voucher.code}
                      </span>
                      {voucher.discountType === 'PERCENTAGE' ? (
                        <Tag color="red">Giảm {voucher.discountValue}%</Tag>
                      ) : (
                        <Tag color="volcano">Giảm {formatCurrency(voucher.discountValue)}</Tag>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 font-medium">
                      {voucher.discountType === 'PERCENTAGE'
                        ? `Giảm ${voucher.discountValue}% ${
                            voucher.maxDiscountAmount
                              ? `(Tối đa ${formatCurrency(voucher.maxDiscountAmount)})`
                              : ''
                          }`
                        : `Giảm trực tiếp ${formatCurrency(voucher.discountValue)}`}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Đơn tối thiểu: <strong>{formatCurrency(minVal)}</strong></span>
                      {voucher.expiryDate && (
                        <span>• HSD: {new Date(voucher.expiryDate).toLocaleDateString('vi-VN')}</span>
                      )}
                    </div>

                    {!isEligible && (
                      <span className="text-[11px] text-red-500 font-medium mt-1">
                        ⚠️ Cần mua thêm {formatCurrency(minVal - subtotal)} để dùng mã này
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    <Radio
                      checked={isSelected}
                      disabled={!isEligible}
                      onChange={() => isEligible && setTempSelectedId(voucher.id)}
                    />
                    {isEligible && discount > 0 && (
                      <span className="text-xs font-bold text-emerald-600">
                        -{formatCurrency(discount)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default VoucherSelectorModal;

