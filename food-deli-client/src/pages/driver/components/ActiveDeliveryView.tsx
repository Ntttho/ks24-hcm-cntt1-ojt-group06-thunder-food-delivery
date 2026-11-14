import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertCircle,
  Bike,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  DollarSign,
  ExternalLink,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  Phone,
} from '../icons';
import { DriverOrder } from '@/services/modules/driverApi';
import {
  RouteMapFocus,
  DriverChatMessage,
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsEmbedUrl,
  createDriverChatMessage,
  getDeliveryStageInfo,
  loadOrderChatMessages,
  saveOrderChatMessages,
} from '../deliveryHelpers';
import { DriverCustomerChatModal } from './DriverCustomerChatModal';
import { chatApi, type ChatMessage } from '@/services/modules/chatApi';
import { orderLiveTrackingWs } from '@/services/modules/orderLiveTrackingWebSocket';

interface ActiveDeliveryViewProps {
  order: DriverOrder;
  isUpdatingStatus: boolean;
  onConfirmPickupAndDeliver: () => void;
  onCompleteDelivery: () => void;
  onOpenReturnModal: () => void;
}

const formatPaymentLabel = (order: DriverOrder): string => {
  if (order.codAmount > 0) {
    return `Thu tiền mặt COD: ${order.codAmount.toLocaleString('vi-VN')} đ`;
  }
  switch ((order.paymentMethod || '').toUpperCase()) {
    case 'SEPAY':
    case 'VIETQR':
      return 'Đã thanh toán SePay / VietQR (0đ COD)';
    case 'VNPAY':
      return 'Đã thanh toán VNPAY (0đ COD)';
    case 'WALLET':
    case 'E_WALLET':
      return 'Đã thanh toán Ví điện tử (0đ COD)';
    case 'UNKNOWN':
      return 'Thanh toán qua hệ thống';
    default:
      return 'Đã thanh toán Online (0đ COD)';
  }
};

