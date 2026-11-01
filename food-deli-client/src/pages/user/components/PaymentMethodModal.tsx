import React, { useState } from 'react';

export interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMethodId: string;
  onSelectMethod: (methodId: string, methodName: string, discount: number) => void;
  totalAmount?: number;
  discountAmount?: number;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  selectedMethodId: initialMethodId = 'vietqr',
  onSelectMethod,
  totalAmount = 154000,
  discountAmount = 40000,
}) => {
  const [activeMethod, setActiveMethod] = useState<string>(initialMethodId);
  const [needChange, setNeedChange] = useState<boolean>(false);
  const [appliedPromo, setAppliedPromo] = useState<boolean>(true);

  if (!isOpen) return null;

  const getMethodName = (id: string) => {
    switch (id) {
      case 'vietqr':
        return 'Chuyển khoản VietQR';
      case 'cod':
        return 'Tiền mặt khi nhận (COD)';
      case 'momo':
        return 'Ví điện tử MoMo';
      case 'zalopay':
        return 'Ví ZaloPay';
      case 'visa':
        return 'Visa Debit •••• 9821';
      default:
        return 'Chuyển khoản VietQR';
    }
  };

  const getExtraDiscount = (id: string) => {
    if (appliedPromo && (id === 'vietqr' || id === 'momo')) {
      return 10000;
    }
    return 0;
  };

  const finalTotal = Math.max(0, totalAmount - getExtraDiscount(activeMethod));

  const handleConfirm = () => {
    onSelectMethod(activeMethod, getMethodName(activeMethod), getExtraDiscount(activeMethod));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-inverse-surface/60 backdrop-blur-sm transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
    >
      {/* Click outside to close */}
      <div className="flex-1 w-full" onClick={onClose} />

      {/* Main Drawer Container */}
      <div className="w-full max-w-xl mx-auto bg-surface font-body-md text-on-surface rounded-t-[28px] max-h-[92vh] flex flex-col shadow-2xl relative transition-all duration-300 overflow-hidden">
        {/* Top App Bar Header */}
        <header className="sticky top-0 w-full z-10 bg-surface/90 backdrop-blur-xl border-b border-surface-container-high/40 px-gutter py-3 flex items-center justify-between">
          <div className="flex items-center gap-space-xs min-w-0">
            <button
              aria-label="Back"
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors flex-shrink-0 cursor-pointer"
              onClick={onClose}
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col min-w-0 ml-1">
              <h2 className="font-headline-sm text-headline-sm text-on-surface truncate leading-tight">
                Phương thức thanh toán
              </h2>
              <div className="flex items-center gap-1 text-on-surface-variant text-[12px] truncate">
                <span className="material-symbols-outlined text-[13px] text-primary">verified_user</span>
                <span>Bảo mật an toàn 100%</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-gutter py-space-md flex flex-col gap-space-lg pb-36">
          {/* Top Summary Pill */}
          <section className="bg-surface-container-lowest shadow-sm rounded-xl p-space-lg flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1">
                Tổng thanh toán
                <span className="material-symbols-outlined text-[16px] text-tertiary">lock</span>
              </span>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-display-lg text-display-lg text-primary tracking-tight">
                  {finalTotal.toLocaleString('vi-VN')}đ
                </span>
                {discountAmount > 0 && (
                  <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded-full">
                    Tiết kiệm {discountAmount.toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[28px]">receipt_long</span>
            </div>
          </section>

          {/* Special Offer Highlight Banner */}
          <section className="bg-secondary-container/10 rounded-xl p-space-md flex items-center gap-space-md shadow-sm">
            <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center flex-shrink-0 text-secondary">
              <span className="material-symbols-outlined text-[22px]">local_offer</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-label-lg text-label-lg text-on-surface font-semibold truncate">
                Ưu đãi giảm thêm 10.000đ
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
                Áp dụng ngay khi chọn VietQR hoặc MoMo
              </p>
            </div>
            <button
              type="button"
              className={`font-label-md text-label-md px-3 py-1.5 rounded-full shadow-sm cursor-pointer transition-all ${
                appliedPromo
                  ? 'bg-secondary text-white font-bold'
                  : 'bg-surface-container-lowest text-secondary'
              }`}
              onClick={() => setAppliedPromo(!appliedPromo)}
            >
              {appliedPromo ? 'Đã áp dụng' : 'Áp dụng'}
            </button>
          </section>

          {/* Nhóm 1: Chuyển khoản VietQR & Ngân hàng */}
          <section className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Chuyển khoản &amp; Quét mã QR
              </h3>
              <span className="font-label-sm text-label-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                Xác nhận tức thì
              </span>
            </div>

            <label
              className="group relative cursor-pointer block select-none"
              onClick={() => setActiveMethod('vietqr')}
            >
              <div
                className={`p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md transition-all border ${
                  activeMethod === 'vietqr' ? 'border-primary ring-1 ring-primary' : 'border-transparent'
                }`}
              >
                <div className="flex items-start gap-space-md">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center flex-shrink-0 text-primary">
                    <span className="material-symbols-outlined text-[28px]">qr_code_scanner</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">
                        VietQR Napas 247
                      </span>
                      <span className="bg-primary text-on-primary font-label-sm text-label-sm px-1.5 py-0.5 rounded">
                        Tự động
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Quét mã QR tự động xác nhận đơn ngay lập tức, miễn phí giao dịch 100%.
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      activeMethod === 'vietqr' ? 'bg-primary' : 'bg-surface-container'
                    }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        activeMethod === 'vietqr' ? 'bg-on-primary' : 'bg-transparent'
                      }`}
                    />
                  </div>
                </div>

                <div className="bg-surface-container-low/70 rounded-lg p-space-sm flex items-center justify-between text-on-surface-variant">
                  <div className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    <span className="font-label-sm text-label-sm font-semibold">
                      Tự động đối soát trong 3 giây
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">
                    -10.000đ từ FoodPay
                  </span>
                </div>
              </div>
            </label>
          </section>

          {/* Nhóm 2: Tiền mặt khi nhận hàng (COD) */}
          <section className="flex flex-col gap-space-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Tiền mặt khi nhận hàng (COD)
            </h3>
            <label
              className="group relative cursor-pointer block select-none"
              onClick={() => setActiveMethod('cod')}
            >
              <div
                className={`p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md transition-all border ${
                  activeMethod === 'cod' ? 'border-primary ring-1 ring-primary' : 'border-transparent'
                }`}
              >
                <div className="flex items-start gap-space-md">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center flex-shrink-0 text-primary-container">
                    <span className="material-symbols-outlined text-[28px]">payments</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-label-lg text-label-lg text-on-surface font-bold">
                      Tiền mặt khi nhận hàng (COD)
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Thanh toán trực tiếp bằng tiền mặt cho tài xế khi nhận món nóng hổi.
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      activeMethod === 'cod' ? 'bg-primary' : 'bg-surface-container'
                    }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        activeMethod === 'cod' ? 'bg-on-primary' : 'bg-transparent'
                      }`}
                    />
                  </div>
                </div>

                {/* Sub Option: Change Preparation Toggle */}
                <div
                  className="bg-surface-container-low rounded-lg p-space-md flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-space-sm min-w-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      currency_exchange
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-medium">
                        Cần chuẩn bị tiền thối?
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">
                        Shipper sẽ mang sẵn tiền lẻ thối lại
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={needChange}
                    onChange={(e) => setNeedChange(e.target.checked)}
                    className="w-5 h-5 accent-primary cursor-pointer rounded"
                  />
                </div>
              </div>
            </label>
          </section>

          {/* Nhóm 3: Ví điện tử liên kết */}
          <section className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Ví điện tử</h3>
              <span className="font-label-sm text-label-sm text-primary font-bold">Khuyên dùng</span>
            </div>

            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
              {/* MoMo Card */}
              <label
                className={`p-space-lg cursor-pointer flex items-center justify-between hover:bg-surface-container-low/40 transition-colors border-b border-surface-container ${
                  activeMethod === 'momo' ? 'bg-surface-container-low/30' : ''
                }`}
                onClick={() => setActiveMethod('momo')}
              >
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0 text-[#A50064] font-bold text-xl">
                    M
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">
                        Ví MoMo
                      </span>
                      <span className="bg-secondary-container/15 text-secondary font-label-sm text-label-sm px-1.5 py-0.5 rounded">
                        Hoàn xu 5%
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Số dư: 520.000đ • Liên kết nhanh
                    </span>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    activeMethod === 'momo' ? 'bg-primary' : 'bg-surface-container'
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      activeMethod === 'momo' ? 'bg-on-primary' : 'bg-transparent'
                    }`}
                  />
                </div>
              </label>

              {/* ZaloPay Card */}
              <label
                className={`p-space-lg cursor-pointer flex items-center justify-between hover:bg-surface-container-low/40 transition-colors ${
                  activeMethod === 'zalopay' ? 'bg-surface-container-low/30' : ''
                }`}
                onClick={() => setActiveMethod('zalopay')}
              >
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-blue-600 text-[26px]">
                      wallet
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">
                        ZaloPay
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Số dư: 89.000đ • Cần nạp thêm
                    </span>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    activeMethod === 'zalopay' ? 'bg-primary' : 'bg-surface-container'
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      activeMethod === 'zalopay' ? 'bg-on-primary' : 'bg-transparent'
                    }`}
                  />
                </div>
              </label>
            </div>
          </section>

          {/* Nhóm 4: Thẻ thanh toán */}
          <section className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Thẻ thanh toán</h3>
              <button
                type="button"
                className="font-label-md text-label-md text-primary flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Thêm thẻ mới
              </button>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
              <label
                className="cursor-pointer flex items-center justify-between"
                onClick={() => setActiveMethod('visa')}
              >
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center flex-shrink-0 text-on-surface">
                    <span className="material-symbols-outlined text-[26px]">credit_card</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-lg text-label-lg text-on-surface font-bold">
                      Visa Debit •••• 9821
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Hết hạn: 11/27 • Vietcombank
                    </span>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    activeMethod === 'visa' ? 'bg-primary' : 'bg-surface-container'
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      activeMethod === 'visa' ? 'bg-on-primary' : 'bg-transparent'
                    }`}
                  />
                </div>
              </label>
            </div>
          </section>

          {/* Safety & Security Footnote */}
          <section className="flex items-center justify-center gap-1.5 text-on-surface-variant/80 pb-2">
            <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
            <span className="font-label-sm text-label-sm">
              Bảo mật chuẩn quốc tế PCI-DSS &amp; Mã hóa TLS 256-bit
            </span>
          </section>
        </div>

        {/* Persistent Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-surface/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-gutter py-space-md flex flex-col gap-2 pb-safe border-t border-surface-container">
          <div className="flex items-center justify-between">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Phương thức đã chọn:
            </span>
            <span className="font-label-md text-label-md text-primary font-bold truncate max-w-[200px]">
              {getMethodName(activeMethod)}
            </span>
          </div>

          <button
            type="button"
            className="w-full h-12 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg flex items-center justify-between px-space-lg shadow-sm transition-all active:scale-[0.99] cursor-pointer"
            onClick={handleConfirm}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>Xác nhận phương thức</span>
            </div>
            <span className="font-headline-sm text-headline-sm font-bold tracking-tight">
              {finalTotal.toLocaleString('vi-VN')}đ
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodModal;
