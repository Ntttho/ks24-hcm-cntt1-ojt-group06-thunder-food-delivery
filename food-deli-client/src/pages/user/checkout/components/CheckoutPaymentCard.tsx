import React from 'react';

interface CheckoutPaymentCardProps {
  paymentMethod: {
    id: string;
    name: string;
    extraDiscount?: number;
  };
  onOpenPaymentModal: () => void;
}

export const CheckoutPaymentCard: React.FC<CheckoutPaymentCardProps> = ({
  paymentMethod,
  onOpenPaymentModal,
}) => {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface text-[20px]">
            account_balance_wallet
          </span>
          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            Phương thức thanh toán
          </span>
        </div>
        <button
          type="button"
          aria-label="Thay đổi phương thức thanh toán"
          className="font-label-md text-label-md text-primary font-bold flex items-center gap-0.5 active:scale-95 transition-transform cursor-pointer"
          onClick={onOpenPaymentModal}
        >
          Thay đổi
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
      </div>

      {/* Active Selected Method */}
      <div
        className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-container transition-colors"
        onClick={onOpenPaymentModal}
      >
        <div className="flex items-center gap-3 min-w-0">
          {paymentMethod.id === 'momo' ? (
            <div className="w-10 h-10 rounded-xl bg-[#A50064] text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm">
              M
            </div>
          ) : paymentMethod.id === 'vietqr' ? (
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary-container text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-label-lg text-label-lg text-on-surface font-bold">
                {paymentMethod.name}
              </span>
              <span className="bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm px-1.5 py-0.2 rounded font-semibold">
                Khuyên dùng
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
              <span>Số dư khả dụng:</span>
              <span className="font-bold text-on-surface">450.000đ</span>
              <span className="text-primary text-[12px] font-semibold">(Đủ số dư)</span>
            </div>
          </div>
        </div>
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary flex-shrink-0">
          <span className="material-symbols-outlined text-[16px]">check</span>
        </div>
      </div>

      {/* Other Quick Payment Thumbnails */}
      <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high/60 text-on-surface font-label-sm text-label-sm flex-shrink-0 opacity-70 cursor-pointer hover:opacity-100"
          onClick={onOpenPaymentModal}
        >
          <span className="material-symbols-outlined text-[16px]">payments</span>
          Tiền mặt khi nhận
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high/60 text-on-surface font-label-sm text-label-sm flex-shrink-0 opacity-70 cursor-pointer hover:opacity-100"
          onClick={onOpenPaymentModal}
        >
          <span className="material-symbols-outlined text-[16px]">credit_card</span>
          Visa •••• 9821
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high/60 text-on-surface font-label-sm text-label-sm flex-shrink-0 opacity-70 cursor-pointer hover:opacity-100"
          onClick={onOpenPaymentModal}
        >
          <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
          VietQR Napas
        </div>
      </div>
    </div>
  );
};

export default CheckoutPaymentCard;

