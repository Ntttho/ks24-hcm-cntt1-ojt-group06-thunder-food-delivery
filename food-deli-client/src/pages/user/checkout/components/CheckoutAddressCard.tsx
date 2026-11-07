import React from 'react';
import type { DeliveryAddressItem } from '../../types';

interface CheckoutAddressCardProps {
  selectedAddress: DeliveryAddressItem;
  dropoffSpot: 'door' | 'lobby' | 'curb';
  onSelectDropoffSpot: (spot: 'door' | 'lobby' | 'curb') => void;
  driverNote: string;
  isEditingDriverNote: boolean;
  onToggleEditDriverNote: () => void;
  onChangeDriverNote: (val: string) => void;
  onAppendDriverTag: (tag: string) => void;
  onOpenAddressModal: () => void;
}

const QUICK_DRIVER_TAGS = [
  'Gọi trước khi đến',
  'Gửi bảo vệ tầng trệt',
  'Treo cửa phòng',
  'Không bấm chuông',
];

export const CheckoutAddressCard: React.FC<CheckoutAddressCardProps> = ({
  selectedAddress,
  dropoffSpot,
  onSelectDropoffSpot,
  driverNote,
  isEditingDriverNote,
  onToggleEditDriverNote,
  onChangeDriverNote,
  onAppendDriverTag,
  onOpenAddressModal,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col gap-3">
      {/* Address Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              location_on
            </span>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-gray-900">
                Địa chỉ nhận hàng
              </span>
              <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {selectedAddress.label || 'Địa chỉ'}
              </span>
            </div>

            <p className="text-xs text-gray-800 font-semibold mt-1 leading-snug">
              {selectedAddress.title ? `${selectedAddress.title} - ` : ''}
              {selectedAddress.fullAddress}
            </p>

            <div className="flex items-center gap-2 text-gray-500 text-xs mt-1">
              <span className="font-medium text-gray-800">
                {selectedAddress.recipientName}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{selectedAddress.phone}</span>
            </div>
          </div>
        </div>

        <button
          aria-label="Thay đổi địa chỉ"
          type="button"
          className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 cursor-pointer flex-shrink-0"
          onClick={onOpenAddressModal}
        >
          <span>Thay đổi</span>
          <span className="material-symbols-outlined text-[15px]">chevron_right</span>
        </button>
      </div>

      {/* Driver Note & Drop-off Box */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-gray-100">
        {/* Location spot picker */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            className={`flex flex-col items-center justify-center p-2 rounded-xl gap-0.5 transition-all cursor-pointer ${
              dropoffSpot === 'door'
                ? 'bg-orange-500 text-white shadow-xs font-bold'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'
            }`}
            onClick={() => onSelectDropoffSpot('door')}
          >
            <span className="material-symbols-outlined text-[17px]">door_front</span>
            <span className="text-[11px] leading-tight">Giao tận cửa</span>
          </button>

          <button
            type="button"
            className={`flex flex-col items-center justify-center p-2 rounded-xl gap-0.5 transition-all cursor-pointer ${
              dropoffSpot === 'lobby'
                ? 'bg-orange-500 text-white shadow-xs font-bold'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'
            }`}
            onClick={() => onSelectDropoffSpot('lobby')}
          >
            <span className="material-symbols-outlined text-[17px]">apartment</span>
            <span className="text-[11px] leading-tight">Sảnh / Lễ tân</span>
          </button>

          <button
            type="button"
            className={`flex flex-col items-center justify-center p-2 rounded-xl gap-0.5 transition-all cursor-pointer ${
              dropoffSpot === 'curb'
                ? 'bg-orange-500 text-white shadow-xs font-bold'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'
            }`}
            onClick={() => onSelectDropoffSpot('curb')}
          >
            <span className="material-symbols-outlined text-[17px]">near_me</span>
            <span className="text-[11px] leading-tight">Cổng / Vỉa hè</span>
          </button>
        </div>

        {/* Driver Note Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-orange-500 text-[15px]">two_wheeler</span>
              Ghi chú cho tài xế giao hàng
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {QUICK_DRIVER_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onAppendDriverTag(tag)}
                className="text-[11px] bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-600 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
              >
                + {tag}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={driverNote}
            onChange={(e) => onChangeDriverNote(e.target.value)}
            placeholder="VD: Gọi trước khi đến 5 phút, gửi bảo vệ..."
            className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-gray-50/50"
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutAddressCard;
