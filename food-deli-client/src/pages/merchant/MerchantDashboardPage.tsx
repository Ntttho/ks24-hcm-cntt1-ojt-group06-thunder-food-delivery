import React, { useState, useEffect, useMemo, useRef } from 'react';
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
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { orderApi, type MerchantOrder } from '@/services/modules/orderApi';
import { merchantWebSocket } from '@/services/modules/merchantWebSocket';
import { soundManager } from '@/utils/soundNotification';
import { formatCurrency } from '@/utils/formatters';
import {
  MerchantHeader,
  MerchantStats,
  MerchantOrderCard,
  MerchantCancelModal,
  MerchantOrderDetailDrawer,
  CANCEL_REASONS,
} from './components';

export const MerchantDashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('PENDING');
  const [searchText, setSearchText] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundManager.isEnabled());
  const [wsStatus, setWsStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');

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

  // Load orders from API
  const fetchOrders = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await orderApi.getMerchantOrders(1);
      if (res && res.data) {
        // Detect if any new PENDING orders arrived during polling
        if (knownOrderIdsRef.current.size > 0) {
          const newPendingOrders = res.data.filter(
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

        setOrders(res.data);
        knownOrderIdsRef.current = new Set(res.data.map((o) => o.id));
      }
    } catch {
      if (!silent) message.error('Không thể tải danh sách đơn hàng');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load, WebSocket connection & Polling setup
  useEffect(() => {
    fetchOrders();

    // 1. Connect WebSocket STOMP
    merchantWebSocket.connect(1);

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
              setActiveTab('PENDING');
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
      setActiveTab('PENDING');
    });

    // 4. Fallback Polling (Every 15s) for Double Safety
    const pollInterval = setInterval(() => {
      fetchOrders(true);
    }, 15000);

    return () => {
      unsubStatus();
      unsubOrder();
      clearInterval(pollInterval);
      merchantWebSocket.disconnect();
    };
  }, []);

  // Filter orders based on active tab and search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesTab =
        activeTab === 'ALL' ? true : order.statusCode === activeTab;

      const q = searchText.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        order.orderCode.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.includes(q) ||
        order.items.some((it) => it.foodName.toLowerCase().includes(q));

      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchText]);

  // Statistics counts for all tabs
  const pendingCount = useMemo(
    () => orders.filter((o) => o.statusCode === 'PENDING').length,
    [orders]
  );
  const confirmedCount = useMemo(
    () => orders.filter((o) => o.statusCode === 'CONFIRMED').length,
    [orders]
  );
  const completedCount = useMemo(
    () => orders.filter((o) => o.statusCode === 'COMPLETED').length,
    [orders]
  );
  const cancelledCount = useMemo(
    () => orders.filter((o) => o.statusCode === 'CANCELLED').length,
    [orders]
  );

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
        onRefresh={() => fetchOrders(false)}
      />

      {/* 2. Overview Statistics KPI Cards */}
      <MerchantStats
        pendingCount={pendingCount}
        confirmedCount={confirmedCount}
        completedCount={completedCount}
        cancelledCount={cancelledCount}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {/* 3. Main Order Feed & Filter Card */}
      <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-3">
          {/* Status Tabs */}
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            className="font-medium !mb-0"
            items={[
              {
                key: 'ALL',
                label: <span>Tất cả ({orders.length})</span>,
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
