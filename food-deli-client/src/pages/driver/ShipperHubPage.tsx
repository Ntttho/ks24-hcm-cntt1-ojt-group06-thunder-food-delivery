import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { message, Modal, Tag } from 'antd';
import {
  Bike,
  Power,
  Navigation,
  MapPin,
  Clock,
  Wallet,
  Star,
  Award,
  TrendingUp,
  Phone,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  PlusCircle,
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
  INITIAL_MOCK_RADAR_ORDERS,
} from '@/services/modules/driverApi';
import { APP_ROUTES } from '@/constants';

export const ShipperHubPage: React.FC = () => {
  const { user } = useAuth();

  // Navigation tab for Hub
  const [activeTab, setActiveTab] = useState<'deliveries' | 'wallet' | 'reviews'>('deliveries');

  // Driver operational state
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [availableOrders, setAvailableOrders] = useState<DriverOrder[]>(INITIAL_MOCK_RADAR_ORDERS);
  const [orderTimers, setOrderTimers] = useState<Record<number, number>>({
    9101: 30,
    9102: 30,
    9103: 30,
  });

  // Single Active Order constraint (Ràng buộc đơn duy nhất)
  const [currentOrder, setCurrentOrder] = useState<DriverOrder | null>(null);
  const [isAcceptingId, setIsAcceptingId] = useState<number | null>(null);

  // Wallet & Review metrics
  const [walletData, setWalletData] = useState<DriverWalletSummary | null>(null);
  const [reviewData, setReviewData] = useState<DriverReviewSummary | null>(null);

  // Completed trip celebration modal
  const [completedOrderSummary, setCompletedOrderSummary] = useState<DriverOrder | null>(null);

  // Audio / chime reference for radar alert
  const alertPlayedRef = useRef<boolean>(false);

  // 1. Initial Load of Wallet & Reviews
  useEffect(() => {
    driverApi.getWalletSummary().then(setWalletData);
    driverApi.getReviewSummary().then(setReviewData);
  }, []);

  // 2. Countdown timer for Radar Orders (30 seconds per offer)
  useEffect(() => {
    // Only tick when driver is online and has no active order
    if (!isOnline || currentOrder) return;

    const interval = setInterval(() => {
      setOrderTimers((prevTimers) => {
        const nextTimers: Record<number, number> = {};
        const expiredOrderIds: number[] = [];

        Object.entries(prevTimers).forEach(([orderIdStr, seconds]) => {
          const id = Number(orderIdStr);
          if (seconds > 1) {
            nextTimers[id] = seconds - 1;
          } else {
            expiredOrderIds.push(id);
          }
        });

        // Automatically dismiss expired offers from radar
        if (expiredOrderIds.length > 0) {
          setAvailableOrders((prev) =>
            prev.filter((order) => !expiredOrderIds.includes(order.id))
          );
        }

        return nextTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOnline, currentOrder]);

  // 3. Handle Accept Order (Nhận đơn ngay)
  const handleAcceptOrder = async (order: DriverOrder) => {
    setIsAcceptingId(order.id);
    try {
      // In production, call driverApi.acceptOrder(order.id)
      const accepted = await driverApi.acceptOrder(order.id);
      
      // Enforce Single Active Order:
      // Immediately stop radar scanning and set the single active order
      setCurrentOrder(accepted);
      setAvailableOrders([]); // Clear others when busy to strictly focus on 1 order
      message.success(`Nhận đơn #${order.orderCode} thành công! Bắt đầu điều hướng.`);
    } catch (error) {
      console.error('Lỗi nhận đơn:', error);
      message.error('Không thể nhận đơn. Có thể tài xế khác đã nhận trước!');
      setAvailableOrders((prev) => prev.filter((o) => o.id !== order.id));
    } finally {
      setIsAcceptingId(null);
    }
  };

  // 4. Handle Reject Order (Bỏ qua)
  const handleRejectOrder = (orderId: number) => {
    setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
    setOrderTimers((prev) => {
      const copy = { ...prev };
      delete copy[orderId];
      return copy;
    });
    message.info('Đã bỏ qua cuốc xe.');
  };

  // 5. Update Active Order State progression
  // DRIVER_ACCEPTED -> PICKING_UP -> DELIVERING -> COMPLETED
  const handleUpdateOrderStatus = async (nextStatus: string) => {
    if (!currentOrder) return;

    try {
      await driverApi.updateStatus(currentOrder.id, nextStatus);

      if (nextStatus === 'COMPLETED') {
        const finishedOrder = { ...currentOrder, statusCode: 'COMPLETED' };
        setCompletedOrderSummary(finishedOrder);
        setCurrentOrder(null);

        // Credit to wallet
        if (walletData) {
          setWalletData({
            ...walletData,
            todayEarnings: walletData.todayEarnings + currentOrder.shippingFee,
            completedTripsToday: walletData.completedTripsToday + 1,
            walletBalance: walletData.walletBalance + currentOrder.shippingFee,
          });
        }
      } else {
        setCurrentOrder({ ...currentOrder, statusCode: nextStatus });
        message.success('Cập nhật tiến độ giao hàng thành công!');
      }
    } catch (err) {
      console.error('Lỗi cập nhật tiến trình:', err);
      message.error('Lỗi cập nhật trạng thái đơn hàng.');
    }
  };

  // 6. Spawn simulated order (dành cho người dùng kiểm thử trực tiếp)
  const handleSpawnMockOrder = () => {
    const newId = Math.floor(1000 + Math.random() * 9000);
    const mockShops = [
      { name: 'Phở Bò Gia Truyền Bát Đàn', addr: '49 Bát Đàn, Hoàn Kiếm', fee: 32000, cod: 160000, dist: 3.1 },
      { name: 'Highlands Coffee - Vincom', addr: '54A Nguyễn Chí Thanh', fee: 20000, cod: 0, dist: 1.2 },
      { name: 'Gà Rán Jollibee - Cầu Giấy', addr: '335 Cầu Giấy, Dịch Vọng', fee: 26000, cod: 135000, dist: 2.3 },
    ];
    const picked = mockShops[Math.floor(Math.random() * mockShops.length)];

    const spawned: DriverOrder = {
      id: newId,
      orderCode: `THUNDER-${newId}`,
      restaurantName: picked.name,
      restaurantAddress: picked.addr,
      restaurantPhone: '0988112233',
      receiverName: 'Khách hàng thử nghiệm',
      receiverPhone: '0912345678',
      receiverAddress: 'Tòa nhà FPT, Số 10 Phạm Văn Bạch, Cầu Giấy',
      distanceKm: picked.dist,
      shippingFee: picked.fee,
      codAmount: picked.cod,
      totalAmount: picked.cod + picked.fee,
      paymentMethod: picked.cod > 0 ? 'COD' : 'VNPAY',
      statusCode: 'CONFIRMED',
      expiresInSeconds: 30,
      note: 'Cho mình xin thêm ớt và tương cà',
      createdAt: new Date().toISOString(),
      items: [
        { name: 'Combo Đồ ăn & Nước ngọt', quantity: 2, price: 65000 },
      ],
    };

    setAvailableOrders((prev) => [spawned, ...prev]);
    setOrderTimers((prev) => ({ ...prev, [newId]: 30 }));
    message.info(`Đã phát hiện đơn hàng mới #${spawned.orderCode} trong radar!`);
  };

  const driverDisplayName = user?.fullName || 'Tài xế Sấm Sét ⚡';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-start items-center py-0 sm:py-6">
      {/* Simulation Banner / Direct Preview Access Indicator */}
      <aside
        aria-label="Chế độ giả lập tài xế"
        className="w-full max-w-md bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:rounded-t-3xl"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <span className="font-bold tracking-wide">SHIPPER WEB HUB</span>
          <Tag color="cyan" className="text-[10px] m-0 font-bold uppercase border-0">
            Mô phỏng
          </Tag>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            to={APP_ROUTES.SHIPPER_HISTORY}
            className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Xem chi tiết toàn bộ lịch sử cuốc xe & thống kê thu nhập"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Lịch sử</span>
          </Link>
          {!currentOrder && isOnline && (
            <button
              onClick={handleSpawnMockOrder}
              className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              title="Tạo đơn hàng giả lập mới để quét radar"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Quét đơn mới</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Mobile App Frame */}
      <main className="w-full max-w-md bg-slate-50 flex flex-col relative pb-8 shadow-2xl overflow-hidden border-x border-b border-slate-200 sm:rounded-b-3xl min-h-[750px]">
        {/* Background Visual Top Mock */}
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
                    Đang thực hiện cuốc xe duy nhất
                  </span>
                ) : isOnline ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                    Radar đang quét đơn quanh 5km...
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
            <nav aria-label="Điều hướng tab" className="flex bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200 mb-4">
              <button
                onClick={() => setActiveTab('deliveries')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'deliveries'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Chuyến xe</span>
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
              VIEW 1: ACTIVE ORDER NAVIGATION (CHẾ ĐỘ ĐIỀU HƯỚNG CUỐC XE HIỆN TẠI)
              RÀNG BUỘC ĐƠN DUY NHẤT: ẨN TOÀN BỘ RADAR, TẬP TRUNG 1 ĐƠN
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
                        Đơn #{currentOrder.orderCode}
                      </h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-orange-100 block">Thu nhập tài xế</span>
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
                {/* Pickup & Drop-off timeline */}
                <div className="relative pl-6 space-y-4">
                  {/* Timeline vertical bar */}
                  <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200"></div>

                  {/* 1. Point of Pickup */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></div>
                    <div className="flex items-start justify-between">
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
                      <a
                        href={`tel:${currentOrder.restaurantPhone}`}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Gọi quán</span>
                      </a>
                    </div>
                  </div>

                  {/* 2. Point of Delivery */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-rose-100"></div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-rose-700 uppercase">
                          ĐIỂM GIAO MÓN (KHÁCH HÀNG)
                        </p>
                        <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                          {currentOrder.receiverName} • {currentOrder.receiverPhone}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                          {currentOrder.receiverAddress}
                        </p>
                      </div>
                      <a
                        href={`tel:${currentOrder.receiverPhone}`}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Gọi khách</span>
                      </a>
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
                        <span>Ghi chú của khách: {currentOrder.note}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cash on Delivery (COD) Requirement */}
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
                        {currentOrder.codAmount > 0 ? 'TIỀN MẶT CẦN THU (COD)' : 'ĐÃ THANH TOÁN TRỰC TUYẾN'}
                      </span>
                      <span className="text-[11px] opacity-80">
                        {currentOrder.codAmount > 0
                          ? 'Thu tiền mặt từ khách khi giao thành công'
                          : 'Khách đã trả qua SePay/VNPAY - Tuyệt đối không thu thêm'}
                      </span>
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
              <div className="pt-2">
                {currentOrder.statusCode === 'DRIVER_ACCEPTED' && (
                  <button
                    onClick={() => handleUpdateOrderStatus('PICKING_UP')}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>1. ĐÃ TỚI QUÁN & ĐANG LẤY MÓN</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {currentOrder.statusCode === 'PICKING_UP' && (
                  <button
                    onClick={() => handleUpdateOrderStatus('DELIVERING')}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/30 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>2. ĐÃ LẤY XONG & BẮT ĐẦU GIAO</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {currentOrder.statusCode === 'DELIVERING' && (
                  <button
                    onClick={() => handleUpdateOrderStatus('COMPLETED')}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>3. ĐÃ GIAO THÀNH CÔNG & THU TIỀN</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: RADAR QUÉT ĐƠN HÀNG (DELIVERIES TAB WHEN IDLE & ONLINE)
             ========================================================================= */}
          {!currentOrder && activeTab === 'deliveries' && !isOnline && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80 text-center mt-6">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Bike className="w-10 h-10" />
              </div>
              <h2 className="text-lg font-black text-slate-900 mb-1">Bạn đang ngoại tuyến</h2>
              <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto leading-relaxed">
                Bật trực tuyến ngay để bắt đầu quét các đơn hàng xung quanh và nhận thu nhập hấp dẫn!
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
              {/* Radar Live Indicator & Spawn Tool */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    ĐƠN KHẢ DỤNG GẦN BẠN ({availableOrders.length})
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-slate-400">Tự động làm mới</span>
              </div>

              {/* Radar Available Orders List */}
              {availableOrders.length > 0 ? (
                availableOrders.map((order) => {
                  const remainingSeconds = orderTimers[order.id] ?? 30;
                  const progressPercent = (remainingSeconds / 30) * 100;

                  return (
                    <article
                      key={order.id}
                      aria-label={`Đơn hàng ${order.orderCode} từ ${order.restaurantName}`}
                      className="bg-white rounded-3xl shadow-md border border-slate-200/80 overflow-hidden transition-all hover:shadow-lg"
                    >
                      {/* 30-Second Countdown Progress Bar */}
                      <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            remainingSeconds > 10 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
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
                            <span className="text-[10px] text-slate-400 block">Thu nhập</span>
                            <span className="inline-block bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl font-black text-sm border border-emerald-100">
                              +{order.shippingFee.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        </div>

                        {/* Order Details: Distance, Addresses, COD */}
                        <div className="space-y-2 mb-4 text-xs">
                          {/* Distance & COD Badges */}
                          <div className="flex items-center gap-2">
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
                              <span>
                                {order.codAmount > 0
                                  ? `Ứng COD: ${order.codAmount.toLocaleString('vi-VN')} đ`
                                  : 'Đã trả Online (0đ COD)'}
                              </span>
                            </div>
                          </div>

                          {/* Pickup & Delivery locations */}
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

                        {/* Action Buttons: Bỏ qua & Nhận đơn ngay (kèm đếm ngược 30s) */}
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
                              <>
                                <span>NHẬN ĐƠN NGAY</span>
                                <span className="bg-emerald-700/80 px-1.5 py-0.5 rounded-md text-[10px] font-black">
                                  {remainingSeconds}s
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                /* Pulsing Radar Scanning State (No available orders right now) */
                <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-slate-200 text-center relative overflow-hidden py-12">
                  {/* Concentric Pulsing Radar Rings */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div
                      className="w-[280px] h-[280px] border border-emerald-500 rounded-full animate-ping"
                      style={{ animationDuration: '3s' }}
                    />
                    <div
                      className="absolute w-[180px] h-[180px] border border-emerald-500 rounded-full animate-ping"
                      style={{ animationDuration: '3s', animationDelay: '1s' }}
                    />
                    <div
                      className="absolute w-[90px] h-[90px] border border-emerald-500 rounded-full animate-ping"
                      style={{ animationDuration: '3s', animationDelay: '2s' }}
                    />
                  </div>

                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-500">
                      <Clock className="w-8 h-8 animate-pulse" />
                    </div>
                    <h3 className="text-base font-black text-slate-900 mb-1">
                      Đang quét đơn hàng quanh bạn...
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5">
                      Khu vực có lượng đặt đồ ăn cao: Cầu Giấy, Hoàn Kiếm, Đống Đa
                    </p>
                    <button
                      onClick={handleSpawnMockOrder}
                      className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Thử tạo đơn giả lập ngay</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW 3: WALLET (VÍ THU NHẬP CỦA TÀI XẾ)
             ========================================================================= */}
          {!currentOrder && activeTab === 'wallet' && walletData && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Daily Earnings Hero Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-600/20">
                <span className="text-xs font-semibold text-emerald-100 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Tổng thu nhập hôm nay
                </span>
                <div className="text-3xl font-black mt-2 tracking-tight">
                  {walletData.todayEarnings.toLocaleString('vi-VN')} đ
                </div>
                <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-emerald-200 block text-[11px]">Cuốc hoàn tất</span>
                    <span className="font-black text-sm text-white">
                      {walletData.completedTripsToday} chuyến
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-200 block text-[11px]">Tiền tip thêm</span>
                    <span className="font-black text-sm text-white">
                      +{walletData.tipsToday.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Trip History */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Lịch sử chuyến xe gần nhất
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-bold">Hôm nay</span>
                </div>

                <div className="space-y-2 text-xs">
                  {walletData.recentTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="p-3 rounded-2xl bg-slate-50 flex items-center justify-between border border-slate-100"
                    >
                      <div>
                        <span className="font-bold text-slate-800 block">
                          {trip.orderCode} • {trip.restaurantName}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {trip.address} • {trip.time}
                        </span>
                      </div>
                      <span className="font-black text-emerald-600 text-xs">
                        +{trip.earning.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  to={APP_ROUTES.SHIPPER_HISTORY}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <span>Xem chi tiết toàn bộ lịch sử cuốc xe &gt;</span>
                </Link>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 4: REVIEWS (ĐÁNH GIÁ CỦA TÀI XẾ)
             ========================================================================= */}
          {!currentOrder && activeTab === 'reviews' && reviewData && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Rating Rank Card */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm text-center">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-2">
                  <Award className="w-7 h-7" />
                </div>
                <div className="text-3xl font-black text-slate-900">{reviewData.averageRating} / 5.0</div>
                <div className="flex items-center justify-center gap-1 my-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs font-bold text-emerald-600">{reviewData.ratingRank}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Dựa trên {reviewData.totalReviews} lượt đánh giá từ khách hàng
                </p>
              </div>

              {/* Customer Comments List */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Nhận xét thực tế từ khách
                </h3>

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
              </div>
            </div>
          )}
        </header>
      </main>

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
              Bạn đã hoàn thành xuất sắc đơn hàng #{completedOrderSummary.orderCode}.
            </p>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mb-5">
              <span className="text-xs text-emerald-700 font-bold block mb-1">
                Tiền công giao hàng đã cộng vào ví
              </span>
              <span className="text-2xl font-black text-emerald-600">
                +{completedOrderSummary.shippingFee.toLocaleString('vi-VN')} đ
              </span>
              {completedOrderSummary.codAmount > 0 && (
                <span className="text-xs text-slate-600 block mt-2 pt-2 border-t border-emerald-200">
                  Đã hoàn tất thu tiền COD: {completedOrderSummary.codAmount.toLocaleString('vi-VN')} đ
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

