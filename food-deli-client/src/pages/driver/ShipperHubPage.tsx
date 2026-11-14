import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { message, Modal, Tag, Input, Dropdown, type MenuProps } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  DashboardOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { calculateHaversineDistance } from '@/utils/geoUtils';
import {
  Bike,
  Power,
  Navigation,
  Clock,
  Wallet,
  Star,
  Award,
  TrendingUp,
  CheckCircle,
  RotateCcw,
  DollarSign,
  ShieldCheck,
} from './icons';
import { ActiveDeliveryView } from './components/ActiveDeliveryView';
import { ShipperWalletView } from './components/ShipperWalletView';
import { ShipperReviewsView } from './components/ShipperReviewsView';
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
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  // Safe Logout with confirmation
  const handleLogoutConfirm = () => {
    Modal.confirm({
      title: 'Xác nhận đăng xuất tài xế',
      icon: <ExclamationCircleOutlined className="text-orange-500" />,
      content: 'Bạn có chắc chắn muốn kết thúc ca làm việc và đăng xuất khỏi cổng Shipper Hub không?',
      okText: 'Đăng xuất',
      cancelText: 'Hủy bỏ',
      okButtonProps: { danger: true, className: 'bg-red-500 font-bold' },
      onOk: () => {
        logout();
        message.success('Đã kết thúc phiên làm việc an toàn!');
        navigate(APP_ROUTES.LOGIN);
      },
    });
  };

  const shipperHeaderMenuItems: MenuProps['items'] = [
    {
      key: 'driver-info',
      disabled: true,
      label: (
        <div className="py-1">
          <div className="font-extrabold text-slate-900 text-xs truncate max-w-[160px]">
            {user?.fullName || 'Tài xế giao vận'}
          </div>
          <div className="text-[10px] text-slate-400">{user?.phone || user?.email}</div>
          <Tag color="blue" className="mt-1 font-bold text-[10px]">
            Tài Xế Đối Tác
          </Tag>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'history',
      icon: <HistoryOutlined className="text-blue-500" />,
      label: <span className="font-semibold text-slate-700">Lịch sử chuyến đi & Thu nhập</span>,
      onClick: () => navigate(APP_ROUTES.SHIPPER_HISTORY),
    },
    {
      key: 'home',
      icon: <HomeOutlined className="text-emerald-500" />,
      label: <span className="font-semibold text-slate-700">Trang chủ đặt món (Khách hàng)</span>,
      onClick: () => navigate(APP_ROUTES.HOME),
    },
    ...(isAdmin
      ? [
          {
            key: 'admin-portal',
            icon: <DashboardOutlined className="text-red-500" />,
            label: (
              <span className="font-bold text-red-600">
                Cổng Quản trị (Admin Portal)
              </span>
            ),
            onClick: () => navigate('/admin/dashboard'),
          },
        ]
      : []),
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: <span className="font-bold">Đăng xuất ca làm</span>,
      onClick: handleLogoutConfirm,
    },
  ];

  // Navigation tab for Hub
  const [activeTab, setActiveTab] = useState<'deliveries' | 'wallet' | 'reviews'>('deliveries');

  // Driver operational state
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [availableOrders, setAvailableOrders] = useState<DriverOrder[]>([]);
  const [loadingRadar, setLoadingRadar] = useState<boolean>(false);
  const [radarError, setRadarError] = useState<string | null>(null);
  const dismissedOrderIdsRef = useRef<Set<number>>(new Set());

  // Radar Radius & GPS Coordinates (Bug 9)
  const [radarRadius, setRadarRadius] = useState<number>(5);
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number }>({ lat: 10.7769, lng: 106.7009 });

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDriverCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const filteredAvailableOrders = useMemo(() => {
    return availableOrders
      .map((order) => {
        const distanceToShop = calculateHaversineDistance(
          driverCoords.lat,
          driverCoords.lng,
          order.restaurantLat || 10.7769,
          order.restaurantLng || 106.7009
        );
        return { ...order, distanceToShop };
      })
      .filter((o) => radarRadius >= 999 || o.distanceToShop <= radarRadius)
      .sort((a, b) => a.distanceToShop - b.distanceToShop);
  }, [availableOrders, driverCoords, radarRadius]);

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

  // 7. Chỉnh sửa trạng thái đơn (Mốc 1: Tới quán lấy món -> DELIVERING)
  const handleConfirmPickupAndDeliver = async () => {
    if (!currentOrder || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const updated = await driverApi.confirmPickupAndStartDelivery(
        currentOrder.id,
        currentOrder.statusCode
      );
      setCurrentOrder(updated);
      message.success('Đã xác nhận lấy món! Bắt đầu giao hàng tới khách.');
    } catch (err: any) {
      if (err?.partialOrder) {
        setCurrentOrder(err.partialOrder);
      }
      const errMsg =
        err?.response?.data?.message || err?.message || 'Lỗi chuyển trạng thái sang đang giao.';
      console.error('Lỗi cập nhật Mốc 1:', err);
      message.error(errMsg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 8. Chỉnh sửa trạng thái đơn (COMPLETED hoặc DRIVER_REJECTED)
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

            {/* Actions: Navigation Dropdown & Online/Offline Toggle */}
            <div className="flex items-center gap-2.5">
              <Dropdown menu={{ items: shipperHeaderMenuItems }} placement="bottomRight" trigger={['click']}>
                <button
                  type="button"
                  className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white shadow-sm border border-slate-200 text-slate-700 hover:text-emerald-600 hover:bg-slate-50 transition-all cursor-pointer"
                  title="Menu tài khoản & điều hướng"
                >
                  <UserOutlined className="text-base" />
                </button>
              </Dropdown>

              {/* Toggle Online/Offline Power Button (Disabled during active delivery) */}
              {!currentOrder && (
                <button
                  onClick={() => setIsOnline(!isOnline)}
                  className={`relative flex items-center justify-center w-12 h-12 rounded-2xl shadow-lg transition-all duration-300 cursor-pointer ${
                    isOnline
                      ? 'bg-emerald-500 shadow-emerald-500/40 text-white hover:bg-emerald-600'
                      : 'bg-white shadow-slate-200 text-slate-400 border border-slate-200 hover:text-slate-600'
                  }`}
                  title={isOnline ? 'Nhấn để tắt trực tuyến' : 'Nhấn để bật trực tuyến'}
                >
                  {isOnline && (
                    <span className="absolute inset-0 rounded-2xl animate-ping bg-emerald-400 opacity-40 pointer-events-none"></span>
                  )}
                  <Power className={`w-5 h-5 ${isOnline ? 'animate-pulse' : ''}`} />
                </button>
              )}
            </div>
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
              VIEW 1: ACTIVE ORDER NAVIGATION (SP3-DRV-04)
             ========================================================================= */}
          {currentOrder && (
            <ActiveDeliveryView
              key={currentOrder.id}
              order={currentOrder}
              isUpdatingStatus={isUpdatingStatus}
              onConfirmPickupAndDeliver={handleConfirmPickupAndDeliver}
              onCompleteDelivery={() => handleUpdateOrderStatus('COMPLETED')}
              onOpenReturnModal={() => setIsReturnModalOpen(true)}
            />
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

              {/* Radar Radius Selector */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2 flex-wrap shadow-2xs">
                <span className="text-xs font-bold text-slate-700">Bán kính dò đơn:</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: '3 km', value: 3 },
                    { label: '5 km', value: 5 },
                    { label: '10 km', value: 10 },
                    { label: 'Toàn sàn', value: 999 },
                  ].map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRadarRadius(r.value)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        radarRadius === r.value
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Orders List */}
              {loadingRadar && filteredAvailableOrders.length === 0 ? (
                <div className="bg-white/90 p-10 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
                  Đang quét đơn hàng từ máy chủ...
                </div>
              ) : filteredAvailableOrders.length > 0 ? (
                filteredAvailableOrders.map((order) => (
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
                          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                            <Navigation className="w-3 h-3 text-emerald-600" />
                            <span>Cách bạn {(order as any).distanceToShop?.toFixed(1) || '1.2'} km</span>
                          </div>

                          <div className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-lg font-bold">
                            <span>Quán tới khách: {order.distanceKm} km</span>
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
            <ShipperWalletView
              walletData={walletData}
              loadingWallet={loadingWallet}
              onRefresh={loadWalletSummary}
            />
          )}

          {/* =========================================================================
              VIEW 4: REVIEWS (ĐÁNH GIÁ THẬT CỦA TÀI XẾ)
             ========================================================================= */}
          {!currentOrder && activeTab === 'reviews' && (
            <ShipperReviewsView
              reviewData={reviewData}
              loadingReviews={loadingReviews}
            />
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
