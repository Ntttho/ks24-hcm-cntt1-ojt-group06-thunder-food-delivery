import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { orderApi, type CreateOrderPayload } from '@/services/modules/orderApi';
import { addressApi } from '@/services/modules/addressApi';
import { paymentApi, type SepayGenerateResponse } from '@/services/modules/paymentApi';
import { type VoucherItem } from '@/services/modules/restaurantApi';
import {
  adminSettingsApi,
  DEFAULT_ORDER_COST_CONFIG,
  type OrderCostConfig,
} from '@/services/modules/adminSettingsApi';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAuth } from '@/hooks/useAuth';
import { clearPurchasedItems } from '@/store/slices/cartSlice';
import { APP_ROUTES } from '@/constants';
import { AddressSelectorModal } from '../../components/AddressSelectorModal';
import type { DeliveryAddressItem } from '../types';
import {
  CheckoutHeader,
  CheckoutCountdownBanner,
  CheckoutAddressCard,
  CheckoutDeliverySpeed,
  CheckoutOrderItems,
  CheckoutVoucherCard,
  CheckoutPaymentCard,
  CheckoutPriceSummary,
  CheckoutBottomBar,
  CheckoutSuccessModal,
  SepayQrPaymentModal,
  PaymentMethodModal,
  VoucherSelectorModal,
} from './components';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const cart = useAppSelector((state) => state.cart);

  // If cart empty, redirect
  useEffect(() => {
    if (!cart.items || cart.items.length === 0) {
      message.info('Giỏ hàng của bạn đang trống');
      navigate(APP_ROUTES.CART);
    }
  }, [cart.items, navigate]);

  // Selected items from Cart (Shopee style - only items marked selected)
  const selectedItems = useMemo(() => {
    const selected = (cart.items || []).filter((it) => it.selected !== false);
    return selected.length > 0 ? selected : cart.items || [];
  }, [cart.items]);

  // Restaurant ID and Name of the active shop
  const activeRestaurantId = useMemo(() => {
    if (selectedItems.length > 0) return selectedItems[0].shopId;
    return cart.shopId || 1;
  }, [selectedItems, cart.shopId]);

  const currentShopName = useMemo(() => {
    if (selectedItems.length > 0) return selectedItems[0].shopName;
    return cart.shopName || 'Thunder Food Delivery';
  }, [selectedItems, cart.shopName]);

  // Modals
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isSepayModalOpen, setIsSepayModalOpen] = useState(false);
  const [sepayQrData, setSepayQrData] = useState<SepayGenerateResponse | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<number>(0);
  const [createdOrderCode, setCreatedOrderCode] = useState<string>('');

  // Applied Voucher State (Only 1 voucher per order)
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherItem | null>(null);

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
    id: 'addr-default',
    label: 'Nhà riêng',
    title: 'Địa chỉ nhận hàng',
    fullAddress: '720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM',
    recipientName: user?.fullName || 'Khách hàng',
    phone: user?.phone || '0909 000 888',
    isDefault: true,
  });

  // Fetch real user addresses on mount
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const res = await addressApi.getMyAddresses();
        const list = res?.data;
        if (list && list.length > 0) {
          const def = list.find((a) => a.isDefault) || list[0];
          setSelectedAddress({
            id: String(def.id),
            label: def.label || 'Địa chỉ',
            title: user?.fullName || 'Địa chỉ nhận hàng',
            fullAddress: def.address || '720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM',
            recipientName: user?.fullName || 'Khách hàng',
            phone: user?.phone || '0909 000 888',
            isDefault: Boolean(def.isDefault),
          });
        }
      } catch {
        // Keep fallback address
      }
    };
    loadAddresses();
  }, [user]);

  // Drop-off spot: 'door' | 'lobby' | 'curb'
  const [dropoffSpot, setDropoffSpot] = useState<'door' | 'lobby' | 'curb'>('door');

  // Driver notes & quick chips
  const [driverNote, setDriverNote] = useState('Gọi trước khi đến 5 phút');
  const [isEditingDriverNote, setIsEditingDriverNote] = useState(false);

  // Delivery speed: 'priority' | 'standard' | 'schedule'
  const [deliverySpeed, setDeliverySpeed] = useState<'priority' | 'standard' | 'schedule'>('priority');

  // Order items collapsible
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(true);

  // Kitchen notes
  const [kitchenNote, setKitchenNote] = useState('');
  const [selectedKitchenChips, setSelectedKitchenChips] = useState<string[]>([]);

  // Payment Method: Default to VietQR Napas 247 (SePay)
  const [paymentMethod, setPaymentMethod] = useState<{
    id: string;
    name: string;
    extraDiscount: number;
  }>({
    id: 'vietqr',
    name: 'Chuyển khoản VietQR (Napas 247)',
    extraDiscount: 0,
  });

  // Submission State
  const [orderState, setOrderState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [orderCostConfig, setOrderCostConfig] = useState<OrderCostConfig>(DEFAULT_ORDER_COST_CONFIG);

  useEffect(() => {
    let active = true;
    adminSettingsApi
      .getPublicOrderFeeConfig()
      .then((res) => {
        if (active && res?.data) {
          setOrderCostConfig({
            baseKm: Number(res.data.baseKm ?? DEFAULT_ORDER_COST_CONFIG.baseKm),
            baseFee: Number(res.data.baseFee ?? DEFAULT_ORDER_COST_CONFIG.baseFee),
            extraPerKm: Number(res.data.extraPerKm ?? DEFAULT_ORDER_COST_CONFIG.extraPerKm),
            priorityFee: Number(res.data.priorityFee ?? DEFAULT_ORDER_COST_CONFIG.priorityFee),
            serviceFee: Number(res.data.serviceFee ?? DEFAULT_ORDER_COST_CONFIG.serviceFee),
            vatRate: Number(res.data.vatRate ?? DEFAULT_ORDER_COST_CONFIG.vatRate),
            vatIncluded: res.data.vatIncluded ?? DEFAULT_ORDER_COST_CONFIG.vatIncluded,
          });
        }
      })
      .catch(() => {
        // Fallback silently to defaults
      });
    return () => {
      active = false;
    };
  }, []);

  // Real Items from Selected Cart Items
  const orderItemsData = useMemo(() => {
    return selectedItems.map((it) => ({
      id: it.id,
      name: it.productName,
      quantity: it.quantity,
      price: it.price,
      toppings: it.toppings?.map((t) => `${t.name} (+${t.price.toLocaleString('vi-VN')}đ)`),
    }));
  }, [selectedItems]);

  // Pricing calculations
  const itemsSubtotal = useMemo(() => {
    return selectedItems.reduce((sum, it) => {
      const topTotal = (it.toppings || []).reduce((ts, t) => ts + t.price, 0);
      return sum + (it.price + topTotal) * it.quantity;
    }, 0);
  }, [selectedItems]);

  const checkoutDistanceKm = 1.8;
  const baseShippingFee = useMemo(() => {
    if (selectedItems.length === 0) return 0;
    const extraKm =
      checkoutDistanceKm > orderCostConfig.baseKm
        ? Math.ceil(checkoutDistanceKm - orderCostConfig.baseKm)
        : 0;
    return orderCostConfig.baseFee + extraKm * orderCostConfig.extraPerKm;
  }, [selectedItems.length, orderCostConfig]);

  const shippingFee = baseShippingFee;
  const serviceFee = 0;
  const vatAmount = 0;

  // Single Voucher Calculation
  const voucherDiscount = useMemo(() => {
    if (!appliedVoucher) return 0;
    const minVal = appliedVoucher.minOrderValue || 0;
    if (itemsSubtotal < minVal) return 0;

    if (appliedVoucher.discountType === 'PERCENTAGE') {
      const calc = (itemsSubtotal * appliedVoucher.discountValue) / 100;
      if (appliedVoucher.maxDiscountAmount && appliedVoucher.maxDiscountAmount > 0) {
        return Math.min(calc, appliedVoucher.maxDiscountAmount);
      }
      return calc;
    }
    return appliedVoucher.discountValue || appliedVoucher.discountAmount || 0;
  }, [appliedVoucher, itemsSubtotal]);

  const paymentMethodDiscount = paymentMethod.extraDiscount;
  const totalDiscount = voucherDiscount + paymentMethodDiscount;
  const originalTotal = itemsSubtotal + shippingFee + serviceFee + vatAmount;
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

  const handlePlaceOrder = async () => {
    if (selectedItems.length === 0) {
      message.warning('Vui lòng tích chọn ít nhất 1 món ăn để thanh toán!');
      navigate(APP_ROUTES.CART);
      return;
    }

    setOrderState('loading');
    try {
      const kitchenParts = [kitchenNote.trim(), selectedKitchenChips.join(', ')].filter(Boolean).join(' - ');
      const fullNote = [
        kitchenParts ? `[Quán: ${kitchenParts}]` : '',
        driverNote.trim() ? `[Tài xế: ${driverNote.trim()}]` : '',
      ]
        .filter(Boolean)
        .join(' • ');

      const createPayload: CreateOrderPayload = {
        restaurantId: Number(activeRestaurantId) || 1,
        customerName: selectedAddress?.recipientName || (user as any)?.fullName || 'Khách hàng',
        customerPhone: selectedAddress?.phone || (user as any)?.phone || '0900000001',
        receiverAddress: selectedAddress?.fullAddress || '720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM',
        receiverLat: 10.795,
        receiverLng: 106.721,
        distanceKm: checkoutDistanceKm,
        deliverySpeed,
        voucherId: appliedVoucher?.id || undefined,
        note: fullNote,
        items: selectedItems.map((it) => ({
          foodId: Number(it.productId),
          quantity: it.quantity,
          toppings: (it.toppings || []).map((tp) => ({ toppingId: tp.id, quantity: 1 })),
        })),
        paymentMethod: paymentMethod.id === 'vietqr' ? 'WALLET' : 'COD',
      };

      const res = await orderApi.create(createPayload);
      const createdData = res?.data;
      if (!createdData || !createdData.id) {
        throw new Error('Không nhận được dữ liệu xác nhận đơn hàng từ máy chủ');
      }

      const orderId = createdData.id;
      const orderCode = createdData.orderCode || `#ORD-${orderId}`;

      setCreatedOrderId(orderId);
      setCreatedOrderCode(orderCode);

      // Loại bỏ ngay lập tức những món ăn đã order và bấm thanh toán khỏi giỏ hàng
      const purchasedIds = selectedItems.map((it) => it.id);
      dispatch(clearPurchasedItems(purchasedIds));

      if (paymentMethod.id === 'vietqr') {
        // SePay VietQR Flow: AWAITING_PAYMENT, wait for balance change
        try {
          const qrRes = await paymentApi.generateSepayQr({
            orderId,
            amount: finalTotal,
            orderInfo: `FOODDELI ORD${orderId}`,
          });
          setSepayQrData(qrRes.data);
        } catch (qrErr) {
          console.warn('SePay QR generation notice:', qrErr);
        }
        setIsSepayModalOpen(true);
        setOrderState('idle');
      } else {
        // COD Flow
        try {
          await paymentApi.createCod(orderId, finalTotal);
        } catch {
          // Proceed
        }
        setOrderState('success');
      }
    } catch (error: any) {
      console.error('Order creation failed:', error);
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng kiểm tra lại!';
      message.error(errMsg);
      setOrderState('idle');
    }
  };

  return (
    <div className="bg-gray-50 flex flex-col min-h-screen font-sans">
      {/* 1. Top Header with Hover Animation & Click Home */}
      <CheckoutHeader shopName={currentShopName} distance={`${checkoutDistanceKm} km`} />

      {/* Main Body */}
      <main className="flex-1 w-full pt-16 pb-36">
        <div className="max-w-xl mx-auto w-full flex flex-col">
          {/* 2. Status Micro-Banner with Countdown */}
          <CheckoutCountdownBanner countdownText={formatTimer(countdown)} />

          <div className="p-4 flex flex-col gap-3">
            {/* 3. Delivery Address Card */}
            <CheckoutAddressCard
              selectedAddress={selectedAddress}
              dropoffSpot={dropoffSpot}
              onSelectDropoffSpot={setDropoffSpot}
              driverNote={driverNote}
              isEditingDriverNote={isEditingDriverNote}
              onToggleEditDriverNote={() => setIsEditingDriverNote(!isEditingDriverNote)}
              onChangeDriverNote={setDriverNote}
              onAppendDriverTag={handleAppendDriverTag}
              onOpenAddressModal={() => setIsAddressModalOpen(true)}
            />

            {/* 4. Delivery Speed Options */}
            <CheckoutDeliverySpeed
              deliverySpeed={deliverySpeed}
              onSelectDeliverySpeed={setDeliverySpeed}
              distance={`${checkoutDistanceKm} km`}
              priorityFee={orderCostConfig.priorityFee}
            />

            {/* 5. Order Summary Card (Real items from Redux) */}
            <CheckoutOrderItems
              isOrderSummaryOpen={isOrderSummaryOpen}
              onToggleSummary={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
              kitchenNote={kitchenNote}
              onChangeKitchenNote={setKitchenNote}
              selectedKitchenChips={selectedKitchenChips}
              onToggleKitchenChip={handleToggleKitchenChip}
              subtotal={itemsSubtotal}
              items={orderItemsData}
              shopName={currentShopName}
            />

            {/* 6. Vouchers & Promotions Box (Supports selecting 1 dynamic voucher) */}
            <CheckoutVoucherCard
              totalDiscount={voucherDiscount}
              appliedVoucher={appliedVoucher}
              onOpenVoucherPicker={() => setIsVoucherModalOpen(true)}
              onRemoveVoucher={() => setAppliedVoucher(null)}
            />

            {/* 7. Payment Method Selector */}
            <CheckoutPaymentCard
              paymentMethod={paymentMethod}
              onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
              onSelectMethodQuick={(id, name) => setPaymentMethod({ id, name, extraDiscount: 0 })}
            />

            {/* 8. Bill Breakdown */}
            <CheckoutPriceSummary
              itemsSubtotal={itemsSubtotal}
              shippingFee={shippingFee}
              serviceFee={serviceFee}
              vatAmount={vatAmount}
              vatIncluded={orderCostConfig.vatIncluded}
              totalDiscount={totalDiscount}
              originalTotal={originalTotal}
              finalTotal={finalTotal}
              itemCount={selectedItems.length}
              paymentMethodDiscount={paymentMethodDiscount}
            />

            {/* Friendly Reassurance */}
            <div className="flex items-center justify-center gap-1.5 text-gray-400 py-2 text-xs">
              <span className="material-symbols-outlined text-[15px] text-orange-500">shield</span>
              <span>Được bảo vệ bởi cam kết Giao đúng giờ hoặc hoàn tiền Thunder Food</span>
            </div>
          </div>
        </div>
      </main>

      {/* 9. Fixed Footer Checkout Dock */}
      <CheckoutBottomBar
        paymentMethodName={paymentMethod.name}
        originalTotal={originalTotal}
        finalTotal={finalTotal}
        orderState={orderState}
        onPlaceOrder={handlePlaceOrder}
      />

      {/* 10. Address Selector Modal */}
      <AddressSelectorModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        selectedAddressId={selectedAddress.id}
        onSelectAddress={(addr: DeliveryAddressItem) => setSelectedAddress(addr)}
        restaurantName={currentShopName}
      />

      {/* 11. Payment Method Modal */}
      <PaymentMethodModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedMethodId={paymentMethod.id}
        onSelectMethod={(id: string, name: string, extraDiscount?: number) => {
          setPaymentMethod({ id, name, extraDiscount: extraDiscount || 0 });
        }}
        totalAmount={finalTotal}
      />

      {/* 12. Dynamic Single Voucher Selector Modal */}
      <VoucherSelectorModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        restaurantId={Number(activeRestaurantId) || 1}
        subtotal={itemsSubtotal}
        appliedVoucher={appliedVoucher}
        onSelectVoucher={(v) => setAppliedVoucher(v)}
      />

      {/* 13. SePay VietQR Modal with Dynamic QR & Live Polling (8 mins) */}
      <SepayQrPaymentModal
        isOpen={isSepayModalOpen}
        onClose={() => setIsSepayModalOpen(false)}
        qrData={sepayQrData}
        orderId={createdOrderId}
        totalAmount={finalTotal}
      />

      {/* 14. Success Modal Dialogue if COD Order Placed -> Redirect to Home */}
      <CheckoutSuccessModal
        isOpen={orderState === 'success'}
        finalTotal={finalTotal}
        onReset={() => {
          setOrderState('idle');
          navigate('/');
        }}
        shopName={currentShopName}
        orderCode={createdOrderCode}
      />
    </div>
  );
};

export default CheckoutPage;
