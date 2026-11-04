import React from 'react';

interface CheckoutCountdownBannerProps {
  countdownText: string;
}

export const CheckoutCountdownBanner: React.FC<CheckoutCountdownBannerProps> = ({
  countdownText,
}) => {
  return (
    <div className="px-gutter pt-3 pb-2 flex items-center justify-between bg-primary-container/10 border-b border-primary-container/20">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
        </span>
        <span className="font-label-sm text-label-sm text-on-surface">
          Đang giữ bàn &amp; ưu đãi tốt nhất trong{' '}
          <span className="font-headline-sm text-headline-sm text-secondary font-bold" id="countdown-timer">
            {countdownText}
          </span>
        </span>
      </div>
      <span className="font-label-sm text-label-sm text-primary flex items-center gap-0.5 font-semibold">
        An tâm đặt{' '}
        <span
          className="material-symbols-outlined text-[15px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          verified
        </span>
      </span>
    </div>
  );
};

export default CheckoutCountdownBanner;

