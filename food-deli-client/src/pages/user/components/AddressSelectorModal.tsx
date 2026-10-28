import React, { useState } from 'react';
import type { DeliveryAddressItem } from '../types';

export interface AddressSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAddressId?: string;
  onSelectAddress: (address: DeliveryAddressItem) => void;
  restaurantName?: string;
}

const INITIAL_SAVED_ADDRESSES: DeliveryAddressItem[] = [
  {
    id: 'addr-1',
    label: 'Nhà riêng',
    title: 'Tòa Landmark 81',
    fullAddress: '720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh',
    recipientName: 'Nguyễn Văn An',
    phone: '0909 *** 888',
    isDefault: true,
  },
  {
    id: 'addr-2',
    label: 'Văn phòng',
    title: 'Bitexco Financial Tower',
    fullAddress: 'Số 2 Hải Triều, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    recipientName: 'Văn An',
    phone: '0909 *** 888',
    isDefault: false,
  },
  {
    id: 'addr-3',
    label: 'Bạn bè',
    title: 'Chung cư Sunrise City',
    fullAddress: '27 Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh',
    recipientName: 'Thanh Hằng',
    phone: '0933 *** 777',
    isDefault: false,
  },
  {
    id: 'addr-4',
    label: 'Nhà bố mẹ',
    title: 'Nhà Bố Mẹ - Bình Thạnh',
    fullAddress: '125/4 Hoàng Hoa Thám, Phường 6, Quận Bình Thạnh, TP. Hồ Chí Minh',
    recipientName: 'Nguyễn Văn Bình (Bố)',
    phone: '0912 *** 345',
    isDefault: false,
  },
];

const RECENT_ADDRESSES = [
  {
    title: 'Cà phê The Coffee House',
    address: '141 Nguyễn Thái Bình, Quận 1, TP. HCM',
  },
  {
    title: 'Văn phòng Grab Sài Gòn',
    address: 'Tầng 15, Tòa nhà Mapletree, Quận 7, TP. HCM',
  },
];

