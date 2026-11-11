import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { message, Modal, Tag, Input } from 'antd';
import {
  Bike,
  Power,
  Navigation,
  Clock,
  Wallet,
  Star,
  Award,
  TrendingUp,
  Phone,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Package,
} from './icons';
import { useAuth } from '@/hooks/useAuth';
import {
  driverApi,
  DriverOrder,
  DriverWalletSummary,
  DriverReviewSummary,
} from '@/services/modules/driverApi';
import { APP_ROUTES } from '@/constants';

const formatTimeOnly = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const formatPaymentLabel = (order: DriverOrder): string => {
  if (order.codAmount > 0) {
    return `Ứng COD: ${order.codAmount.toLocaleString('vi-VN')} đ`;
  }
  switch ((order.paymentMethod || '').toUpperCase()) {
    case 'SEPAY':
    case 'VIETQR':
      return 'Đã trả SePay (0đ COD)';
    case 'VNPAY':
      return 'Đã trả VNPAY (0đ COD)';
    case 'WALLET':
    case 'E_WALLET':
      return 'Đã trả Ví (0đ COD)';
    case 'UNKNOWN':
      return 'Thanh toán qua hệ thống';
    default:
      return 'Đã trả Online (0đ COD)';
  }
};

export const ShipperHubPage: React.FC = () => {
  const { user } = useAuth();

  // Navigation tab for Hub
  const [activeTab, setActiveTab] = useState<'deliveries' | 'wallet' | 'reviews'>('deliveries');

  // Driver operational state
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [availableOrders, setAvailableOrders] = useState<DriverOrder[]>([]);
  const [loadingRadar, setLoadingRadar] = useState<boolean>(false);
  const [radarError, setRadarError] = useState<string | null>(null);
  const dismissedOrderIdsRef = useRef<Set<number>>(new Set());

  // Single Active Order constraint (Ràng buộc đơn duy nhất)
  const [currentOrder, setCurrentOrder] = useState<DriverOrder | null>(null);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [isAcceptingId, setIsAcceptingId] = useState<number | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Driver reject / return modal (DRIVER_ACCEPTED -> DRIVER_REJECTED)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);
  const [returnReason, setReturnReason] = useState<string>('');

  // Wallet & Review metrics
  const [walletData, setWalletData] = useState<DriverWalletSummary | null>(null);
  const [loadingWallet, setLoadingWallet] = useState<boolean>(true);
  const [reviewData, setReviewData] = useState<DriverReviewSummary | null>(null);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);

  // Completed trip celebration modal
  const [completedOrderSummary, setCompletedOrderSummary] = useState<DriverOrder | null>(null);

  const loadWalletSummary = useCallback(async () => {
    setLoadingWallet(true);
    try {
      const data = await driverApi.getWalletSummary(user?.id);
      setWalletData(data);
    } catch (err) {
      console.error('Lỗi tải ví thu nhập tài xế:', err);
    } finally {
      setLoadingWallet(false);
    }
  }, [user?.id]);

  // 1. Khôi phục đơn đang giao (nếu có) & tải ví thu nhập thật khi vào trang
  useEffect(() => {
    let mounted = true;
    setLoadingInitial(true);

    Promise.all([
      driverApi.getActiveOrder(user?.id).catch(() => null),
      driverApi.getWalletSummary(user?.id).catch(() => null),
    ]).then(([activeOrder, wallet]) => {
      if (!mounted) return;
      if (activeOrder) {
        setCurrentOrder(activeOrder);
      }
      if (wallet) {
        setWalletData(wallet);
      }
      setLoadingWallet(false);
      setLoadingInitial(false);
    });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // 2. Hàm dò đơn chưa có người giao hàng (status = CONFIRMED, driverId = null)
  const fetchAvailableOrders = useCallback(
    async (options?: { showSpinner?: boolean; resetDismissed?: boolean }) => {
      if (options?.resetDismissed) {
        dismissedOrderIdsRef.current.clear();
      }
      if (options?.showSpinner) {
        setLoadingRadar(true);
      }
      try {
        const orders = await driverApi.getAvailableOrders();
        const filtered = orders.filter((o) => !dismissedOrderIdsRef.current.has(o.id));
        setAvailableOrders(filtered);
        setRadarError(null);
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || err?.message || 'Không thể dò đơn hàng từ máy chủ.';
        setRadarError(msg);
      } finally {
        if (options?.showSpinner) {
          setLoadingRadar(false);
        }
      }
    },
    []
  );

  // 3. Tự động dò đơn hàng định kỳ mỗi 6 giây khi Online và rảnh
  useEffect(() => {
    if (loadingInitial || !isOnline || currentOrder || activeTab !== 'deliveries') {
      return;
    }

    fetchAvailableOrders({ showSpinner: true });
    const interval = setInterval(() => {
      fetchAvailableOrders({ showSpinner: false });
    }, 6000);

    return () => clearInterval(interval);
  }, [loadingInitial, isOnline, currentOrder, activeTab, fetchAvailableOrders]);

  // 4. Tải dữ liệu đánh giá thật khi tài xế mở tab Đánh giá
  useEffect(() => {
    if (activeTab !== 'reviews' || reviewData !== null) {
      return;
    }
    setLoadingReviews(true);
    driverApi
      .getReviewSummary()
      .then(setReviewData)
      .finally(() => setLoadingReviews(false));
  }, [activeTab, reviewData]);

  // 5. Nhận đơn hàng (CONFIRMED -> DRIVER_ACCEPTED)
  const handleAcceptOrder = async (order: DriverOrder) => {
    if (isAcceptingId !== null) return;
    setIsAcceptingId(order.id);
    try {
      const accepted = await driverApi.acceptOrder(order.id);
      setCurrentOrder(accepted);
      setAvailableOrders([]);
      message.success(`Nhận đơn #${accepted.orderCode} thành công! Bắt đầu điều hướng.`);
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể nhận đơn. Có thể tài xế khác đã nhận trước!';
      console.error('Lỗi nhận đơn:', error);
      message.error(errMsg);
      fetchAvailableOrders({ showSpinner: false });
    } finally {
      setIsAcceptingId(null);
    }
  };

  // 6. Bỏ qua đơn trên Radar phiên hiện tại
  const handleRejectOrder = (orderId: number) => {
    dismissedOrderIdsRef.current.add(orderId);
    setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
    message.info('Đã tạm ẩn đơn khỏi radar. Nhấn "Quét lại" nếu muốn hiện lại.');
  };

  // 7. Chỉnh sửa trạng thái đơn (PICKING_UP -> DELIVERING -> COMPLETED hoặc DRIVER_REJECTED)
  const handleUpdateOrderStatus = async (nextStatus: string, reason?: string) => {
    if (!currentOrder || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const updated = await driverApi.updateStatus(currentOrder.id, nextStatus, reason);

      if (nextStatus === 'COMPLETED') {
        setCompletedOrderSummary(updated);
        setCurrentOrder(null);
        await loadWalletSummary();
      } else if (nextStatus === 'DRIVER_REJECTED') {
        setIsReturnModalOpen(false);
        setReturnReason('');
        setCurrentOrder(null);
        message.info(`Đã trả đơn #${updated.orderCode}. Đơn được ghi nhận vào lịch sử.`);
        await loadWalletSummary();
      } else {
        setCurrentOrder(updated);
        message.success('Cập nhật tiến độ giao hàng thành công!');
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || err?.message || 'Lỗi cập nhật trạng thái đơn hàng.';
      console.error('Lỗi cập nhật tiến trình:', err);
      message.error(errMsg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const driverDisplayName = user?.fullName || 'Tài xế Thunder';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-start items-center py-0 sm:py-6">
      {/* Top Bar */}
      <aside
        aria-label="Thanh điều hướng tài xế"
        className="w-full max-w-md bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:rounded-t-3xl"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isOnline ? 'bg-white' : 'bg-slate-300'
              }`}
            ></span>
          </span>
          <span className="font-bold tracking-wide">SHIPPER WEB HUB</span>
          <Tag color={isOnline ? 'green' : 'default'} className="text-[10px] m-0 font-bold uppercase border-0">
            {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
          </Tag>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            to={APP_ROUTES.SHIPPER_HISTORY}
            className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Xem chi tiết toàn bộ lịch sử đơn hàng & thu nhập"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Lịch sử</span>
          </Link>
          {!currentOrder && isOnline && activeTab === 'deliveries' && (
            <button
              onClick={() => fetchAvailableOrders({ showSpinner: true, resetDismissed: true })}
              disabled={loadingRadar}
              className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
              title="Quét lại danh sách đơn chưa có tài xế"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loadingRadar ? 'animate-spin' : ''}`} />
              <span>Quét lại</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Mobile App Frame */}
      <main className="w-full max-w-md bg-slate-50 flex flex-col relative pb-8 shadow-2xl overflow-hidden border-x border-b border-slate-200 sm:rounded-b-3xl min-h-[750px]">
        {/* Background Visual */}
        <div className="absolute top-0 left-0 right-0 h-56 bg-slate-200 overflow-hidden z-0">
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-slate-50" />
        </div>

        {/* Header & Status Toggle */}
        <header className="relative z-10 p-5 pt-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Đối tác Giao hàng Thunder</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 drop-shadow-sm">
                Chào {driverDisplayName}!
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                {currentOrder ? (
                  <span className="text-orange-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping inline-block"></span>
                    Đang thực hiện đơn #{currentOrder.orderCode}
                  </span>
                ) : isOnline ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                    Đang dò đơn chưa có người giao...
                  </span>
                ) : (
                  <span className="text-slate-400">Bạn đang ngoại tuyến</span>
                )}
              </p>
            </div>

            {/* Toggle Online/Offline Power Button (Disabled during active delivery) */}
            {!currentOrder && (
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 cursor-pointer ${
                  isOnline
                    ? 'bg-emerald-500 shadow-emerald-500/40 text-white hover:bg-emerald-600'
                    : 'bg-white shadow-slate-200 text-slate-400 border border-slate-200 hover:text-slate-600'
                }`}
                title={isOnline ? 'Nhấn để tắt trực tuyến' : 'Nhấn để bật trực tuyến'}
              >
                {isOnline && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400 opacity-40 pointer-events-none"></span>
                )}
                <Power className={`w-6 h-6 ${isOnline ? 'animate-pulse' : ''}`} />
              </button>
            )}
          </div>

          {/* Navigation Tabs (Only visible when NOT in active delivery) */}
          {!currentOrder && (
            <nav
              aria-label="Điều hướng tab"
              className="flex bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200 mb-4"
            >
              <button
                onClick={() => setActiveTab('deliveries')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'deliveries'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Dò đơn</span>
                {availableOrders.length > 0 && isOnline && (
                  <span className="bg-white text-emerald-700 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {availableOrders.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('wallet')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'wallet'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>Ví thu nhập</span>
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>Đánh giá</span>
              </button>
            </nav>
          )}

          {/* =========================================================================
              VIEW 1: ACTIVE ORDER NAVIGATION (ĐƠN HÀNG ĐANG THỰC HIỆN)
             ========================================================================= */}
          {currentOrder && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* Top Active Order Indicator */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-3xl shadow-lg shadow-orange-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-2 rounded-full">
                      <Bike className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-100 block">
                        ĐƠN HÀNG ĐANG THỰC HIỆN
                      </span>
                      <h2 className="text-base font-black leading-tight">
                        #{currentOrder.orderCode}
                      </h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-orange-100 block">Cước giao hàng</span>
                    <span className="text-lg font-black">
                      +{currentOrder.shippingFee.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {/* Status Stepper */}
                <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
                  <div
                    className={`py-1.5 rounded-lg transition-all ${
                      currentOrder.statusCode === 'DRIVER_ACCEPTED'
                        ? 'bg-white text-orange-700 shadow-sm'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    1. Tới quán
                  </div>
                  <div
                    className={`py-1.5 rounded-lg transition-all ${
                      currentOrder.statusCode === 'PICKING_UP'
                        ? 'bg-white text-orange-700 shadow-sm'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    2. Lấy món
                  </div>
                  <div
                    className={`py-1.5 rounded-lg transition-all ${
                      currentOrder.statusCode === 'DELIVERING'
                        ? 'bg-white text-orange-700 shadow-sm'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    3. Giao khách
                  </div>
                </div>
              </div>

              {/* Navigation Route & Contact Card */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200"></div>

                  {/* 1. Point of Pickup */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-700 uppercase">
                          ĐIỂM LẤY MÓN (NHÀ HÀNG)
                        </p>
                        <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                          {currentOrder.restaurantName}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                          {currentOrder.restaurantAddress}
                        </p>
                      </div>
                      {currentOrder.restaurantPhone && (
                        <a
                          href={`tel:${currentOrder.restaurantPhone}`}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shrink-0"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Gọi quán</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 2. Point of Delivery */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-rose-100"></div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold text-rose-700 uppercase">
                          ĐIỂM GIAO MÓN (KHÁCH HÀNG)
                        </p>
                        <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                          {currentOrder.receiverName}
                          {currentOrder.receiverPhone ? ` • ${currentOrder.receiverPhone}` : ''}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                          {currentOrder.receiverAddress}
                        </p>
                      </div>
                      {currentOrder.receiverPhone && (
                        <a
                          href={`tel:${currentOrder.receiverPhone}`}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shrink-0"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Gọi khách</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items & COD Checklist */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      Chi tiết món ({currentOrder.items.length})
                    </span>
                    <span className="text-slate-500">Khoảng cách: {currentOrder.distanceKm} km</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl space-y-1.5 text-xs">
                    {currentOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-slate-800">
                        <span className="font-medium">
                          {item.quantity}x {item.name}
                          {item.toppings && item.toppings.length > 0 && (
                            <span className="text-[11px] text-slate-500 block">
                              + {item.toppings.join(', ')}
                            </span>
                          )}
                        </span>
                        <span className="font-bold">
                          {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    ))}

                    {currentOrder.note && (
                      <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-xl flex items-start gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                        <span>Ghi chú: {currentOrder.note}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment / COD Info */}
                <div
                  className={`p-3.5 rounded-2xl flex items-center justify-between text-xs ${
                    currentOrder.codAmount > 0
                      ? 'bg-amber-50 border border-amber-200 text-amber-900'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign
                      className={`w-4 h-4 ${
                        currentOrder.codAmount > 0 ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    />
                    <div>
                      <span className="font-bold block">
                        {currentOrder.codAmount > 0
                          ? 'TIỀN MẶT CẦN THU (COD)'
                          : 'KHÔNG THU TIỀN MẶT (0đ COD)'}
                      </span>
                      <span className="text-[11px] opacity-80">{formatPaymentLabel(currentOrder)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black">
                      {currentOrder.codAmount > 0
                        ? `${currentOrder.codAmount.toLocaleString('vi-VN')} đ`
                        : '0 đ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Progression Button (State Machine) */}
              <div className="pt-2 space-y-2">
                {currentOrder.statusCode === 'DRIVER_ACCEPTED' && (
                  <>
                    <button
                      onClick={() => handleUpdateOrderStatus('PICKING_UP')}
                      disabled={isUpdatingStatus}
                      className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <span>
                        {isUpdatingStatus ? 'ĐANG CẬP NHẬT...' : '1. ĐÃ TỚI QUÁN & ĐANG LẤY MÓN'}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsReturnModalOpen(true)}
                      disabled={isUpdatingStatus}
                      className="w-full py-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs rounded-2xl transition-all cursor-pointer disabled:opacity-60"
                    >
                      Trả đơn / Không thể giao đơn này
                    </button>
                  </>
                )}

                {currentOrder.statusCode === 'PICKING_UP' && (
                  <button
                    onClick={() => handleUpdateOrderStatus('DELIVERING')}
                    disabled={isUpdatingStatus}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/30 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <span>
                      {isUpdatingStatus ? 'ĐANG CẬP NHẬT...' : '2. ĐÃ LẤY XONG & BẮT ĐẦU GIAO'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {currentOrder.statusCode === 'DELIVERING' && (
                  <button
                    onClick={() => handleUpdateOrderStatus('COMPLETED')}
                    disabled={isUpdatingStatus}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>
                      {isUpdatingStatus ? 'ĐANG HOÀN TẤT...' : '3. ĐÃ GIAO THÀNH CÔNG & THU TIỀN'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: RADAR DÒ ĐƠN CHƯA CÓ NGƯỜI GIAO HÀNG
             ========================================================================= */}
          {!currentOrder && activeTab === 'deliveries' && !isOnline && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80 text-center mt-6">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Bike className="w-10 h-10" />
              </div>
              <h2 className="text-lg font-black text-slate-900 mb-1">Bạn đang ngoại tuyến</h2>
              <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto leading-relaxed">
                Bật trực tuyến ngay để dò các đơn hàng quán đã xác nhận (CONFIRMED) chưa có shipper!
              </p>
              <button
                onClick={() => setIsOnline(true)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer"
              >
                Bật Trực Tuyến Ngay
              </button>
            </div>
          )}

          {!currentOrder && activeTab === 'deliveries' && isOnline && (
            <div className="space-y-4">
              {/* Radar Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    ĐƠN CHỜ NHẬN TRÊN HỆ THỐNG ({availableOrders.length})
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-slate-400">Tự động dò mỗi 6s</span>
              </div>

              {radarError && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs text-rose-700">
                  <span className="font-medium">{radarError}</span>
                  <button
                    onClick={() => fetchAvailableOrders({ showSpinner: true })}
                    className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded-lg shrink-0 cursor-pointer"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {/* Available Orders List */}
              {loadingRadar && availableOrders.length === 0 ? (
                <div className="bg-white/90 p-10 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
                  Đang quét đơn hàng từ máy chủ...
                </div>
              ) : availableOrders.length > 0 ? (
                availableOrders.map((order) => (
                  <article
                    key={order.id}
                    aria-label={`Đơn hàng ${order.orderCode} từ ${order.restaurantName}`}
                    className="bg-white rounded-3xl shadow-md border border-slate-200/80 overflow-hidden transition-all hover:shadow-lg"
                  >
                    <div className="w-full bg-emerald-50 px-4 py-1.5 flex items-center justify-between text-[10px] font-bold text-emerald-700 border-b border-emerald-100">
                      <span>QUÁN ĐÃ XÁC NHẬN • CHỜ SHIPPER</span>
                      <span>{formatTimeOnly(order.createdAt)}</span>
                    </div>

                    <div className="p-4 sm:p-5">
                      {/* Header: Restaurant Name & Earning */}
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                            #{order.orderCode}
                          </span>
                          <h3 className="font-black text-base text-slate-900 leading-snug">
                            {order.restaurantName}
                          </h3>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block">Tiền cước</span>
                          <span className="inline-block bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl font-black text-sm border border-emerald-100">
                            +{order.shippingFee.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>

                      {/* Order Details: Distance, Payment, Addresses */}
                      <div className="space-y-2 mb-4 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-lg font-bold">
                            <Navigation className="w-3 h-3 text-emerald-600" />
                            <span>{order.distanceKm} km</span>
                          </div>

                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold ${
                              order.codAmount > 0
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'bg-teal-50 text-teal-700 border border-teal-100'
                            }`}
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>{formatPaymentLabel(order)}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1 text-[11px] text-slate-600">
                          <div className="flex items-start gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1"></span>
                            <span className="line-clamp-1">
                              <strong className="text-slate-800">Lấy:</strong> {order.restaurantAddress}
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1"></span>
                            <span className="line-clamp-1">
                              <strong className="text-slate-800">Giao:</strong> {order.receiverAddress}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: Bỏ qua & Nhận đơn ngay */}
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleRejectOrder(order.id)}
                          disabled={isAcceptingId === order.id}
                          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Bỏ qua
                        </button>
                        <button
                          onClick={() => handleAcceptOrder(order)}
                          disabled={isAcceptingId !== null}
                          className="flex-[2] py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isAcceptingId === order.id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <span>NHẬN ĐƠN NGAY</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                /* Empty Radar State */
                <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-slate-200 text-center relative overflow-hidden py-12">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div
                      className="w-[280px] h-[280px] border border-emerald-500 rounded-full animate-ping"
                      style={{ animationDuration: '3s' }}
                    />
                    <div
                      className="absolute w-[180px] h-[180px] border border-emerald-500 rounded-full animate-ping"
                      style={{ animationDuration: '3s', animationDelay: '1s' }}
                    />
                  </div>

                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-500">
                      <Clock className="w-8 h-8 animate-pulse" />
                    </div>
                    <h3 className="text-base font-black text-slate-900 mb-1">
                      Chưa có đơn mới chờ giao
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5 leading-relaxed">
                      Hệ thống chỉ hiển thị đơn hàng thật đang ở trạng thái quán đã xác nhận (CONFIRMED) và chưa có tài xế nhận.
                    </p>
                    <button
                      onClick={() => fetchAvailableOrders({ showSpinner: true, resetDismissed: true })}
                      className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Quét lại đơn ngay</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW 3: WALLET (VÍ THU NHẬP THẬT CỦA TÀI XẾ)
             ========================================================================= */}
          {!currentOrder && activeTab === 'wallet' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {loadingWallet && !walletData ? (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
                  Đang tải dữ liệu ví từ máy chủ...
                </div>
              ) : walletData ? (
                <>
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-600/20">
                    <span className="text-xs font-semibold text-emerald-100 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Thu nhập hôm nay
                    </span>
                    <div className="text-3xl font-black mt-2 tracking-tight">
                      {walletData.todayEarnings.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-emerald-200 block text-[11px]">Cuốc xong hôm nay</span>
                        <span className="font-black text-sm text-white">
                          {walletData.completedTripsToday} chuyến
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-200 block text-[11px]">Tổng tích lũy</span>
                        <span className="font-black text-sm text-white">
                          {walletData.walletBalance.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                        Chuyến hoàn thành gần nhất
                      </h3>
                      <button
                        onClick={loadWalletSummary}
                        className="text-[11px] text-emerald-600 font-bold cursor-pointer"
                      >
                        Làm mới
                      </button>
                    </div>

                    {walletData.recentTrips.length > 0 ? (
                      <div className="space-y-2 text-xs">
                        {walletData.recentTrips.map((trip) => (
                          <div
                            key={trip.id}
                            className="p-3 rounded-2xl bg-slate-50 flex items-center justify-between border border-slate-100"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-slate-800 block truncate">
                                {trip.orderCode} • {trip.restaurantName}
                              </span>
                              <span className="text-slate-400 text-[10px] block truncate">
                                {trip.address} • {trip.time}
                              </span>
                            </div>
                            <span className="font-black text-emerald-600 text-xs shrink-0">
                              +{trip.earning.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">
                        Chưa có chuyến xe nào hoàn thành.
                      </p>
                    )}

                    <Link
                      to={APP_ROUTES.SHIPPER_HISTORY}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <span>Xem toàn bộ lịch sử đơn hàng (cả thất bại &amp; thành công) &gt;</span>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
                  Không có dữ liệu ví.
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW 4: REVIEWS (ĐÁNH GIÁ THẬT CỦA TÀI XẾ)
             ========================================================================= */}
          {!currentOrder && activeTab === 'reviews' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {loadingReviews && !reviewData ? (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
                  Đang tải đánh giá từ máy chủ...
                </div>
              ) : reviewData ? (
                <>
                  <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm text-center">
                    <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-2">
                      <Award className="w-7 h-7" />
                    </div>
                    <div className="text-3xl font-black text-slate-900">
                      {reviewData.totalReviews > 0 ? `${reviewData.averageRating} / 5.0` : 'Chưa có'}
                    </div>
                    {reviewData.totalReviews > 0 && (
                      <div className="flex items-center justify-center gap-1 my-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= Math.round(reviewData.averageRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-xs font-bold text-emerald-600 mt-1">{reviewData.ratingRank}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {reviewData.unavailableReason
                        ? reviewData.unavailableReason
                        : `Dựa trên ${reviewData.totalReviews} lượt đánh giá từ khách hàng`}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Nhận xét từ khách hàng
                    </h3>

                    {reviewData.reviews.length > 0 ? (
                      <div className="space-y-2.5 text-xs">
                        {reviewData.reviews.map((rev) => (
                          <div key={rev.id} className="p-3 rounded-2xl bg-slate-50 space-y-1 border border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-700">{rev.customerName}</span>
                              <div className="flex text-amber-400 text-[11px]">
                                {'★'.repeat(rev.rating)}
                              </div>
                            </div>
                            <p className="text-slate-600 italic">"{rev.comment}"</p>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                              <span>{rev.orderCode}</span>
                              <span>{rev.timeAgo}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">
                        {reviewData.unavailableReason || 'Chưa có nhận xét nào từ khách hàng.'}
                      </p>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </header>
      </main>

      {/* Modal Trả đơn (DRIVER_REJECTED) */}
      <Modal
        open={isReturnModalOpen}
        onCancel={() => {
          setIsReturnModalOpen(false);
          setReturnReason('');
        }}
        onOk={() =>
          handleUpdateOrderStatus(
            'DRIVER_REJECTED',
            returnReason.trim() || 'Tài xế không thể tiếp tục giao đơn'
          )
        }
        okText="Xác nhận trả đơn"
        cancelText="Quay lại"
        okButtonProps={{ danger: true, loading: isUpdatingStatus }}
        centered
        title="Trả đơn hàng"
      >
        <div className="space-y-3 text-xs pt-2">
          <p className="text-slate-600">
            Đơn hàng sẽ chuyển sang trạng thái <strong>Tài xế trả đơn</strong> và lưu vào lịch sử đơn
            hàng của bạn. Vui lòng nhập lý do:
          </p>
          <Input.TextArea
            rows={3}
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder="Ví dụ: Xe gặp sự cố, quán đóng cửa hoặc quá tải chờ lâu..."
          />
        </div>
      </Modal>

      {/* Completed Trip Celebration Modal */}
      {completedOrderSummary && (
        <Modal
          open={true}
          centered
          footer={null}
          closable={false}
          className="rounded-3xl overflow-hidden"
        >
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1">Giao hàng thành công!</h3>
            <p className="text-xs text-slate-500 mb-4">
              Bạn đã hoàn thành đơn hàng #{completedOrderSummary.orderCode}.
            </p>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mb-5">
              <span className="text-xs text-emerald-700 font-bold block mb-1">
                Tiền cước giao hàng đã ghi nhận
              </span>
              <span className="text-2xl font-black text-emerald-600">
                +{completedOrderSummary.shippingFee.toLocaleString('vi-VN')} đ
              </span>
              {completedOrderSummary.codAmount > 0 && (
                <span className="text-xs text-slate-600 block mt-2 pt-2 border-t border-emerald-200">
                  Đã thu tiền COD: {completedOrderSummary.codAmount.toLocaleString('vi-VN')} đ
                </span>
              )}
            </div>

            <button
              onClick={() => setCompletedOrderSummary(null)}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer"
            >
              TIẾP TỤC QUÉT ĐƠN MỚI
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ShipperHubPage;
