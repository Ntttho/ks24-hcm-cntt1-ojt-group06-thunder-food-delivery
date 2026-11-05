import React from 'react';

interface CheckoutDeliverySpeedProps {
  deliverySpeed: 'priority' | 'standard' | 'schedule';
  onSelectDeliverySpeed: (speed: 'priority' | 'standard' | 'schedule') => void;
  distance?: string;
}

export const CheckoutDeliverySpeed: React.FC<CheckoutDeliverySpeedProps> = ({
  deliverySpeed,
  onSelectDeliverySpeed,
  distance = '1.8 km',
}) => {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">local_shipping</span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            Tùy chọn giao hàng
          </h2>
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant">Khoảng cách: {distance}</span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {/* Option 1: Priority */}
        <label
          className={`relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
            deliverySpeed === 'priority'
              ? 'bg-surface-container-low border-primary ring-1 ring-primary'
              : 'bg-surface-container-lowest border-transparent'
          }`}
          onClick={() => onSelectDeliverySpeed('priority')}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                deliverySpeed === 'priority'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">check</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-label-lg text-label-lg text-on-surface font-bold">
                  Giao ngay (Ưu tiên)
                </span>
                <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-1.5 py-0.5 rounded font-semibold">
                  Nhanh nhất
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                20 - 25 phút • Giao trực tiếp
              </span>
            </div>
          </div>
          <span className="font-label-lg text-label-lg text-secondary font-bold">+5.000đ</span>
        </label>

        {/* Option 2: Standard */}
        <label
          className={`relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
            deliverySpeed === 'standard'
              ? 'bg-surface-container-low border-primary ring-1 ring-primary'
              : 'bg-surface-container-lowest border-transparent'
          }`}
          onClick={() => onSelectDeliverySpeed('standard')}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                deliverySpeed === 'standard'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">check</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-lg text-label-lg text-on-surface font-bold">
                Giao tiêu chuẩn
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                30 - 35 phút • Tiết kiệm
              </span>
            </div>
          </div>
          <span className="font-label-lg text-label-lg text-on-surface-variant font-medium">
            Miễn phụ phí
          </span>
        </label>

        {/* Option 3: Scheduled */}
        <label
          className={`relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
            deliverySpeed === 'schedule'
              ? 'bg-surface-container-low border-primary ring-1 ring-primary'
              : 'bg-surface-container-lowest border-transparent'
          }`}
          onClick={() => onSelectDeliverySpeed('schedule')}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                deliverySpeed === 'schedule'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">check</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-lg text-label-lg text-on-surface font-bold">
                Đặt lịch trước
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Giao đúng giờ hẹn
              </span>
            </div>
          </div>
          <span className="font-label-sm text-label-sm text-primary font-bold">Chọn giờ</span>
        </label>
      </div>
    </div>
  );
};

export default CheckoutDeliverySpeed;

