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
    <section className="px-4 mt-4">
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col gap-2 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
              <span className="material-symbols-outlined text-[17px]">local_shipping</span>
            </div>
            <p className="text-xs text-gray-700 font-medium truncate">
              {remainingForFreeship > 0 ? (
                <>
                  Mua thêm{' '}
                  <span className="text-orange-600 font-extrabold">
                    {remainingForFreeship.toLocaleString('vi-VN')}đ
                  </span>{' '}
                  để nhận{' '}
                  <span className="text-amber-600 font-extrabold">
                    Freeship {freeshipDiscountAmount.toLocaleString('vi-VN')}đ
                  </span>
                </>
              ) : (
                <span className="text-emerald-600 font-bold">
                  🎉 Chúc mừng! Bạn đã đạt điều kiện Freeship {freeshipDiscountAmount.toLocaleString('vi-VN')}đ!
                </span>
              )}
            </p>
          </div>
          <span className="text-[11px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-bold whitespace-nowrap border border-orange-200">
            Ưu đãi vận chuyển
          </span>
        </div>

        {/* Progress Meter */}
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-1">
          <div
            className="bg-linear-to-r from-orange-400 to-amber-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${freeshipProgress}%` }}
          />
        </div>
      </div>
    </section>
  );
};

export default FreeshipProgressBar;
