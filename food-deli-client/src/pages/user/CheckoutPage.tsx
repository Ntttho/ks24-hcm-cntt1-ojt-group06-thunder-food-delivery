import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/constants';
import { PaymentMethodModal } from './components/PaymentMethodModal';
import { AddressSelectorModal } from './components/AddressSelectorModal';
import type { DeliveryAddressItem } from './types';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();

  // Modals
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Countdown timer (07:59)
  const [countdown, setCountdown] = useState<number>(7 * 60 + 59);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Delivery Address State
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddressItem>({
    id: 'addr-1',
    label: 'Nhà riêng',
    title: 'Tòa nhà Landmark 81',
    fullAddress: '720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM',
    recipientName: 'Nguyễn Văn An',
    phone: '0909 *** 888',
    isDefault: true,
  });

  // Drop-off spot: 'door' | 'lobby' | 'curb'
  const [dropoffSpot, setDropoffSpot] = useState<'door' | 'lobby' | 'curb'>('door');

  // Driver notes & quick chips
  const [driverNote, setDriverNote] = useState('Gọi trước khi đến 5 phút, gửi lễ tân tầng trệt');
  const [isEditingDriverNote, setIsEditingDriverNote] = useState(false);

  // Delivery speed: 'priority' | 'standard' | 'schedule'
  const [deliverySpeed, setDeliverySpeed] = useState<'priority' | 'standard' | 'schedule'>('priority');

  // Order items collapsible
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(true);

  // Kitchen notes
  const [kitchenNote, setKitchenNote] = useState('');
  const [selectedKitchenChips, setSelectedKitchenChips] = useState<string[]>([]);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<{
    id: string;
    name: string;
    extraDiscount: number;
  }>({
    id: 'momo',
    name: 'Ví điện tử MoMo',
    extraDiscount: 0,
  });

  // Submission State
  const [orderState, setOrderState] = useState<'idle' | 'loading' | 'success'>('idle');

  // Pricing calculations
  const itemsSubtotal = 172000;
  const baseShippingFee = 18000;
  const prioritySurcharge = deliverySpeed === 'priority' ? 5000 : 0;
  const shippingFee = baseShippingFee + prioritySurcharge;
  const serviceFee = 4000;
  const foodVoucherDiscount = 25000;
  const shipVoucherDiscount = 15000;
  const paymentMethodDiscount = paymentMethod.extraDiscount;

  const totalDiscount = foodVoucherDiscount + shipVoucherDiscount + paymentMethodDiscount;
  const originalTotal = itemsSubtotal + shippingFee + serviceFee;
  const finalTotal = Math.max(0, originalTotal - totalDiscount);

  const handleToggleKitchenChip = (chip: string) => {
    setSelectedKitchenChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleAppendDriverTag = (tag: string) => {
    const cleanTag = tag.replace(/^[✓+]\s*/, '');
    if (!driverNote.includes(cleanTag)) {
      setDriverNote((prev) => (prev ? `${prev}, ${cleanTag}` : cleanTag));
    }
  };

  const handlePlaceOrder = () => {
    setOrderState('loading');
    setTimeout(() => {
      setOrderState('success');
    }, 1400);
  };

  return (
    <div className="bg-surface font-body-md text-on-surface flex flex-col min-h-screen">
      {/* Top Header */}
      <header className="fixed top-0 w-full z-40 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-xl mx-auto h-16 px-gutter flex items-center justify-between gap-space-xs">
          <div className="flex items-center gap-space-xs min-w-0 flex-1">
            <button
              aria-label="Back"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors flex-shrink-0 cursor-pointer"
              onClick={() => navigate(APP_ROUTES.CART)}
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-primary to-primary-container flex items-center justify-center text-on-primary font-extrabold text-sm flex-shrink-0 shadow-sm">
              ⚡
            </div>
            <div className="flex flex-col min-w-0 ml-space-xs">
              <h1 className="font-headline-sm text-headline-sm text-on-surface truncate leading-tight">
                Checkout Review
              </h1>
              <div className="flex items-center gap-1 text-on-surface-variant truncate">
                <span className="material-symbols-outlined text-[14px] text-primary">storefront</span>
                <span className="font-label-sm text-label-sm truncate">
                  Cơm Tấm Sà Bì Chưởng • 1.8 km
                </span>
              </div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-space-xs">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex flex-col relative w-full pt-16 bg-surface min-h-screen pb-safe">
        <div className="max-w-xl mx-auto w-full flex flex-col pb-36">
          {/* Status Micro-Banner with Countdown */}
          <div className="px-gutter pt-3 pb-2 flex items-center justify-between bg-primary-container/10 border-b border-primary-container/20">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
              </span>
              <span className="font-label-sm text-label-sm text-on-surface">
                Đang giữ bàn &amp; ưu đãi tốt nhất trong{' '}
                <span className="font-headline-sm text-headline-sm text-secondary font-bold" id="countdown-timer">
                  {formatTimer(countdown)}
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

          <div className="p-gutter flex flex-col gap-3">
            {/* 1. Delivery Address Card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-3">
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
                  onClick={() => setIsAddressModalOpen(true)}
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
                      onClick={() => setDropoffSpot('door')}
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
                      onClick={() => setDropoffSpot('lobby')}
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
                      onClick={() => setDropoffSpot('curb')}
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
                      onClick={() => setIsEditingDriverNote(!isEditingDriverNote)}
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
                      onChange={(e) => setDriverNote(e.target.value)}
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
                          onClick={() => handleAppendDriverTag(tag)}
                        >
                          {tag}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Delivery Speed Options */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">local_shipping</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Tùy chọn giao hàng
                  </h2>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Khoảng cách: 1.8 km</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Option 1: Priority */}
                <label
                  className={`relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                    deliverySpeed === 'priority'
                      ? 'bg-surface-container-low border-primary ring-1 ring-primary'
                      : 'bg-surface-container-lowest border-transparent'
                  }`}
                  onClick={() => setDeliverySpeed('priority')}
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
                  onClick={() => setDeliverySpeed('standard')}
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
                  onClick={() => setDeliverySpeed('schedule')}
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
                        Chọn khung giờ hôm nay
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-semibold">
                    <span className="font-label-sm text-label-sm">Chọn giờ</span>
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 3. Order Summary Card (Expandable/Collapsible) */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
              {/* Merchant Header */}
              <div className="p-space-lg flex items-center justify-between bg-surface-container-low/60 border-b border-surface-container-high/40">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center flex-shrink-0 text-primary">
                    <span className="material-symbols-outlined text-[20px]">restaurant</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-headline-sm text-headline-sm text-on-surface truncate font-bold">
                        Cơm Tấm Sà Bì Chưởng
                      </span>
                      <span
                        className="material-symbols-outlined text-primary text-[16px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      Chi nhánh Nguyễn Trãi, Quận 1
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Thu gọn hoặc mở rộng danh sách"
                  className="flex items-center gap-1 text-on-surface-variant font-label-md text-label-md px-2 py-1 rounded bg-surface-container-lowest active:scale-95 transition-transform cursor-pointer hover:bg-surface-container"
                  onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
                >
                  <span>Chi tiết (3)</span>
                  <span
                    className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                      isOrderSummaryOpen ? 'rotate-0' : 'rotate-180'
                    }`}
                  >
                    keyboard_arrow_up
                  </span>
                </button>
              </div>

              {/* Items List */}
              {isOrderSummaryOpen && (
                <div className="p-space-lg flex flex-col gap-3.5 transition-all">
                  {/* Item 1 */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="bg-surface-container-high text-on-surface font-label-sm text-label-sm w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                        1x
                      </span>
                      <div className="flex flex-col min-w-0">
                        <p className="font-body-lg text-body-lg text-on-surface font-semibold leading-tight">
                          Cơm Tấm Sườn Bì Chả
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          Sườn nướng mật ong, nước mắm kẹo, mỡ hành nhiều
                        </p>
                        <span className="text-tertiary font-label-sm text-label-sm mt-0.5 italic">
                          Ghi chú: Ít cơm, nhiều dưa chua
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">
                        89.000đ
                      </span>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="bg-surface-container-high text-on-surface font-label-sm text-label-sm w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                        1x
                      </span>
                      <div className="flex flex-col min-w-0">
                        <p className="font-body-lg text-body-lg text-on-surface font-semibold leading-tight">
                          Canh Khổ Qua Nhồi Thịt
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          Nóng hổi, chuẩn vị truyền thống
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">
                        35.000đ
                      </span>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="bg-surface-container-high text-on-surface font-label-sm text-label-sm w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                        2x
                      </span>
                      <div className="flex flex-col min-w-0">
                        <p className="font-body-lg text-body-lg text-on-surface font-semibold leading-tight">
                          Trà Tắc Xí Muội Khổng Lồ
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          70% đường, 100% đá
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">
                        48.000đ
                      </span>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">24.000đ/ly</p>
                    </div>
                  </div>

                  {/* Kitchen Note Box */}
                  <div className="p-3 rounded-xl bg-surface-container-low/70 flex flex-col gap-2 border border-surface-container-high/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-secondary text-[18px]">
                          soup_kitchen
                        </span>
                        <span className="font-label-sm text-label-sm font-bold text-on-surface">
                          Dặn dò Quán ăn &amp; Bếp
                        </span>
                      </div>
                      <span className="text-[11px] font-label-sm text-on-surface-variant">Tùy chọn</span>
                    </div>

                    <div className="flex items-center justify-between bg-surface-container-lowest px-3 py-2 rounded-lg border border-surface-container-high">
                      <input
                        type="text"
                        placeholder="Ghi chú cho quán (dị ứng, gia vị...)..."
                        className="w-full bg-transparent text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none"
                        value={kitchenNote}
                        onChange={(e) => setKitchenNote(e.target.value)}
                      />
                      <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
                        edit_note
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                      {['+ Ít cay', '+ Không hành lá', '+ Để riêng nước sốt', '+ Lấy thêm muỗng đũa'].map(
                        (chip) => {
                          const isSelected = selectedKitchenChips.includes(chip);
                          return (
                            <button
                              key={chip}
                              type="button"
                              className={`flex-shrink-0 px-2 py-0.5 rounded-full font-label-sm text-label-sm transition-all active:scale-95 cursor-pointer ${
                                isSelected
                                  ? 'bg-secondary text-white font-bold'
                                  : 'bg-surface-container-high/60 text-on-surface hover:bg-secondary-fixed hover:text-secondary'
                              }`}
                              onClick={() => handleToggleKitchenChip(chip)}
                            >
                              {chip}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Cutlery footnote */}
                  <div className="pt-2 flex items-center justify-between text-on-surface-variant">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">eco</span>
                      <span className="font-body-sm text-body-sm">Kèm muỗng nĩa &amp; khăn giấy</span>
                    </div>
                    <div className="font-body-md text-body-md text-on-surface">
                      Tạm tính (3 món): <span className="font-bold">172.000đ</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Vouchers & Promotions Box */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      confirmation_number
                    </span>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Khuyến mãi &amp; Mã giảm giá
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Chọn hoặc nhập mã khác"
                  className="font-label-md text-label-md text-primary font-bold flex items-center gap-0.5 active:scale-95 transition-transform cursor-pointer"
                  onClick={() => alert('Mã giảm giá tốt nhất đã được tự động áp dụng!')}
                >
                  Nhập mã khác
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>

              {/* Applied Vouchers Badges */}
              <div className="flex flex-col gap-2">
                {/* Voucher 1 */}
                <div className="flex items-center justify-between bg-secondary-fixed/30 rounded-xl p-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-primary flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[18px]">sell</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-label-md text-on-surface truncate font-bold">
                        THUNDERNEW
                      </span>
                      <span className="font-body-sm text-body-sm text-secondary truncate">
                        Giảm 25.000đ cho đơn đầu tiên
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-label-md text-label-md text-secondary font-bold">
                      -25.000đ
                    </span>
                    <span
                      className="material-symbols-outlined text-primary text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  </div>
                </div>

                {/* Voucher 2 */}
                <div className="flex items-center justify-between bg-primary-fixed/20 rounded-xl p-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[18px]">moped</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-label-md text-on-surface truncate font-bold">
                        FREESHIP15K
                      </span>
                      <span className="font-body-sm text-body-sm text-primary truncate">
                        Hỗ trợ 15.000đ phí giao hàng
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-label-md text-label-md text-primary font-bold">
                      -15.000đ
                    </span>
                    <span
                      className="material-symbols-outlined text-primary text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-primary font-semibold">
                <span className="material-symbols-outlined text-[16px]">celebration</span>
                <span className="font-label-sm text-label-sm">
                  Đã tiết kiệm được {totalDiscount.toLocaleString('vi-VN')}đ cho đơn hàng này!
                </span>
              </div>
            </div>

            {/* 5. Payment Method Selector */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface text-[20px]">
                    account_balance_wallet
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Phương thức thanh toán
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Thay đổi phương thức thanh toán"
                  className="font-label-md text-label-md text-primary font-bold flex items-center gap-0.5 active:scale-95 transition-transform cursor-pointer"
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  Thay đổi
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>

              {/* Active Selected Method */}
              <div
                className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-container transition-colors"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {paymentMethod.id === 'momo' ? (
                    <div className="w-10 h-10 rounded-xl bg-[#A50064] text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm">
                      M
                    </div>
                  ) : paymentMethod.id === 'vietqr' ? (
                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-primary-container text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">payments</span>
                    </div>
                  )}

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">
                        {paymentMethod.name}
                      </span>
                      <span className="bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm px-1.5 py-0.2 rounded font-semibold">
                        Khuyên dùng
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
                      <span>Số dư khả dụng:</span>
                      <span className="font-bold text-on-surface">450.000đ</span>
                      <span className="text-primary text-[12px] font-semibold">(Đủ số dư)</span>
                    </div>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
              </div>

              {/* Other Quick Payment Thumbnails */}
              <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high/60 text-on-surface font-label-sm text-label-sm flex-shrink-0 opacity-70 cursor-pointer hover:opacity-100"
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  <span className="material-symbols-outlined text-[16px]">payments</span>
                  Tiền mặt khi nhận
                </div>
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high/60 text-on-surface font-label-sm text-label-sm flex-shrink-0 opacity-70 cursor-pointer hover:opacity-100"
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  <span className="material-symbols-outlined text-[16px]">credit_card</span>
                  Visa •••• 9821
                </div>
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high/60 text-on-surface font-label-sm text-label-sm flex-shrink-0 opacity-70 cursor-pointer hover:opacity-100"
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                  VietQR Napas
                </div>
              </div>
            </div>

            {/* 6. Bill Breakdown */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-surface-container-high/40">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Chi tiết hóa đơn
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  Đã bao gồm VAT
                </span>
              </div>
              <div className="flex items-center justify-between text-on-surface">
                <span className="font-body-md text-body-md text-on-surface-variant">
                  Tiền món ăn (3 món)
                </span>
                <span className="font-body-md text-body-md font-medium">
                  {itemsSubtotal.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex items-center justify-between text-on-surface">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <span className="font-body-md text-body-md">Phí giao hàng (1.8 km)</span>
                  <span className="material-symbols-outlined text-[15px] text-tertiary">info</span>
                </div>
                <span className="font-body-md text-body-md font-medium">
                  {shippingFee.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex items-center justify-between text-on-surface">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <span className="font-body-md text-body-md">Phí dịch vụ &amp; đóng gói</span>
                  <span className="material-symbols-outlined text-[15px] text-tertiary">info</span>
                </div>
                <span className="font-body-md text-body-md font-medium">
                  {serviceFee.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex items-center justify-between text-secondary">
                <span className="font-body-md text-body-md">Giảm giá món ăn (THUNDERNEW)</span>
                <span className="font-body-md text-body-md font-semibold">-25.000đ</span>
              </div>
              <div className="flex items-center justify-between text-primary">
                <span className="font-body-md text-body-md">Giảm phí vận chuyển (FREESHIP15K)</span>
                <span className="font-body-md text-body-md font-semibold">-15.000đ</span>
              </div>
              {paymentMethodDiscount > 0 && (
                <div className="flex items-center justify-between text-primary font-semibold">
                  <span className="font-body-md text-body-md">Ưu đãi phương thức thanh toán</span>
                  <span className="font-body-md text-body-md">
                    -{paymentMethodDiscount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-surface-container-high my-1" />

              <div className="flex items-end justify-between pt-1">
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Tổng cộng thanh toán
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">savings</span>
                    Tiết kiệm được {totalDiscount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-body-sm text-body-sm text-on-surface-variant line-through">
                    {originalTotal.toLocaleString('vi-VN')}đ
                  </div>
                  <div className="font-headline-lg text-headline-lg text-primary font-extrabold leading-none">
                    {finalTotal.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              </div>
            </div>

            {/* Friendly Reassurance */}
            <div className="flex items-center justify-center gap-1.5 text-on-surface-variant py-2">
              <span className="material-symbols-outlined text-[16px] text-primary">shield</span>
              <span className="font-body-sm text-body-sm">
                Được bảo vệ bởi cam kết Giao đúng giờ hoặc hoàn tiền
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* 7. Fixed Footer Checkout Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-safe border-t border-surface-container">
        <div className="max-w-xl mx-auto px-gutter pt-3 pb-3 flex flex-col gap-2.5">
          {/* Price & Method Strip */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#A50064] text-white flex items-center justify-center font-bold text-[10px]">
                M
              </div>
              <span className="font-label-md text-label-md text-on-surface font-medium">
                {paymentMethod.name} •••• 888
              </span>
              <span className="font-label-sm text-label-sm text-primary font-bold">(Đã kết nối)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-body-sm text-body-sm text-on-surface-variant line-through">
                {originalTotal.toLocaleString('vi-VN')}đ
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                {finalTotal.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            disabled={orderState !== 'idle'}
            className="w-full h-13 py-3.5 px-space-lg rounded-xl bg-primary-container text-on-primary font-headline-sm text-headline-sm flex items-center justify-between shadow-md active:scale-[0.98] transition-all hover:bg-primary cursor-pointer disabled:opacity-90 font-bold"
            onClick={handlePlaceOrder}
          >
            {orderState === 'loading' ? (
              <div className="flex items-center justify-center gap-2 w-full">
                <span className="material-symbols-outlined animate-spin text-[22px]">
                  progress_activity
                </span>
                <span>Đang tạo đơn hàng...</span>
              </div>
            ) : orderState === 'success' ? (
              <div className="flex items-center justify-center gap-2 w-full text-on-primary">
                <span className="material-symbols-outlined text-[24px]">check_circle</span>
                <span>Đặt đơn thành công!</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
                  <span>Đặt đơn ngay</span>
                </div>
                <div className="flex items-center gap-1 font-bold font-headline-sm text-headline-sm">
                  <span>{finalTotal.toLocaleString('vi-VN')}đ</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </div>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Address Selector Modal */}
      <AddressSelectorModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        selectedAddressId={selectedAddress.id}
        onSelectAddress={(addr) => setSelectedAddress(addr)}
        restaurantName="Cơm Tấm Sà Bì Chưởng"
      />

      {/* Payment Method Modal */}
      <PaymentMethodModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedMethodId={paymentMethod.id}
        onSelectMethod={(id, name, extraDiscount) => {
          setPaymentMethod({ id, name, extraDiscount });
        }}
        totalAmount={finalTotal}
      />

      {/* Success Modal Dialogue if Order Placed */}
      {orderState === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span
                className="material-symbols-outlined text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Đặt đơn thành công!</h3>
              <p className="text-sm text-gray-500 mt-1">
                Cơm Tấm Sà Bì Chưởng đang chuẩn bị món ăn cho bạn. Shipper sẽ nhận đơn trong ít phút.
              </p>
            </div>
            <div className="w-full bg-gray-50 p-3 rounded-2xl text-left text-xs text-gray-600 flex flex-col gap-1 border border-gray-100">
              <div className="flex justify-between">
                <span>Mã đơn:</span>
                <span className="font-bold text-gray-800">#THUNDER-8829</span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian dự kiến:</span>
                <span className="font-semibold text-primary">20 - 25 phút</span>
              </div>
              <div className="flex justify-between">
                <span>Tổng thanh toán:</span>
                <span className="font-bold text-primary text-sm">
                  {finalTotal.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full pt-2">
              <button
                type="button"
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-container shadow-md cursor-pointer"
                onClick={() => navigate(APP_ROUTES.HOME)}
              >
                Về trang chủ
              </button>
              <button
                type="button"
                className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 cursor-pointer"
                onClick={() => setOrderState('idle')}
              >
                Xem lại đơn hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
