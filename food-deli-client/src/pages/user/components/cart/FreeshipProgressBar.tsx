import React from 'react';

interface FreeshipProgressBarProps {
  remainingForFreeship: number;
  freeshipProgress: number;
  freeshipDiscountAmount?: number;
}

export const FreeshipProgressBar: React.FC<FreeshipProgressBarProps> = ({
  remainingForFreeship,
  freeshipProgress,
  freeshipDiscountAmount = 15000,
}) => {
  return (
    <section className="px-gutter mt-space-md">
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-2 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-secondary-container/15 flex items-center justify-center text-secondary-container">
              <span className="material-symbols-outlined text-[16px]">local_shipping</span>
            </div>
            <p className="font-label-md text-label-md text-on-surface">
              {remainingForFreeship > 0 ? (
                <>
                  Thêm{' '}
                  <span className="text-secondary-container font-headline-sm font-bold">
                    {remainingForFreeship.toLocaleString('vi-VN')}đ
                  </span>{' '}
                  để nhận{' '}
                  <span className="text-primary font-headline-sm font-bold">
                    Freeship {freeshipDiscountAmount.toLocaleString('vi-VN')}đ
                  </span>
                </>
              ) : (
                <span className="text-primary font-bold">
                  🎉 Chúc mừng! Bạn đã đạt điều kiện Freeship {freeshipDiscountAmount.toLocaleString('vi-VN')}đ!
                </span>
              )}
            </p>
          </div>
          <span className="text-label-sm font-label-sm text-primary bg-primary/10 px-2 py-0.5 rounded-full font-semibold">
            Tiết kiệm thêm
          </span>
        </div>
        {/* Progress Meter */}
        <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden mt-1">
          <div
            className="bg-primary-container h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${freeshipProgress}%` }}
          />
        </div>
      </div>
    </section>
  );
};

export default FreeshipProgressBar;

