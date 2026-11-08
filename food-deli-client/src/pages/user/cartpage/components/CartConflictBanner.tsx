import React from 'react';

interface CartConflictBannerProps {
  onTriggerConflict: () => void;
}

export const CartConflictBanner: React.FC<CartConflictBannerProps> = ({
  onTriggerConflict,
}) => {
  return (
    <div className="px-gutter pt-space-sm">
      <button
        type="button"
        className="w-full py-2 px-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-semibold rounded-xl flex items-center justify-between hover:bg-amber-500/20 transition-all cursor-pointer"
        onClick={onTriggerConflict}
      >
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-amber-600">warning</span>
          <span>Thử nghiệm: Bấm để xem UI Cảnh báo xung đột quán ăn</span>
        </span>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
      </button>
    </div>
  );
};

export default CartConflictBanner;

