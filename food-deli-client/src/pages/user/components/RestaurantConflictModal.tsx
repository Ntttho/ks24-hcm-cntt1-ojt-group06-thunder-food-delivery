import React, { useState } from 'react';

export interface RestaurantConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReplace: () => void;
  currentShopName?: string;
  currentShopAddress?: string;
  currentDishSummary?: string;
  currentItemsCount?: number;
  currentTotal?: number;
  currentImageUrl?: string;
  newShopName?: string;
  newDishName?: string;
  newDishPrice?: number;
  newDishOptions?: string;
  newImageUrl?: string;
}

export const RestaurantConflictModal: React.FC<RestaurantConflictModalProps> = ({
  isOpen,
  onClose,
  onConfirmReplace,
  currentShopName = 'Cơm Tấm Sà Bì Chưởng - Q.1',
  currentDishSummary = 'Cơm sườn bì chả x1, Canh khổ qua x1, Trà tắc x2',
  currentItemsCount = 3,
  currentTotal = 172000,
  currentImageUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtI9tgPIgrm-jlcBCOaQAdaZ7uax_nnOj6tO8i1dYg7PnGakOqGrYE11BQLqno_E3a0zIB2trQQaGZ1xZQGk8q0pMejdEeU3b91-1oI_WTgvdmO_TBfDjBBSyqur1brI9LWBd1u5LA2JfUZk9fsfZkNm9oQIUuKkDnqw3uRNfTKaH3tgk6vNG7WLPAGvfUAMXDozN5k06cZiaqPv-FFhquwDPS3Cxh5O41h3ktfYk9t2uAA105WwGhGA',
  newShopName = 'Phê La - Trương Định',
  newDishName = 'Ô Long Sữa Phê La',
  newDishPrice = 55000,
  newDishOptions = 'Size L, 50% đường, Trân châu Ô Long',
  newImageUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSWxqpTOjUNZH3ddU_vv3mZuORXEJT6pjyGrq-Wo3MaBeZELuDxDMJledJhZNRVw84R8nEmlJ8k6GPrELJjZPeNupoNLXz83ArrRnvy3AnPE7j4sAh542NlSka8caclPX9PiKBoAczJBvgVzl7DVPUQBeytlHRgcZJWe5HCWDyqi1UJUaspml0ryt2jgowa4bvP8FEqXcQPnFc4hi9cqRhOFm-u7U_3xQ1A4KyBz1MM6hP_-IjUP6Csg',
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleKeepCurrent = () => {
    setToastMessage(`Đã giữ giỏ hàng từ ${currentShopName}`);
    setTimeout(() => {
      setToastMessage(null);
      onClose();
    }, 900);
  };

  const handleConfirmNew = () => {
    setToastMessage(`Đã tạo giỏ hàng mới tại ${newShopName}!`);
    setTimeout(() => {
      setToastMessage(null);
      onConfirmReplace();
    }, 900);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end bg-inverse-surface/60 backdrop-blur-sm transition-opacity duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Click outside backdrop to dismiss */}
        <div className="flex-1 w-full" onClick={handleKeepCurrent} />

        {/* Bottom Sheet Modal Container */}
        <div className="w-full max-w-xl mx-auto bg-surface-container-lowest rounded-t-[28px] px-gutter pt-3 pb-safe shadow-2xl relative transition-all duration-300 max-h-[92vh] flex flex-col overflow-y-auto">
          {/* Drag Handle Indicator */}
          <div className="w-12 h-1 bg-outline-variant/60 rounded-full self-center mb-3" />

          {/* Modal Header */}
          <div className="flex items-start justify-between gap-space-md mb-2">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-2xl bg-secondary-fixed/50 flex items-center justify-center flex-shrink-0 text-secondary">
                <span className="material-symbols-outlined text-[24px] text-secondary">
                  swap_horiz
                </span>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-sm text-on-surface font-bold tracking-tight">
                  Tạo giỏ hàng mới?
                </h3>
                <p className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">
                  Xung đột quán ăn
                </p>
              </div>
            </div>
            <button
              aria-label="Đóng"
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
              onClick={handleKeepCurrent}
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Explanation Text */}
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md leading-relaxed">
            Bạn chỉ có thể đặt món từ 1 quán ăn trong mỗi đơn hàng. Giỏ hàng tại{' '}
            <span className="font-semibold text-on-surface">{currentShopName}</span> sẽ bị hủy nếu thêm món từ{' '}
            <span className="font-semibold text-primary">{newShopName}</span>.
          </p>

          {/* Comparison Visual Container */}
          <div className="flex flex-col gap-2.5 mb-space-md">
            {/* Current Cart Card (Sẽ bị xoá) */}
            <div className="bg-error-container/20 rounded-2xl p-space-sm border border-error-container flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="material-symbols-outlined text-error text-[16px]">store</span>
                  <span className="font-label-md text-label-md font-bold text-on-surface truncate">
                    {currentShopName}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-error-container text-error text-label-sm font-semibold flex items-center gap-1 flex-shrink-0">
                  <span className="material-symbols-outlined text-[12px]">delete</span>
                  Sẽ bị xóa
                </span>
              </div>
              <div className="flex items-center gap-space-sm bg-surface-container-lowest/80 p-2 rounded-xl">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-container flex-shrink-0 shadow-sm">
                  <img
                    className="w-full h-full object-cover"
                    src={currentImageUrl}
                    alt={currentShopName}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body-sm text-body-sm text-on-surface line-clamp-1">
                    {currentDishSummary}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {currentItemsCount} món
                    </span>
                    <span className="text-outline-variant">•</span>
                    <span className="font-label-md text-label-md text-on-surface font-bold">
                      {currentTotal.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider / Direction Indicator */}
            <div className="flex items-center justify-center -my-1 relative z-10">
              <div className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant shadow-sm border border-surface-container-lowest">
                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
              </div>
            </div>

            {/* New Cart Card (Món mới chọn) */}
            <div className="bg-surface-container-low rounded-2xl p-space-sm border border-primary-fixed flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="material-symbols-outlined text-primary text-[16px]">storefront</span>
                  <span className="font-label-md text-label-md font-bold text-on-surface truncate">
                    {newShopName}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed/40 text-primary font-bold text-label-sm flex items-center gap-1 flex-shrink-0">
                  <span className="material-symbols-outlined text-[12px]">add_circle</span>
                  Món mới chọn
                </span>
              </div>
              <div className="flex items-center gap-space-sm bg-surface-container-lowest p-2 rounded-xl">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-container flex-shrink-0 shadow-sm">
                  <img
                    className="w-full h-full object-cover"
                    src={newImageUrl}
                    alt={newDishName}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-label-md text-label-md text-on-surface font-semibold truncate">
                    {newDishName}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate text-[12px]">
                    {newDishOptions}
                  </p>
                  <p className="font-label-md text-label-md text-primary font-bold mt-0.5">
                    {newDishPrice.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Tip Notice */}
          <div className="bg-surface-container rounded-xl p-space-sm mb-space-lg flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0">
              tips_and_updates
            </span>
            <p className="font-body-sm text-body-sm text-[12px] leading-snug">
              Mẹo: Bạn có thể hoàn tất đơn {currentShopName.split('-')[0].trim()} trước, hoặc lưu lại vào danh sách yêu thích.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-space-sm pb-space-md">
            <button
              type="button"
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] font-bold cursor-pointer"
              onClick={handleConfirmNew}
            >
              <span className="material-symbols-outlined text-[20px]">restart_alt</span>
              <span>Tạo giỏ mới với {newShopName.split('-')[0].trim()}</span>
            </button>
            <button
              type="button"
              className="w-full h-12 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg flex items-center justify-center transition-colors font-semibold cursor-pointer"
              onClick={handleKeepCurrent}
            >
              <span>Giữ giỏ hàng hiện tại</span>
            </button>
          </div>
        </div>
      </div>

      {/* Micro-interaction / Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 left-4 right-4 z-60 pointer-events-none flex justify-center animate-bounce">
          <div className="bg-inverse-surface text-inverse-on-surface px-space-lg py-space-sm rounded-full shadow-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary-fixed">
              check_circle
            </span>
            <span className="font-body-sm text-body-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default RestaurantConflictModal;