export const ActiveDeliveryView: React.FC<ActiveDeliveryViewProps> = ({
  order,
  isUpdatingStatus,
  onConfirmPickupAndDeliver,
  onCompleteDelivery,
  onOpenReturnModal,
}) => {
  const stageInfo = useMemo(() => getDeliveryStageInfo(order.statusCode), [order.statusCode]);

  const [manualMapOverride, setManualMapOverride] = useState<{
    stage: string;
    mode: RouteMapFocus;
  } | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // Realtime STOMP & API Chat Sync for order
  useEffect(() => {
    if (!order.id) return;

    chatApi.getOrderChatHistory(order.id).then((res) => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setChatMessages(res.data);
      } else {
        setChatMessages(loadOrderChatMessages(order.id));
      }
    }).catch(() => {
      setChatMessages(loadOrderChatMessages(order.id));
    });

    orderLiveTrackingWs.connect(order.id);

    const unsubscribe = orderLiveTrackingWs.subscribeChatMessages((newMsg) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [order.id]);

  // Tự động đồng bộ tab bản đồ theo mốc hiện tại (Mốc 1: Quán ăn, Mốc 2: Khách hàng)
  const mapFocus: RouteMapFocus =
    manualMapOverride && manualMapOverride.stage === stageInfo.stage
      ? manualMapOverride.mode
      : stageInfo.stage === 'DELIVERING'
        ? 'dropoff'
        : 'pickup';

  const handleSelectMapFocus = (mode: RouteMapFocus) => {
    setManualMapOverride({ stage: stageInfo.stage, mode });
    setIsMapExpanded(true);
  };

  const handleSendChatMessage = async (text: string) => {
    const localMsg = createDriverChatMessage(order.id, text);
    setChatMessages((prev) => [...prev, localMsg]);

    try {
      await chatApi.sendMessage({
        orderId: order.id,
        senderRole: 'DRIVER',
        message: text,
      });
      orderLiveTrackingWs.sendChatMessageViaWs({
        orderId: order.id,
        senderRole: 'DRIVER',
        message: text,
      });
    } catch {
      saveOrderChatMessages(order.id, [...chatMessages, localMsg]);
    }
  };

  const pickupDirectionsUrl = useMemo(
    () =>
      buildGoogleMapsDirectionsUrl({
        destinationLat: order.restaurantLat,
        destinationLng: order.restaurantLng,
        destinationAddress: order.restaurantAddress,
      }),
    [order.restaurantLat, order.restaurantLng, order.restaurantAddress]
  );

  const dropoffDirectionsUrl = useMemo(
    () =>
      buildGoogleMapsDirectionsUrl({
        destinationLat: order.receiverLat,
        destinationLng: order.receiverLng,
        destinationAddress: order.receiverAddress,
      }),
    [order.receiverLat, order.receiverLng, order.receiverAddress]
  );

  const fullRouteDirectionsUrl = useMemo(
    () =>
      buildGoogleMapsDirectionsUrl({
        originLat: order.restaurantLat,
        originLng: order.restaurantLng,
        originAddress: order.restaurantAddress,
        destinationLat: order.receiverLat,
        destinationLng: order.receiverLng,
        destinationAddress: order.receiverAddress,
      }),
    [
      order.restaurantLat,
      order.restaurantLng,
      order.restaurantAddress,
      order.receiverLat,
      order.receiverLng,
      order.receiverAddress,
    ]
  );

  const mapEmbedUrl = useMemo(
    () =>
      buildGoogleMapsEmbedUrl({
        mode: mapFocus,
        pickupLat: order.restaurantLat,
        pickupLng: order.restaurantLng,
        pickupAddress: order.restaurantAddress,
        dropoffLat: order.receiverLat,
        dropoffLng: order.receiverLng,
        dropoffAddress: order.receiverAddress,
      }),
    [
      mapFocus,
      order.restaurantLat,
      order.restaurantLng,
      order.restaurantAddress,
      order.receiverLat,
      order.receiverLng,
      order.receiverAddress,
    ]
  );

  const isPickupStage = stageInfo.stage === 'PICKUP';
  const isDeliveringStage = stageInfo.stage === 'DELIVERING';
  const primaryNavigationUrl = isDeliveringStage ? dropoffDirectionsUrl : pickupDirectionsUrl;
  const primaryNavigationLabel = isDeliveringStage
    ? 'Mở Google Maps giao cho Khách'
    : 'Mở Google Maps tới Quán lấy món';

  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200 pb-6">
      {/* 1. Hero Milestone Progress Header */}
      <section
        aria-label="Tiến trình cuốc xe hiện tại"
        className={`text-white p-4 rounded-3xl shadow-lg transition-colors duration-300 ${
          isDeliveringStage
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/25'
            : 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-500/25'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-white/20 p-2 rounded-2xl shrink-0">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/85 block">
                TIẾN TRÌNH CUỐC XE
              </span>
              <h2 className="text-base font-black leading-tight truncate">#{order.orderCode}</h2>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-white/85 block">Cước nhận • {order.distanceKm} km</span>
            <span className="text-lg font-black">+{order.shippingFee.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>

        {/* 3-Node Visual Milestone Stepper */}
        <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
          <div className="py-1.5 px-1 rounded-xl bg-white/15 text-white flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Nhận đơn</span>
          </div>
          <div
            className={`py-1.5 px-1 rounded-xl transition-all flex items-center justify-center gap-1 ${
              isPickupStage
                ? 'bg-white text-orange-700 shadow-sm'
                : 'bg-white/20 text-white'
            }`}
          >
            {isDeliveringStage && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
            <span>1. Lấy món</span>
          </div>
          <div
            className={`py-1.5 px-1 rounded-xl transition-all flex items-center justify-center gap-1 ${
              isDeliveringStage
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'bg-white/10 text-white/80'
            }`}
          >
            <span>2. Giao khách</span>
          </div>
        </div>

        {/* Active Stage Banner */}
        <div className="mt-3 bg-black/15 rounded-2xl px-3 py-2 text-left">
          <p className="text-xs font-black">{stageInfo.title}</p>
          <p className="text-[11px] text-white/90 mt-0.5 leading-snug">{stageInfo.subtitle}</p>
        </div>
      </section>

      {/* 2. Embedded Route Map & Google Maps Shortcuts */}
      <section
        aria-label="Bản đồ lộ trình và dẫn đường"
        className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80 space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-900">
            <MapPin className="w-4 h-4 text-orange-500" />
            <h3 className="text-xs font-black uppercase tracking-wide">Bản đồ lộ trình</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsMapExpanded((prev) => !prev)}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <span>{isMapExpanded ? 'Thu gọn' : 'Mở bản đồ'}</span>
            {isMapExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Map View Selector */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
          {(
            [
              { mode: 'pickup', label: 'Quán ăn', activeClass: 'bg-white text-orange-600 shadow-xs' },
              {
                mode: 'dropoff',
                label: 'Khách hàng',
                activeClass: 'bg-white text-emerald-700 shadow-xs',
              },
              {
                mode: 'route',
                label: 'Toàn tuyến',
                activeClass: 'bg-white text-blue-700 shadow-xs',
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.mode}
              type="button"
              onClick={() => handleSelectMapFocus(tab.mode)}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                mapFocus === tab.mode ? tab.activeClass : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isMapExpanded && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
            {mapEmbedUrl ? (
              <iframe
                title={`Bản đồ giao hàng đơn ${order.orderCode}`}
                src={mapEmbedUrl}
                className="w-full h-48 border-0 block"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="h-36 flex items-center justify-center text-xs text-slate-500 p-4 text-center">
                Chưa có tọa độ hoặc địa chỉ chi tiết để hiển thị bản đồ.
              </div>
            )}
          </div>
        )}

        {/* Google Maps One-Tap Shortcuts */}
        <div className="flex items-center gap-2">
          <a
            href={primaryNavigationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 shadow-sm transition-all ${
              isDeliveringStage
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{primaryNavigationLabel}</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>

          <a
            href={fullRouteDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Mở toàn lộ trình Quán -> Khách trên Google Maps"
            className="py-2.5 px-3 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 shrink-0 transition-all"
          >
            <span>Toàn tuyến</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </section>

      {/* 3. Pickup & Delivery Contact Cards + Items + COD */}
      <section
        aria-label="Thông tin quán ăn, khách hàng và thanh toán"
        className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80 space-y-4"
      >
        {/* Step 1: Restaurant Card */}
        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            isPickupStage
              ? 'bg-orange-50/70 border-orange-300 shadow-xs'
              : 'bg-slate-50 border-slate-200 opacity-90'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-700">
              1. ĐIỂM LẤY MÓN (QUÁN ĂN)
            </span>
            {isDeliveringStage && (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                Đã lấy món
              </span>
            )}
          </div>

          <h4 className="font-black text-slate-900 text-sm">{order.restaurantName}</h4>
          <p className="text-xs text-slate-600 mt-0.5 leading-snug">{order.restaurantAddress}</p>
          {order.restaurantPhone && (
            <p className="text-[11px] font-semibold text-slate-500 mt-1">
              SĐT Quán: {order.restaurantPhone}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {order.restaurantPhone ? (
              <a
                href={`tel:${order.restaurantPhone}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Gọi quán</span>
              </a>
            ) : (
              <span className="bg-slate-200/70 text-slate-500 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>Quán chưa có SĐT</span>
              </span>
            )}

            <a
              href={pickupDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Maps Quán</span>
            </a>
          </div>
        </div>

        {/* Step 2: Customer Card */}
        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            isDeliveringStage
              ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">
              2. ĐIỂM GIAO MÓN (KHÁCH HÀNG)
            </span>
            {isDeliveringStage && (
              <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                Đang giao
              </span>
            )}
          </div>

          <h4 className="font-black text-slate-900 text-sm">
            {order.receiverName}
            {order.receiverPhone ? ` • ${order.receiverPhone}` : ''}
          </h4>
          <p className="text-xs text-slate-600 mt-0.5 leading-snug">{order.receiverAddress}</p>

          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {order.receiverPhone && (
              <a
                href={`tel:${order.receiverPhone}`}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Gọi khách</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Chat với khách</span>
              {chatMessages.length > 0 && (
                <span className="bg-white text-blue-700 text-[10px] font-black px-1.5 rounded-full">
                  {chatMessages.length}
                </span>
              )}
            </button>

            <a
              href={dropoffDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Maps Khách</span>
            </a>
          </div>
        </div>

        {/* Items & Notes */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <span>Chi tiết món ({order.items.length})</span>
            </span>
            <span className="text-slate-500">Tổng đơn: {order.totalAmount.toLocaleString('vi-VN')} đ</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl space-y-1.5 text-xs">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-slate-800 gap-2">
                <span className="font-medium">
                  {item.quantity}x {item.name}
                  {item.toppings && item.toppings.length > 0 && (
                    <span className="text-[11px] text-slate-500 block">
                      + {item.toppings.join(', ')}
                    </span>
                  )}
                </span>
                <span className="font-bold shrink-0">
                  {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                </span>
              </div>
            ))}

            {order.note && (
              <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-xl flex items-start gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                <span>Ghi chú: {order.note}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment / COD Info Box */}
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs border ${
            order.codAmount > 0
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <DollarSign
              className={`w-4 h-4 shrink-0 ${
                order.codAmount > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            />
            <div>
              <span className="font-black block">
                {order.codAmount > 0
                  ? 'TIỀN MẶT CẦN THU (COD)'
                  : 'ĐƠN ĐÃ THANH TOÁN (0đ COD)'}
              </span>
              <span className="text-[11px] opacity-85">{formatPaymentLabel(order)}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-base font-black">
              {order.codAmount > 0 ? `${order.codAmount.toLocaleString('vi-VN')} đ` : '0 đ'}
            </span>
          </div>
        </div>
      </section>

      {/* 4. One-Tap Milestone Action Buttons (SP3-DRV-04) */}
      <section aria-label="Thao tác chuyển trạng thái cuốc xe" className="space-y-2.5 pt-1">
        {isPickupStage && (
          <>
            <button
              type="button"
              onClick={onConfirmPickupAndDeliver}
              disabled={isUpdatingStatus}
              className="w-full py-4 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <span>
                {isUpdatingStatus ? 'ĐANG CẬP NHẬT SANG DELIVERING...' : 'TÔI ĐÃ ĐẾN QUÁN LẤY MÓN'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {stageInfo.canReturnOrder && (
              <button
                type="button"
                onClick={onOpenReturnModal}
                disabled={isUpdatingStatus}
                className="w-full py-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs rounded-2xl transition-all cursor-pointer disabled:opacity-60"
              >
                Trả đơn / Không thể giao đơn này
              </button>
            )}
          </>
        )}

        {isDeliveringStage && (
          <>
            <button
              type="button"
              onClick={onCompleteDelivery}
              disabled={isUpdatingStatus}
              className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <CheckCircle className="w-5 h-5" />
              <span>
                {isUpdatingStatus
                  ? 'ĐANG HOÀN TẤT ĐƠN...'
                  : 'GIAO THÀNH CÔNG & THU TIỀN COD'}
              </span>
            </button>

            <p className="text-[11px] text-center text-slate-500 font-medium px-2">
              {order.codAmount > 0
                ? `Xác nhận đã giao tận tay và thu đủ ${order.codAmount.toLocaleString('vi-VN')} đ tiền mặt COD.`
                : 'Đơn đã thanh toán trước — xác nhận đã giao tận tay khách (0 đ COD).'}
            </p>
          </>
        )}
      </section>

      {/* Floating Chat Trigger Button (Quick Access) */}
      {!isChatOpen && (
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-5 right-5 z-40 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-full shadow-xl shadow-blue-600/30 font-black text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          title="Mở khung Chat trực tiếp với Khách hàng"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chat khách</span>
          {chatMessages.length > 0 && (
            <span className="bg-white text-blue-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {chatMessages.length}
            </span>
          )}
        </button>
      )}

      {/* Floating Chat Modal */}
      <DriverCustomerChatModal
        open={isChatOpen}
        order={order}
        messages={chatMessages}
        onClose={() => setIsChatOpen(false)}
        onSendMessage={handleSendChatMessage}
      />
    </div>
  );
};
