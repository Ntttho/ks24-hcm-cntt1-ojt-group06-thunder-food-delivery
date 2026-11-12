import React from 'react';

interface CheckoutDeliverySpeedProps {
  deliverySpeed: 'priority' | 'standard' | 'schedule';
  onSelectDeliverySpeed: (speed: 'priority' | 'standard' | 'schedule') => void;
  distance?: string;
  priorityFee?: number;
}

export const CheckoutDeliverySpeed: React.FC<CheckoutDeliverySpeedProps> = ({
  deliverySpeed,
  onSelectDeliverySpeed,
  distance = '1.8 km',
  priorityFee = 5000,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-500 text-[20px]">local_shipping</span>
          <h2 className="text-sm text-gray-900 font-extrabold !mb-0">
            Tùy chọn giao hàng
          </h2>
        </div>
        <span className="text-xs text-gray-400">Khoảng cách: {distance}</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {/* Option 1: Priority */}
        <label
          className={`relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
            deliverySpeed === 'priority'
              ? 'bg-orange-50/60 border-orange-500 ring-1 ring-orange-500'
              : 'bg-gray-50/60 border-gray-100 hover:bg-gray-50'
          }`}
          onClick={() => onSelectDeliverySpeed('priority')}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                deliverySpeed === 'priority'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">check</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-900 font-bold">
                  Giao nhanh hỏa tốc
                </span>
                <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded">
                  Khuyên chọn
                </span>
              </div>
              <span className="text-[11px] text-gray-500 mt-0.5">
                15 - 25 phút • Giao trực tiếp không ghép đơn
              </span>
            </div>
          </div>
          <span className="text-xs text-orange-600 font-bold">
            +{priorityFee.toLocaleString('vi-VN')}đ
          </span>
        </label>

        {/* Option 2: Standard */}
        <label
          className={`relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
            deliverySpeed === 'standard'
              ? 'bg-orange-50/60 border-orange-500 ring-1 ring-orange-500'
              : 'bg-gray-50/60 border-gray-100 hover:bg-gray-50'
          }`}
          onClick={() => onSelectDeliverySpeed('standard')}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                deliverySpeed === 'standard'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">check</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-900 font-bold">
                  Giao tiêu chuẩn
                </span>
                <span className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-1.5 py-0.2 rounded">
                  Tiết kiệm
                </span>
              </div>
              <span className="text-[11px] text-gray-500 mt-0.5">
                30 - 40 phút • Phí ship tiêu chuẩn
              </span>
            </div>
          </div>
          <span className="text-xs text-gray-500 font-semibold">Miễn phụ phí</span>
        </label>
      </div>
    </div>
  );
};

export default CheckoutDeliverySpeed;