export const AddressSelectorModal: React.FC<AddressSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedAddressId: propSelectedId = 'addr-1',
  onSelectAddress,
  restaurantName = 'Cơm Tấm Sà Bì Chưởng',
}) => {
  const [addresses, setAddresses] = useState<DeliveryAddressItem[]>(INITIAL_SAVED_ADDRESSES);
  const [selectedId, setSelectedId] = useState<string>(propSelectedId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // New Address Form State
  const [newTitle, setNewTitle] = useState('');
  const [newFullAddress, setNewFullAddress] = useState('');
  const [newName, setNewName] = useState('Nguyễn Văn An');
  const [newPhone, setNewPhone] = useState('0909 123 888');
  const [newLabel, setNewLabel] = useState('Nhà riêng');
  const [newIsDefault, setNewIsDefault] = useState(false);

  if (!isOpen) return null;

  const currentSelected = addresses.find((a) => a.id === selectedId) || addresses[0];

  const filteredAddresses = addresses.filter(
    (addr) =>
      addr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addr.fullAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addr.recipientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newFullAddress.trim()) return;

    const newAddr: DeliveryAddressItem = {
      id: `addr-${Date.now()}`,
      title: newTitle.trim(),
      fullAddress: newFullAddress.trim(),
      recipientName: newName.trim() || 'Người nhận',
      phone: newPhone.trim() || '0909 *** 888',
      label: newLabel,
      isDefault: newIsDefault,
    };

    setAddresses((prev) => [newAddr, ...prev]);
    setSelectedId(newAddr.id);
    setIsAddingNew(false);
    // Reset form
    setNewTitle('');
    setNewFullAddress('');
  };

  const handleConfirm = () => {
    if (currentSelected) {
      onSelectAddress(currentSelected);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-inverse-surface/60 backdrop-blur-sm transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
    >
      {/* Click outside to close */}
      <div className="flex-1 w-full" onClick={onClose} />

      {/* Main Drawer Container */}
      <div className="w-full max-w-xl mx-auto bg-surface font-body-md text-on-surface rounded-t-[28px] max-h-[92vh] flex flex-col shadow-2xl relative transition-all duration-300 overflow-hidden">
        {/* Top App Bar Header */}
        <header className="sticky top-0 w-full z-10 bg-surface/90 backdrop-blur-xl border-b border-surface-container-high/40 px-gutter py-3 flex items-center justify-between">
          <div className="flex items-center gap-space-xs min-w-0">
            <button
              aria-label="Back"
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors flex-shrink-0 cursor-pointer"
              onClick={onClose}
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
            onClick={onClose}
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
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container text-primary font-label-md text-label-md active:scale-95 transition-all cursor-pointer hover:bg-primary-fixed/30"
              type="button"
              onClick={() => setIsAddingNew(true)}
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Thêm mới</span>
            </button>
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
                  Cách {restaurantName}: <strong className="text-primary font-bold">1.8 km</strong> (~18 phút)
                </span>
              </div>
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-surface-container-lowest">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-[16px] text-primary-fixed">
                    near_me
                  </span>
                  <span className="font-label-sm text-label-sm truncate">
                    Đang định vị chuẩn xác tới sảnh chính tòa nhà
                  </span>
                </div>
                <span className="material-symbols-outlined text-[18px] opacity-80">tune</span>
              </div>
            </div>
          </div>

          {/* Add New Address Form Modal/Section */}
          {isAddingNew && (
            <div className="mx-gutter mb-space-lg p-space-md bg-surface-container-lowest rounded-2xl shadow-md border border-primary/30 animate-in fade-in">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">add_location_alt</span>
                  Thêm địa chỉ giao hàng mới
                </h4>
                <button
                  type="button"
                  className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
                  onClick={() => setIsAddingNew(false)}
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveNewAddress} className="flex flex-col gap-3">
                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                    Tên gợi nhớ (VD: Tòa nhà Landmark, Cơ quan...)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Căn hộ Saigon Pearl"
                    className="w-full px-3 py-2 text-body-md rounded-xl bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                    Địa chỉ chi tiết (Số nhà, tên đường, phường, quận)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 92 Nguyễn Hữu Cảnh, P.22, Bình Thạnh"
                    className="w-full px-3 py-2 text-body-md rounded-xl bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary"
                    value={newFullAddress}
                    onChange={(e) => setNewFullAddress(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                      Tên người nhận
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-body-md rounded-xl bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 text-body-md rounded-xl bg-surface-container-low border border-surface-container-high focus:outline-none focus:border-primary"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1.5">
                    Nhãn địa chỉ
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['Nhà riêng', 'Văn phòng', 'Bạn bè', 'Nhà bố mẹ', 'Khác'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`px-3 py-1 rounded-full text-label-sm font-label-sm cursor-pointer transition-all ${
                          newLabel === tag
                            ? 'bg-primary text-on-primary font-bold'
                            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                        onClick={() => setNewLabel(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="set-default-cb"
                    checked={newIsDefault}
                    onChange={(e) => setNewIsDefault(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                  <label htmlFor="set-default-cb" className="text-body-sm text-on-surface cursor-pointer">
                    Đặt làm địa chỉ nhận hàng mặc định
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-label-md font-bold shadow-sm hover:bg-primary-container cursor-pointer transition-all"
                  >
                    Lưu địa chỉ
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface-variant font-label-md font-semibold cursor-pointer"
                    onClick={() => setIsAddingNew(false)}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

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
                const isSelected = addr.id === selectedId;
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

                      <div className="flex items-center gap-1">
                        <button
                          className="w-7 h-7 flex items-center justify-center rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Chỉnh sửa địa chỉ "${addr.title}"`);
                          }}
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
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

              {/* Add New Dashed Button */}
              {!isAddingNew && (
                <button
                  type="button"
                  className="w-full p-space-md rounded-xl border border-dashed border-primary/40 bg-surface-container-low hover:bg-surface-container flex items-center justify-center gap-2 text-primary font-label-lg text-label-lg transition-all active:scale-[0.99] cursor-pointer"
                  onClick={() => setIsAddingNew(true)}
                >
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  <span>+ Thêm địa chỉ mới</span>
                </button>
              )}
            </div>
          </div>

          {/* Recent Addresses History */}
          <div className="px-gutter mb-space-lg">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                Địa chỉ gần đây
              </span>
              <span className="font-label-sm text-label-sm text-outline">Lịch sử giao</span>
            </div>
            <div className="flex flex-col gap-space-sm">
              {RECENT_ADDRESSES.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-all"
                  onClick={() => {
                    const tempAddr: DeliveryAddressItem = {
                      id: `recent-${idx}`,
                      title: rec.title,
                      fullAddress: rec.address,
                      recipientName: 'Nguyễn Văn An',
                      phone: '0909 *** 888',
                      label: 'Khác',
                    };
                    setAddresses((prev) => [tempAddr, ...prev]);
                    setSelectedId(tempAddr.id);
                  }}
                >
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined text-[18px]">history</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-label-lg text-label-lg text-on-surface truncate">
                        {rec.title}
                      </div>
                      <div className="font-body-sm text-body-sm text-outline truncate">
                        {rec.address}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-primary font-label-sm text-label-sm font-semibold flex-shrink-0 ml-2 hover:underline cursor-pointer"
                  >
                    Chọn
                  </button>
                </div>
              ))}
            </div>
          </div>
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
                  Giao tới: <strong>{currentSelected.title}</strong>
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-semibold flex-shrink-0">
                Ước tính 18 - 25p
              </span>
            </div>

            <button
              className="w-full h-12 rounded-xl bg-primary-container text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md hover:bg-primary cursor-pointer"
              type="button"
              onClick={handleConfirm}
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
