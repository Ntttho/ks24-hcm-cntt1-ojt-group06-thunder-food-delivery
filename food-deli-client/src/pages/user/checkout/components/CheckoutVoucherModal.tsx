import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Tag, message, Spin, Empty } from 'antd';
import {
  GiftOutlined,
  CheckCircleOutlined,
  TagOutlined,
  PercentageOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import {
  restaurantApi,
  type VoucherItem,
  type VoucherValidationResult,
} from '@/services/modules/restaurantApi';
import { formatCurrency } from '@/utils/formatters';

interface CheckoutVoucherModalProps {
  open: boolean;
  onClose: () => void;
  onApplyVoucher: (result: VoucherValidationResult) => void;
  orderAmount: number;
  restaurantId?: number;
  appliedCode?: string;
}

export const CheckoutVoucherModal: React.FC<CheckoutVoucherModalProps> = ({
  open,
  onClose,
  onApplyVoucher,
  orderAmount,
  restaurantId = 1,
  appliedCode,
}) => {
  const [inputCode, setInputCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [availableVouchers, setAvailableVouchers] = useState<VoucherItem[]>([]);
  const [fetchingList, setFetchingList] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setInputCode(appliedCode || '');
      loadStoreVouchers();
    }
  }, [open, restaurantId, appliedCode]);

  const loadStoreVouchers = async () => {
    setFetchingList(true);
    try {
      const res = await restaurantApi.getVouchers(restaurantId);
      if (res && res.data) {
        setAvailableVouchers(res.data.filter((v) => v.isActive));
      }
    } catch {
      // Gracefully handle offline
    } finally {
      setFetchingList(false);
    }
  };

  const handleApplyCode = async (codeToApply?: string) => {
    const code = (codeToApply || inputCode).trim().toUpperCase();
    if (!code) {
      message.warning('Vui lòng nhập mã voucher!');
      return;
    }

    setLoading(true);
    try {
      const res = await restaurantApi.validateVoucher({
        code,
        restaurantId,
        orderAmount,
      });

      if (res && res.data && res.data.isValid) {
        message.success(
          `Áp dụng mã ${code} thành công! Giảm ${formatCurrency(res.data.discountAmount || 0)}`
        );
        onApplyVoucher(res.data);
        onClose();
      } else {
        message.error(res?.data?.message || 'Mã voucher không hợp lệ');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Mã voucher không hợp lệ hoặc đã hết hạn';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <GiftOutlined />
          </div>
          <div>
            <div className="font-bold text-base">Mã Khuyến Mãi / Voucher của Quán</div>
            <div className="text-xs text-slate-400 font-normal">
              Nhập mã hoặc chọn một trong các voucher đang có hiệu lực bên dưới
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
      width={500}
    >
      <div className="mt-4 space-y-4">
        {/* Input Code Box */}
        <div className="flex gap-2">
          <Input
            placeholder="Nhập mã voucher (VD: THUNDER20)..."
            size="large"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            onPressEnter={() => handleApplyCode()}
            className="rounded-xl uppercase font-mono font-bold tracking-wider"
            prefix={<TagOutlined className="text-slate-400 mr-1" />}
          />
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={() => handleApplyCode()}
            className="bg-orange-500 hover:bg-orange-600 font-bold rounded-xl text-white shadow-sm px-6"
          >
            Áp dụng
          </Button>
        </div>

        {/* List of active store vouchers */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Mã giảm giá đang có sẵn của quán
          </div>

          {fetchingList ? (
            <div className="py-8 text-center">
              <Spin />
            </div>
          ) : availableVouchers.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có mã voucher tự động nào, vui lòng nhập mã thủ công ở trên."
            />
          ) : (
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {availableVouchers.map((v) => {
                const isSelected = appliedCode === v.code;
                const minOrder = v.minOrderValue ?? 0;
                const isEligible = orderAmount >= minOrder;

                return (
                  <div
                    key={v.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/60 ring-1 ring-orange-400'
                        : isEligible
                        ? 'border-slate-200 hover:border-orange-300 bg-white hover:bg-orange-50/20'
                        : 'border-slate-100 bg-slate-50/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {v.discountType === 'PERCENTAGE' ? <PercentageOutlined /> : <DollarOutlined />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-xs tracking-wide font-mono">
                            {v.code}
                          </span>
                          <Tag
                            color={v.discountType === 'PERCENTAGE' ? 'red' : 'orange'}
                            className="text-[10px] font-bold px-1.5 py-0 rounded-md border-none"
                          >
                            {v.discountType === 'PERCENTAGE'
                              ? `Giảm ${v.discountValue}%`
                              : `Giảm ${formatCurrency(v.discountValue)}`}
                          </Tag>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {minOrder > 0
                            ? `Đơn tối thiểu ${formatCurrency(minOrder)}`
                            : 'Mọi giá trị đơn'}
                          {v.maxDiscountAmount ? ` • Tối đa ${formatCurrency(v.maxDiscountAmount)}` : ''}
                        </div>
                      </div>
                    </div>

                    <Button
                      type={isSelected ? 'default' : 'primary'}
                      size="small"
                      disabled={!isEligible}
                      onClick={() => handleApplyCode(v.code)}
                      className={
                        isSelected
                          ? 'border-orange-500 text-orange-600 font-bold rounded-lg'
                          : 'bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg'
                      }
                    >
                      {isSelected ? 'Đang dùng' : 'Dùng mã'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CheckoutVoucherModal;
