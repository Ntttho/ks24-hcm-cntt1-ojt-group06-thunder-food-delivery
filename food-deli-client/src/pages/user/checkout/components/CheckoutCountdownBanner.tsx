import React from 'react';

interface CheckoutCountdownBannerProps {
  countdownText: string;
}

export const CheckoutCountdownBanner: React.FC<CheckoutCountdownBannerProps> = ({
  countdownText,
}) => {
  return (
    <div className="px-4 py-2.5 flex items-center justify-between bg-orange-50 border-b border-orange-100">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
        </span>
        <span className="text-xs text-gray-700">
          Đang giữ ưu đãi tốt nhất trong{' '}
          <strong className="text-orange-600 font-extrabold text-sm" id="countdown-timer">
            {countdownText}
          </strong>
        </span>
      </div>
      <span className="text-[11px] text-orange-600 flex items-center gap-0.5 font-bold">
        <span>An tâm đặt món</span>
        <span
          className="material-symbols-outlined text-[14px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          verified
        </span>
      </span>
    </div>
  );
};

export default CheckoutCountdownBanner;
