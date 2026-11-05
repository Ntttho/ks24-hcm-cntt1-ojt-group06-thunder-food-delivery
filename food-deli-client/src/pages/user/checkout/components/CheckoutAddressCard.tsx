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
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-3">
      {/* Address Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-error-container/40 flex items-center justify-center flex-shrink-0 mt-0.5 text-error">
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              location_on
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Giao tận cửa
              </span>
              <span className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded-full font-medium">
                {selectedAddress.label}
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface font-semibold mt-0.5 leading-snug">
              {selectedAddress.title} - {selectedAddress.fullAddress}
            </p>
            <div className="flex items-center gap-2 text-on-surface-variant mt-1">
              <span className="font-body-sm text-body-sm font-medium">
                {selectedAddress.recipientName}
              </span>
              <span className="w-1 h-1 rounded-full bg-outline" />
              <span className="font-body-sm text-body-sm">{selectedAddress.phone}</span>
            </div>
          </div>
        </div>

        <button
          aria-label="Thay đổi địa chỉ"
          type="button"
          className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant active:scale-95 transition-transform flex-shrink-0 cursor-pointer hover:bg-surface-container"
          onClick={onOpenAddressModal}
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>

      {/* Driver Note & Drop-off Box */}
      <div className="flex flex-col gap-3 pt-1 border-t border-surface-container-high/60">
        {/* Location spot picker */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">pin_drop</span>
              Vị trí nhận đồ ăn
            </span>
            <span className="font-label-sm text-label-sm text-primary font-medium">Chính xác</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              className={`flex flex-col items-center justify-center p-2 rounded-xl gap-1 transition-all cursor-pointer ${
                dropoffSpot === 'door'
                  ? 'bg-primary text-on-primary border border-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface border border-transparent hover:bg-surface-container'
              }`}
              onClick={() => onSelectDropoffSpot('door')}
            >
              <span className="material-symbols-outlined text-[18px]">door_front</span>
              <span className="font-label-sm text-label-sm font-bold text-center leading-tight">
                Tận cửa / phòng
              </span>
            </button>

            <button
              type="button"
              className={`flex flex-col items-center justify-center p-2 rounded-xl gap-1 transition-all cursor-pointer ${
                dropoffSpot === 'lobby'
                  ? 'bg-primary text-on-primary border border-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface border border-transparent hover:bg-surface-container'
              }`}
              onClick={() => onSelectDropoffSpot('lobby')}
            >
              <span className="material-symbols-outlined text-[18px]">meeting_room</span>
              <span className="font-label-sm text-label-sm font-bold text-center leading-tight">
                Sảnh / Cổng
              </span>
            </button>

            <button
              type="button"
              className={`flex flex-col items-center justify-center p-2 rounded-xl gap-1 transition-all cursor-pointer ${
                dropoffSpot === 'curb'
                  ? 'bg-primary text-on-primary border border-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface border border-transparent hover:bg-surface-container'
              }`}
              onClick={() => onSelectDropoffSpot('curb')}
            >
              <span className="material-symbols-outlined text-[18px]">directions_walk</span>
              <span className="font-label-sm text-label-sm font-bold text-center leading-tight">
                Gặp ở lề đường
              </span>
            </button>
          </div>
        </div>

        {/* Driver Note Box */}
        <div className="bg-surface-container-low/70 rounded-xl p-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-tertiary text-[18px]">two_wheeler</span>
              <span className="font-label-sm text-label-sm font-bold text-on-surface">
                Ghi chú cho Tài xế
              </span>
            </div>
            <button
              type="button"
              className="text-primary font-label-sm text-label-sm flex items-center gap-0.5 cursor-pointer hover:underline font-semibold"
              onClick={onToggleEditDriverNote}
            >
              <span className="material-symbols-outlined text-[14px]">edit</span>
              {isEditingDriverNote ? 'Xong' : 'Sửa'}
            </button>
          </div>

          {isEditingDriverNote ? (
            <input
              type="text"
              className="text-body-sm text-on-surface bg-surface-container-lowest p-2 rounded-lg border border-primary focus:outline-none"
              value={driverNote}
              onChange={(e) => onChangeDriverNote(e.target.value)}
              placeholder="Ghi chú thêm cho tài xế..."
              autoFocus
            />
          ) : (
            <div className="text-body-sm text-on-surface bg-surface-container-lowest p-2 rounded-lg border border-surface-container-high">
              {driverNote || 'Chưa có ghi chú cho tài xế'}
            </div>
          )}

          {/* Quick driver note tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {['+ Bấm chuông cửa', '✓ Gọi trước 5 phút', '+ Để bàn lễ tân', '+ Treo ở cổng'].map(
              (tag) => (
                <button
                  key={tag}
                  type="button"
                  className="flex-shrink-0 px-2.5 py-1 rounded-full bg-surface-container-high/60 text-on-surface-variant font-label-sm text-label-sm hover:bg-primary-fixed/30 hover:text-primary transition-all active:scale-95 cursor-pointer font-medium"
                  onClick={() => onAppendDriverTag(tag)}
                >
                  {tag}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutAddressCard;

