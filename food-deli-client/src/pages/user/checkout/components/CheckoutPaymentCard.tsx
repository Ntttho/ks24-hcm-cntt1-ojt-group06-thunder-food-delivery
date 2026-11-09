import React from 'react';

interface CheckoutPaymentCardProps {
  paymentMethod: {
    id: string;
    name: string;
    extraDiscount?: number;
  };
  onOpenPaymentModal: () => void;
  onSelectMethodQuick?: (id: string, name: string) => void;
}

export const CheckoutPaymentCard: React.FC<CheckoutPaymentCardProps> = ({
  paymentMethod,
  onOpenPaymentModal,
  onSelectMethodQuick,
}) => {
  const isVietQr = paymentMethod.id === 'vietqr';
  const isCod = paymentMethod.id === 'cod';

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-500 text-[20px]">
            account_balance_wallet
          </span>
          <span className="text-sm font-extrabold text-gray-900">
            Phương thức thanh toán
          </span>
        </div>
        <button
          type="button"
          aria-label="Thay đổi phương thức thanh toán"
          className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 cursor-pointer"
          onClick={onOpenPaymentModal}
        >
          <span>Thay đổi</span>
          <span className="material-symbols-outlined text-[15px]">chevron_right</span>
        </button>
      </div>

      {/* Active Selected Method Card */}
      <div
        className="p-3.5 bg-orange-50/60 rounded-xl flex items-center justify-between gap-3 border border-orange-200/80 cursor-pointer hover:bg-orange-50 transition-colors"
        onClick={onOpenPaymentModal}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isVietQr ? (
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[22px]">payments</span>
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-extrabold text-gray-900">
                {paymentMethod.name}
              </span>
              {isVietQr && (
                <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded">
                  Khuyên dùng • Miễn phí
                </span>
              )}
            </div>
            <span className="text-gray-500 text-[11px] mt-0.5">
              {isVietQr
                ? 'Tự động duyệt tức thì qua SePay & Napas 247'
                : 'Thanh toán tiền mặt cho tài xế khi giao tận tay'}
            </span>
          </div>
        </div>

        <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white flex-shrink-0">
          <span className="material-symbols-outlined text-[15px]">check</span>
        </div>
      </div>

      {/* Quick Switch Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() =>
            onSelectMethodQuick?.(
              'vietqr',
              'Chuyển khoản VietQR (Napas 247)'
            )
          }
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isVietQr
              ? 'bg-orange-500 text-white shadow-xs'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
          <span>VietQR SePay</span>
        </button>

        <button
          type="button"
          onClick={() =>
            onSelectMethodQuick?.(
              'cod',
              'Tiền mặt khi nhận (COD)'
            )
          }
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isCod
              ? 'bg-orange-500 text-white shadow-xs'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">payments</span>
          <span>Tiền mặt (COD)</span>
        </button>
      </div>
    </div>
  );
};

export default CheckoutPaymentCard;
