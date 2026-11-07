import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Card,
  Tabs,
  Button,
  Input,
  Empty,
  Spin,
  Badge,
  notification,
  message,
  Pagination,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { orderApi, type MerchantOrder } from '@/services/modules/orderApi';
import { merchantWebSocket } from '@/services/modules/merchantWebSocket';
import { soundManager } from '@/utils/soundNotification';
import { formatCurrency } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import {
  MerchantHeader,
  MerchantStats,
  MerchantOrderCard,
  MerchantCancelModal,
  MerchantOrderDetailDrawer,
  CANCEL_REASONS,
} from './components';

export const MerchantDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const outletContext = useOutletContext<{ restaurantId?: number; activeRestaurant?: any }>();
  const currentRestaurantId = outletContext?.restaurantId || (user as any)?.restaurantId || 1;

  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('PENDING');
  const [searchText, setSearchText] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundManager.isEnabled());
  const [wsStatus, setWsStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');

  // Server-side Pagination states
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Status counts for overview KPI cards
  const [counts, setCounts] = useState({ pending: 0, confirmed: 0, completed: 0, cancelled: 0 });

  // Cancel Order Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState<MerchantOrder | null>(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState<string>(CANCEL_REASONS[0]);
  const [customCancelReason, setCustomCancelReason] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Detail Drawer State
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState<boolean>(false);
  const [viewingOrderDetail, setViewingOrderDetail] = useState<MerchantOrder | null>(null);

  // Track known order IDs for polling detection
  const knownOrderIdsRef = useRef<Set<number>>(new Set());

  // Ref to track current params for interval polling without stale closures
  const currentParamsRef = useRef({ page, pageSize, searchText, activeTab });
  currentParamsRef.current = { page, pageSize, searchText, activeTab };

  // Fetch status counts for KPI cards
  const fetchCounts = useCallback(async () => {
    try {
      const res = await orderApi.getMerchantOrders({
        restaurantId: currentRestaurantId,
        size: 200,
      });
      if (res && res.data && res.data.content) {
        const all = res.data.content;
        setCounts({
          pending: all.filter((o) => o.statusCode === 'PENDING').length,
          confirmed: all.filter((o) => o.statusCode === 'CONFIRMED').length,
          completed: all.filter((o) => o.statusCode === 'COMPLETED').length,
          cancelled: all.filter((o) => o.statusCode === 'CANCELLED').length,
        });
      }
    } catch {
      // ignore
    }
  }, [currentRestaurantId]);

  // Load orders from API with server-side pagination and search
  const fetchOrders = useCallback(
    async (
      silent: boolean = false,
      targetPage: number = currentParamsRef.current.page,
      targetSize: number = currentParamsRef.current.pageSize,
      targetSearch: string = currentParamsRef.current.searchText,
      targetStatus: string = currentParamsRef.current.activeTab
    ) => {
      if (!silent) setLoading(true);
      try {
        const res = await orderApi.getMerchantOrders({
          restaurantId: currentRestaurantId,
          status: targetStatus !== 'ALL' ? targetStatus : undefined,
          keyword: targetSearch.trim() || undefined,
          page: targetPage,
          size: targetSize,
        });

        if (res && res.data) {
          const list = res.data.content || [];

          // Detect if any new PENDING orders arrived during polling
          if (knownOrderIdsRef.current.size > 0) {
            const newPendingOrders = list.filter(
              (o) => o.statusCode === 'PENDING' && !knownOrderIdsRef.current.has(o.id)
            );
            if (newPendingOrders.length > 0) {
              soundManager.playOrderChime();
              const newest = newPendingOrders[0];
              notification.info({
                message: '🔔 Có đơn hàng mới đổ về!',
                description: `Mã đơn: ${newest.orderCode} - Khách: ${newest.customerName} - ${formatCurrency(newest.totalAmount)}`,
                placement: 'topRight',
                duration: 5,
              });
            }
          }

          setOrders(list);
          setTotalElements(res.data.totalElements ?? list.length);
          knownOrderIdsRef.current = new Set(list.map((o) => o.id));
        }
      } catch {
        if (!silent) message.error('Không thể tải danh sách đơn hàng');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [currentRestaurantId]
  );

  // Debounce search effect (400ms)
  const isFirstSearch = useRef(true);
  useEffect(() => {
    if (isFirstSearch.current) {
      isFirstSearch.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setPage(0);
      fetchOrders(false, 0, pageSize, searchText, activeTab);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText, pageSize, activeTab, fetchOrders]);

  // Switch tab handler
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setPage(0);
    fetchOrders(false, 0, pageSize, searchText, newTab);
  };

  // Initial load, WebSocket connection & Polling setup
  useEffect(() => {
    fetchOrders(false, 0, pageSize, searchText, activeTab);
    fetchCounts();

    // 1. Connect WebSocket STOMP
    merchantWebSocket.connect(currentRestaurantId);

    // 2. Subscribe to WebSocket connection status
    const unsubStatus = merchantWebSocket.subscribeConnectionStatus((status) => {
      setWsStatus(status);
    });

    // 3. Subscribe to Realtime Incoming Order Notification
    const unsubOrder = merchantWebSocket.subscribeOrderNotification((incomingOrder) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === incomingOrder.id);
        if (exists) {
          return prev.map((o) => (o.id === incomingOrder.id ? incomingOrder : o));
        }
        return [incomingOrder, ...prev];
      });

      knownOrderIdsRef.current.add(incomingOrder.id);
      fetchCounts();

      // Show notification popup with action
      notification.open({
        message: (
          <span className="font-bold text-slate-900 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            ĐƠN HÀNG MỚI ĐỔ VỀ TỨC THÌ!
          </span>
        ),
        description: (
          <div className="space-y-1 text-xs text-slate-600">
            <div>
              <strong className="text-slate-800">{incomingOrder.orderCode}</strong> • {incomingOrder.customerName} (
              {incomingOrder.customerPhone})
            </div>
            <div className="text-orange-600 font-bold">
              Tổng tiền: {formatCurrency(incomingOrder.totalAmount)} ({incomingOrder.paymentMethod || 'COD'})
            </div>
            <div className="text-slate-500 line-clamp-1">{incomingOrder.receiverAddress}</div>
          </div>
        ),
        btn: (
          <Button
            type="primary"
            size="small"
            style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
            onClick={() => {
              handleTabChange('PENDING');
              setViewingOrderDetail(incomingOrder);
              setIsDetailDrawerOpen(true);
            }}
          >
            Xem ngay
          </Button>
        ),
        duration: 7,
      });

      // Automatically switch to PENDING tab so merchant sees it immediately
      handleTabChange('PENDING');
    });

    // 4. Fallback Polling (Every 15s) for Double Safety
    const pollInterval = setInterval(() => {
      const p = currentParamsRef.current;
      fetchOrders(true, p.page, p.pageSize, p.searchText, p.activeTab);
      fetchCounts();
    }, 15000);

    return () => {
      unsubStatus();
      unsubOrder();
      clearInterval(pollInterval);
      merchantWebSocket.disconnect();
    };
  }, [currentRestaurantId]);

  // Filter orders based on active tab and search
  const filteredOrders = orders;

  // Statistics counts for all tabs from state
  const pendingCount = counts.pending;
  const confirmedCount = counts.confirmed;
  const completedCount = counts.completed;
  const cancelledCount = counts.cancelled;

  // Toggle Sound Notification
  const handleToggleSound = () => {
    const next = !soundEnabled;
    soundManager.setEnabled(next);
    setSoundEnabled(next);
    if (next) {
      soundManager.playOrderChime();
      message.success('Đã BẬT âm thanh chuông báo đơn mới 🔔');
    } else {
      message.info('Đã TẮT chuông báo đơn');
    }
  };

  // Test Sound Chime
  const handleTestSound = () => {
    soundManager.testChime();
    message.success('🔊 Đang phát thử chuông báo đơn ("Ding-Dong")...');
  };

  // Simulate Incoming Order via WebSocket
  const handleSimulateIncomingOrder = () => {
    const newOrder = merchantWebSocket.simulateIncomingOrder();
    message.success(`Đã kích hoạt giả lập đơn hàng mới: ${newOrder.orderCode}`);
  };

  // Action: Confirm Order (Nhà bếp nhận đơn nấu)
  const handleConfirmOrder = async (order: MerchantOrder) => {
    setSubmittingAction(true);
    try {
      await orderApi.confirmOrderByMerchant(order.id);
      message.success(`Đã nhận đơn ${order.orderCode}! Nhà bếp bắt đầu chuẩn bị món.`);
      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, statusCode: 'CONFIRMED', statusLabel: 'Quán đang chuẩn bị món' }
            : o
        )
      );
      if (viewingOrderDetail && viewingOrderDetail.id === order.id) {
        setViewingOrderDetail({
          ...viewingOrderDetail,
          statusCode: 'CONFIRMED',
          statusLabel: 'Quán đang chuẩn bị món',
        });
      }
      fetchCounts();
    } catch {
      message.error('Không thể xác nhận đơn hàng, vui lòng thử lại');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Action: Open Cancel Modal
  const handleOpenCancelModal = (order: MerchantOrder) => {
    setSelectedOrderToCancel(order);
    setCancelReasonPreset(CANCEL_REASONS[0]);
    setCustomCancelReason('');
    setIsCancelModalOpen(true);
  };

  // Action: Submit Cancel Order
  const handleSubmitCancelOrder = async () => {
    if (!selectedOrderToCancel) return;

    const finalReason =
      cancelReasonPreset === CANCEL_REASONS[4]
        ? customCancelReason.trim() || 'Hết món / Quán quá tải'
        : cancelReasonPreset;

    setSubmittingAction(true);
    try {
      await orderApi.cancelOrderByMerchant(selectedOrderToCancel.id, finalReason);
      message.warning(`Đã từ chối/hủy đơn hàng ${selectedOrderToCancel.orderCode}`);
      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrderToCancel.id
            ? {
                ...o,
                statusCode: 'CANCELLED',
                statusLabel: 'Đã hủy',
                cancelReason: finalReason,
              }
            : o
        )
      );
      if (viewingOrderDetail && viewingOrderDetail.id === selectedOrderToCancel.id) {
        setViewingOrderDetail({
          ...viewingOrderDetail,
          statusCode: 'CANCELLED',
          statusLabel: 'Đã hủy',
          cancelReason: finalReason,
        });
      }
      setIsCancelModalOpen(false);
      setSelectedOrderToCancel(null);
      fetchCounts();
    } catch {
      message.error('Lỗi khi từ chối đơn hàng');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar with WebSocket Status & Audio Controls */}
      <MerchantHeader
        wsStatus={wsStatus}
        soundEnabled={soundEnabled}
        loading={loading}
        onToggleSound={handleToggleSound}
        onTestSound={handleTestSound}
        onSimulateOrder={handleSimulateIncomingOrder}
        onRefresh={() => {
          fetchOrders(false);
          merchantWebSocket.resetConnection();
        }}
      />

      {/* 2. Overview Statistics KPI Cards */}
      <MerchantStats
        pendingCount={pendingCount}
        confirmedCount={confirmedCount}
        completedCount={completedCount}
        cancelledCount={cancelledCount}
        activeTab={activeTab}
        onSelectTab={handleTabChange}
      />

      {/* 3. Main Order Feed & Filter Card */}
      <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-3">
          {/* Status Tabs */}
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            className="font-medium !mb-0"
            items={[
              {
                key: 'ALL',
                label: <span>Tất cả ({totalElements})</span>,
              },
              {
                key: 'PENDING',
                label: (
                  <Badge count={pendingCount} offset={[10, 0]} color="#f59e0b">
                    <span className="pr-2 font-bold text-amber-700">Đơn mới (PENDING)</span>
                  </Badge>
                ),
              },
              {
                key: 'CONFIRMED',
                label: (
                  <Badge count={confirmedCount} offset={[10, 0]} color="#3b82f6">
                    <span className="pr-2 text-blue-700">Đang nấu (CONFIRMED)</span>
                  </Badge>
                ),
              },
              {
                key: 'COMPLETED',
                label: (
                  <Badge count={completedCount} offset={[10, 0]} color="#10b981">
                    <span className="pr-2 text-emerald-700">Hoàn thành (COMPLETED)</span>
                  </Badge>
                ),
              },
              {
                key: 'CANCELLED',
                label: (
                  <Badge count={cancelledCount} offset={[10, 0]} color="#ef4444">
                    <span className="pr-2 text-rose-700">Đã hủy (CANCELLED)</span>
                  </Badge>
                ),
              },
            ]}
          />

          {/* Search Box */}
          <div className="w-full md:w-80">
            <Input
              placeholder="Tìm theo mã đơn, khách hàng, món..."
              prefix={<SearchOutlined className="text-slate-400" />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="rounded-lg"
            />
          </div>
        </div>

        {/* Order Feed List */}
        {loading ? (
          <div className="py-20 text-center">
            <Spin size="large" />
            <div className="mt-3 text-slate-500 font-medium">Đang đồng bộ danh sách đơn hàng...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Empty
            description={
              <div className="text-slate-500 py-4">
                Không tìm thấy đơn hàng nào trong tab này{' '}
                {searchText && <span>với từ khóa "{searchText}"</span>}
              </div>
            }
            className="py-12"
          />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <MerchantOrderCard
                key={order.id}
                order={order}
                submittingAction={submittingAction}
                onConfirmOrder={handleConfirmOrder}
                onOpenCancelModal={handleOpenCancelModal}
                onViewDetail={(o) => {
                  setViewingOrderDetail(o);
                  setIsDetailDrawerOpen(true);
                }}
              />
            ))}

            {/* Pagination Controls */}
            {totalElements > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100 mt-4 px-2">
                <span className="text-xs text-slate-500">
                  Hiển thị trang <strong className="text-slate-700">{page + 1}</strong> / {Math.ceil(totalElements / pageSize) || 1} ({totalElements} đơn)
                </span>
                <Pagination
                  current={page + 1}
                  pageSize={pageSize}
                  total={totalElements}
                  showSizeChanger
                  pageSizeOptions={['5', '10', '20', '50']}
                  onChange={(newPage, newPageSize) => {
                    const zeroBased = newPage - 1;
                    setPage(zeroBased);
                    setPageSize(newPageSize);
                    fetchOrders(false, zeroBased, newPageSize, searchText, activeTab);
                  }}
                  showTotal={(total, range) => `${range[0]}-${range[1]} của ${total}`}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 4. Modal: Báo quán hết món / Từ chối đơn */}
      <MerchantCancelModal
        isOpen={isCancelModalOpen}
        selectedOrder={selectedOrderToCancel}
        presetReason={cancelReasonPreset}
        customReason={customCancelReason}
        submitting={submittingAction}
        onPresetChange={setCancelReasonPreset}
        onCustomChange={setCustomCancelReason}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedOrderToCancel(null);
        }}
        onSubmit={handleSubmitCancelOrder}
      />

      {/* 5. Drawer: Xem chi tiết toàn bộ đơn hàng */}
      <MerchantOrderDetailDrawer
        isOpen={isDetailDrawerOpen}
        order={viewingOrderDetail}
        submittingAction={submittingAction}
        onClose={() => setIsDetailDrawerOpen(false)}
        onConfirmOrder={handleConfirmOrder}
        onOpenCancelModal={handleOpenCancelModal}
      />
    </div>
  );
};

export default MerchantDashboardPage;
