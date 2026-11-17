import React, { useState } from 'react';
import type { DeliveryAddressItem } from '../user/types';

export interface AddressSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAddressId?: string;
  addresses: DeliveryAddressItem[];
  distanceKm?: number | null;
  onSelectAddress: (address: DeliveryAddressItem) => void;
  restaurantName?: string;
}

export const AddressSelectorModal: React.FC<AddressSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedAddressId: propSelectedId = '',
  addresses: availableAddresses,
  distanceKm,
  onSelectAddress,
  restaurantName = 'Cơm Tấm Sà Bì Chưởng',
}) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const effectiveSelectedId = selectedId || propSelectedId || availableAddresses[0]?.id || '';
  const currentSelected = availableAddresses.find((address) => address.id === effectiveSelectedId);
  const filteredAddresses = availableAddresses.filter(
    (addr) =>
      addr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addr.fullAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addr.recipientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirm = () => {
    if (currentSelected) {
      onSelectAddress(currentSelected);
    }
    setSelectedId('');
    onClose();
  };

  const handleClose = () => {
    setSelectedId('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-inverse-surface/60 backdrop-blur-sm transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
    >
      {/* Click outside to close */}
      <div className="flex-1 w-full" onClick={handleClose} />

      {/* Main Drawer Container */}
      <div className="w-full max-w-xl mx-auto bg-surface font-body-md text-on-surface rounded-t-[28px] max-h-[92vh] flex flex-col shadow-2xl relative transition-all duration-300 overflow-hidden">
        {/* Top App Bar Header */}
        <header className="sticky top-0 w-full z-10 bg-surface/90 backdrop-blur-xl border-b border-surface-container-high/40 px-gutter py-3 flex items-center justify-between">
          <div className="flex items-center gap-space-xs min-w-0">
            <button
              aria-label="Back"
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors flex-shrink-0 cursor-pointer"
              onClick={handleClose}
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col min-w-0 ml-1">
              <h2 className="font-headline-sm text-headline-sm text-on-surface truncate leading-tight">
                Chọn địa chỉ nhận hàng
              </h2>
              <div className="flex items-center gap-1 text-on-surface-variant text-[12px] truncate">
                <span className="material-symbols-outlined text-[13px] text-primary">near_me</span>
                <span>Giao món nhanh chóng • 18-25 phút</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-36">
          {/* Top Quick Actions / Sub-Header Bar */}
          <div className="px-gutter pt-space-md pb-space-sm flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Địa chỉ giao hàng</h3>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="px-gutter mb-space-md">
            <div className="relative flex items-center w-full bg-surface-container-lowest rounded-xl shadow-sm px-space-md py-2.5 border border-surface-container-high/40">
              <span className="material-symbols-outlined text-outline text-[20px] mr-2">search</span>
              <input
                className="w-full bg-transparent text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none"
                placeholder="Tìm tòa nhà, số nhà, tên đường..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-container-low text-primary ml-1 hover:bg-primary/10 cursor-pointer"
                type="button"
                title="Định vị vị trí hiện tại"
                onClick={() => alert('Đang tìm vị trí hiện tại của bạn qua GPS...')}
              >
                <span className="material-symbols-outlined text-[16px]">my_location</span>
              </button>
            </div>
          </div>

          {/* Map Distance Preview Widget */}
          <div className="px-gutter mb-space-md">
            <div className="relative w-full rounded-xl overflow-hidden shadow-sm bg-surface-container-lowest">
              <div
                className="w-full h-28 bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCxnf31hp55-kE1NlFe6zxTKZWHKZ9IzBvasOa4pKjSywRa2uYV76QR-yOMV_nD4dv5H_awZEodIGQUxEz6EuKYk2MuhXD85V1lD_z1VHFY-JS5qImgsHempDOfyyAcNbIJylEqB-o7QziguaMJHEIx0JwMWjYOVw6_YMFTLJBcvnMbQhNrjhV9lIaY-hTzmHVfPCDj7ZbIftEWAWAezDJg-D90ta1MF5O-D7S8HjK_ZsrtsWNNWJCnaA')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-on-background/80 via-transparent to-transparent" />
              {/* Distance pill & indicator */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-lowest/90 backdrop-blur-md rounded-full shadow-sm">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
                <span className="font-label-sm text-label-sm text-on-surface">
                  Cách {restaurantName}:{' '}
                  <strong className="text-primary font-bold">
                    {distanceKm != null ? `${distanceKm.toFixed(2)} km` : 'chưa xác định'}
                  </strong>
                </span>
              </div>
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-surface-container-lowest">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-[16px] text-primary-fixed">
                    near_me
                  </span>
                  <span className="font-label-sm text-label-sm truncate">
                    Khoảng cách được tính từ tọa độ địa chỉ đã lưu
                  </span>
                </div>
                <span className="material-symbols-outlined text-[18px] opacity-80">tune</span>
              </div>
            </div>
          </div>

          {/* Saved Addresses List */}
          <div className="px-gutter mb-space-lg">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                Địa chỉ đã lưu
              </span>
              <span className="font-label-sm text-label-sm text-outline">
                {filteredAddresses.length} địa chỉ
              </span>
            </div>

            <div className="flex flex-col gap-space-sm" id="saved-addresses-list">
              {filteredAddresses.map((addr) => {
                const isSelected = addr.id === effectiveSelectedId;
                return (
                  <div
                    key={addr.id}
                    className={`relative p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-2 transition-all cursor-pointer border ${
                      isSelected
                        ? 'border-primary ring-1 ring-primary'
                        : 'border-transparent opacity-90 hover:opacity-100'
                    }`}
                    onClick={() => setSelectedId(addr.id)}
                  >
                    {/* Selection Highlight Bar */}
                    {isSelected && (
                      <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-primary-container rounded-r-full" />
                    )}

                    <div className="flex items-start justify-between gap-2 pl-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-surface-container text-primary'
                              : 'bg-surface-container-high text-tertiary'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {addr.label === 'Nhà riêng'
                              ? 'home'
                              : addr.label === 'Văn phòng'
                              ? 'business'
                              : addr.label === 'Bạn bè'
                              ? 'group'
                              : 'family_restroom'}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm ${
                            isSelected
                              ? 'bg-surface-container text-primary font-bold'
                              : 'bg-surface-container-high text-tertiary'
                          }`}
                        >
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="px-1.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                            Mặc định
                          </span>
                        )}
                      </div>

                      <div className="flex items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isSelected
                              ? 'bg-primary-container text-on-primary'
                              : 'bg-surface-container text-transparent'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        </div>
                      </div>
                    </div>

                    <div className="pl-2">
                      <div className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-0.5">
                        {addr.title}
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                        {addr.fullAddress}
                      </p>
                      <div className="flex items-center gap-2 mt-2 pt-2 text-outline font-label-sm text-label-sm bg-surface-container-low/50 px-2 py-1 rounded-lg">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        <span className="text-on-surface font-medium">{addr.recipientName}</span>
                        <span>•</span>
                        <span>{addr.phone}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          {!availableAddresses.length && (
            <p className="px-gutter py-8 text-center text-sm text-outline">
              Bạn chưa có địa chỉ giao hàng đã lưu. Hãy thêm địa chỉ trong hồ sơ trước khi đặt hàng.
            </p>
          )}
        </div>

        {/* Persistent Floating Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-space-md bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-20 pb-safe border-t border-surface-container">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-on-surface truncate">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  check_circle
                </span>
                <span className="font-label-sm text-label-sm truncate">
                  Giao tới: <strong>{currentSelected?.title || 'Chưa chọn địa chỉ'}</strong>
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-semibold flex-shrink-0">
                {distanceKm != null ? `${distanceKm.toFixed(2)} km` : 'Chưa có khoảng cách'}
              </span>
            </div>

            <button
              className="w-full h-12 rounded-xl bg-primary-container text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md hover:bg-primary cursor-pointer"
              type="button"
              onClick={handleConfirm}
              disabled={!currentSelected}
            >
              <span>Giao đến địa chỉ này</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressSelectorModal;
