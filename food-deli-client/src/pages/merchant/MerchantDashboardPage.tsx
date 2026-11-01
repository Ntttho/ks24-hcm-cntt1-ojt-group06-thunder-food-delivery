import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Card,
  Tabs,
  Button,
  Tag,
  Typography,
  Modal,
  Drawer,
  Radio,
  Input,
  Row,
  Col,
  Statistic,
  Empty,
  Spin,
  Badge,
  Tooltip,
  notification,
  message,
  Divider,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  DollarOutlined,
  FireOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  SoundOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  CreditCardOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { orderApi, type MerchantOrder } from '@/services/modules/orderApi';
import { merchantWebSocket } from '@/services/modules/merchantWebSocket';
import { soundManager } from '@/utils/soundNotification';
import { formatCurrency, formatDate } from '@/utils/formatters';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const CANCEL_REASONS = [
  'Quán tạm hết nguyên liệu chế biến món ăn',
  'Quán đang quá tải đơn, không kịp phục vụ',
  'Khách hàng gọi điện yêu cầu hủy đơn',
  'Quán có việc đột xuất phải đóng cửa sớm',
  'Lý do khác (Vui lòng nhập chi tiết bên dưới)',
];

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
        // Update known IDs
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

    // 2. Subscribe to WebSocket status
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

    // 4. Fallback Polling (Every 15s) for Double Resilience
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
  const totalRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.statusCode === 'CONFIRMED' || o.statusCode === 'COMPLETED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
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
      // Update local state snappy
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

  // Render Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Tag color="gold" className="font-semibold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
            <ClockCircleOutlined /> Đơn mới (PENDING)
          </Tag>
        );
      case 'CONFIRMED':
        return (
          <Tag color="processing" className="font-semibold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
            <FireOutlined /> Đang nấu (CONFIRMED)
          </Tag>
        );
      case 'COMPLETED':
        return (
          <Tag color="success" className="font-semibold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
            <CheckCircleOutlined /> Hoàn thành (COMPLETED)
          </Tag>
        );
      case 'CANCELLED':
        return (
          <Tag color="error" className="font-semibold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
            <CloseCircleOutlined /> Đã hủy (CANCELLED)
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // Payment Badge
  const getPaymentBadge = (method?: string) => {
    if (method === 'VNPAY') {
      return (
        <Tag color="blue" className="rounded-md font-semibold text-[11px] px-2 py-0.5">
          <CreditCardOutlined className="mr-1" /> VNPay (Đã thanh toán)
        </Tag>
      );
    }
    return (
      <Tag color="orange" className="rounded-md font-semibold text-[11px] px-2 py-0.5">
        <DollarOutlined className="mr-1" /> Tiền mặt (COD)
      </Tag>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Realtime Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <Title level={3} className="!mb-0 text-slate-800">
              Tiếp Nhận &amp; Xử Lý Đơn Hàng (Realtime)
            </Title>
            {/* Realtime WebSocket Badge */}
            {wsStatus === 'CONNECTED' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                WebSocket Realtime
              </span>
            ) : wsStatus === 'CONNECTING' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <SyncOutlined spin className="text-amber-500" />
                Đang kết nối WS...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                Auto-Polling (Bảo vệ)
              </span>
            )}
          </div>
          <Text className="text-slate-500 text-xs sm:text-sm mt-1 block">
            Hệ thống tự động phát chuông báo khi có đơn mới từ khách. Quán xác nhận để nhà bếp chuẩn bị món.
          </Text>
        </div>

        {/* Quick Action Controls: Sound Toggle, Sound Test, Simulation, Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip title={soundEnabled ? 'Bấm để tắt chuông báo' : 'Bấm để bật chuông báo'}>
            <Button
              type={soundEnabled ? 'primary' : 'default'}
              icon={<SoundOutlined />}
              onClick={handleToggleSound}
              style={soundEnabled ? { backgroundColor: '#10b981', borderColor: '#10b981' } : {}}
              className="rounded-lg font-medium"
            >
              {soundEnabled ? 'Chuông: BẬT' : 'Chuông: TẮT'}
            </Button>
          </Tooltip>

          <Tooltip title="Nghe thử tiếng chuông hai âm sắc (Web Audio API)">
            <Button
              type="default"
              icon={<SoundOutlined className="text-orange-500" />}
              onClick={handleTestSound}
              className="rounded-lg font-medium hover:border-orange-400"
            >
              Thử chuông
            </Button>
          </Tooltip>

          <Tooltip title="Mô phỏng 1 đơn hàng mới đổ về để kiểm tra chuông reo & popup WebSocket">
            <Button
              type="default"
              icon={<ThunderboltOutlined className="text-amber-500" />}
              onClick={handleSimulateIncomingOrder}
              className="rounded-lg font-medium border-amber-300 text-amber-700 bg-amber-50/50 hover:bg-amber-100"
            >
              Giả lập đơn mới
            </Button>
          </Tooltip>

          <Button
            type="default"
            icon={<SyncOutlined spin={loading} />}
            onClick={() => fetchOrders(false)}
            className="rounded-lg shadow-xs"
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* Overview Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card
            className={`rounded-2xl border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/60 shadow-xs cursor-pointer transition-all ${
              activeTab === 'PENDING' ? 'ring-2 ring-amber-400' : ''
            }`}
            onClick={() => setActiveTab('PENDING')}
          >
            <Statistic
              title={<span className="text-xs font-semibold text-amber-800">Đơn Mới Chờ Nhận</span>}
              value={pendingCount}
              valueStyle={{ color: '#d97706', fontWeight: 800 }}
              prefix={<ClockCircleOutlined className="text-amber-500 mr-1" />}
              suffix={
                pendingCount > 0 ? (
                  <span className="relative flex h-2.5 w-2.5 ml-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                ) : null
              }
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            className={`rounded-2xl border-blue-200/80 bg-gradient-to-br from-blue-50 to-indigo-50/60 shadow-xs cursor-pointer transition-all ${
              activeTab === 'CONFIRMED' ? 'ring-2 ring-blue-400' : ''
            }`}
            onClick={() => setActiveTab('CONFIRMED')}
          >
            <Statistic
              title={<span className="text-xs font-semibold text-blue-800">Đang Nấu Chuẩn Bị</span>}
              value={confirmedCount}
              valueStyle={{ color: '#2563eb', fontWeight: 800 }}
              prefix={<FireOutlined className="text-blue-500 mr-1" />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            className={`rounded-2xl border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50/60 shadow-xs cursor-pointer transition-all ${
              activeTab === 'COMPLETED' ? 'ring-2 ring-emerald-400' : ''
            }`}
            onClick={() => setActiveTab('COMPLETED')}
          >
            <Statistic
              title={<span className="text-xs font-semibold text-emerald-800">Đã Hoàn Thành</span>}
              value={completedCount}
              valueStyle={{ color: '#059669', fontWeight: 800 }}
              prefix={<CheckCircleOutlined className="text-emerald-500 mr-1" />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            className={`rounded-2xl border-rose-200/80 bg-gradient-to-br from-rose-50 to-red-50/60 shadow-xs cursor-pointer transition-all ${
              activeTab === 'CANCELLED' ? 'ring-2 ring-rose-400' : ''
            }`}
            onClick={() => setActiveTab('CANCELLED')}
          >
            <Statistic
              title={<span className="text-xs font-semibold text-rose-800">Đã Hủy / Từ Chối</span>}
              value={cancelledCount}
              valueStyle={{ color: '#e11d48', fontWeight: 800 }}
              prefix={<CloseCircleOutlined className="text-rose-500 mr-1" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Order Feed & Filter Card */}
      <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-3">
          {/* Status Tabs matching exactly the user story */}
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
            {filteredOrders.map((order) => {
              const isPending = order.statusCode === 'PENDING';
              const isConfirmed = order.statusCode === 'CONFIRMED';
              const isCompleted = order.statusCode === 'COMPLETED';
              const isCancelled = order.statusCode === 'CANCELLED';

              return (
                <div
                  key={order.id}
                  className={`border rounded-2xl p-5 transition-all ${
                    isPending
                      ? 'border-amber-300 bg-amber-50/20 shadow-md ring-1 ring-amber-300/50 hover:shadow-lg'
                      : isConfirmed
                      ? 'border-blue-200 bg-white hover:border-blue-300 hover:shadow-xs'
                      : isCompleted
                      ? 'border-emerald-200 bg-emerald-50/10 hover:border-emerald-300'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  {/* Order Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-base font-bold text-slate-900 tracking-tight">
                        {order.orderCode}
                      </span>
                      {getStatusBadge(order.statusCode)}
                      {getPaymentBadge(order.paymentMethod)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <ClockCircleOutlined />
                        {formatDate(order.createdAt)}
                      </span>
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setViewingOrderDetail(order);
                          setIsDetailDrawerOpen(true);
                        }}
                        className="text-orange-600 font-semibold p-0 h-auto"
                      >
                        Chi tiết đơn
                      </Button>
                    </div>
                  </div>

                  {/* Customer Information & Address */}
                  <Row gutter={[16, 12]} className="mb-4">
                    <Col xs={24} md={12}>
                      <div className="space-y-1.5 text-xs text-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {order.customerName}
                          </span>
                          <span className="text-slate-400">•</span>
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="text-orange-600 font-semibold hover:underline flex items-center gap-1"
                          >
                            <PhoneOutlined />
                            {order.customerPhone}
                          </a>
                        </div>
                        <div className="flex items-start gap-1.5 text-slate-600">
                          <EnvironmentOutlined className="mt-0.5 text-orange-500 flex-shrink-0" />
                          <span className="line-clamp-2">{order.receiverAddress}</span>
                        </div>
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      {/* Customer Note or Cancellation Reason */}
                      {isCancelled && order.cancelReason && (
                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                          <span className="font-semibold block mb-0.5">
                            <ExclamationCircleOutlined className="mr-1" />
                            Lý do hủy đơn:
                          </span>
                          {order.cancelReason}
                        </div>
                      )}

                      {!isCancelled && order.customerNote && (
                        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-800">
                          <span className="font-semibold block mb-0.5">
                            <FileTextOutlined className="mr-1 text-amber-600" />
                            Ghi chú của khách:
                          </span>
                          "{order.customerNote}"
                        </div>
                      )}
                    </Col>
                  </Row>

                  {/* Order Items & Toppings List */}
                  <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-100 mb-4 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                      <span>Món ăn &amp; Topping đính kèm</span>
                      <span>{order.items.length} món</span>
                    </div>
                    {order.items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-start justify-between text-xs py-1.5 border-b border-slate-200/50 last:border-0"
                      >
                        <div className="space-y-0.5 pr-2">
                          <div className="font-semibold text-slate-800">
                            <span className="inline-block w-6 text-orange-600 font-bold">
                              {item.quantity}x
                            </span>
                            {item.foodName}
                          </div>
                          {item.toppings && item.toppings.length > 0 && (
                            <div className="pl-6 text-[11px] text-slate-500 space-x-1">
                              <span className="font-medium text-slate-600">Topping:</span>
                              {item.toppings.map((t, tIdx) => (
                                <Tag key={tIdx} className="text-[10px] py-0 px-1.5 border-slate-200 bg-white">
                                  + {t.name} ({formatCurrency(t.price)})
                                </Tag>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="font-semibold text-slate-700 whitespace-nowrap">
                          {formatCurrency(item.priceAtOrder * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer: Price Summary & Business Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-slate-500 font-medium">Tổng tiền thu:</span>
                      <span className="text-lg font-extrabold text-orange-600">
                        {formatCurrency(order.totalAmount)}
                      </span>
                      <span className="text-xs text-slate-400">
                        (Món: {formatCurrency(order.subtotalAmount)} | Ship: {formatCurrency(order.shippingFee)})
                      </span>
                    </div>

                    {/* Decision Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {isPending && (
                        <>
                          <Button
                            danger
                            onClick={() => handleOpenCancelModal(order)}
                            className="rounded-lg font-medium"
                          >
                            Báo hết món / Từ chối đơn
                          </Button>
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleConfirmOrder(order)}
                            loading={submittingAction}
                            style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                            className="rounded-lg font-bold px-4 shadow-sm"
                          >
                            Xác nhận nhận đơn
                          </Button>
                        </>
                      )}

                      {isConfirmed && (
                        <div className="flex items-center gap-2">
                          <Tag color="processing" className="text-xs px-3 py-1 font-semibold rounded-lg">
                            <FireOutlined className="mr-1" /> Nhà bếp đang nấu • Chờ Shipper
                          </Tag>
                          <Button
                            size="small"
                            danger
                            type="link"
                            onClick={() => handleOpenCancelModal(order)}
                            className="text-xs"
                          >
                            Hủy đột xuất
                          </Button>
                        </div>
                      )}

                      {isCompleted && (
                        <Tag color="success" className="text-xs px-3 py-1 font-semibold rounded-lg">
                          <CheckOutlined className="mr-1" /> Đã hoàn thành &amp; Thu tiền
                        </Tag>
                      )}

                      {isCancelled && (
                        <Tag color="default" className="text-xs px-3 py-1 text-slate-500 rounded-lg">
                          Đã hủy
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal: Báo quán hết món / Từ chối đơn */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
            <CloseCircleOutlined />
            <span>Từ chối / Hủy đơn hàng {selectedOrderToCancel?.orderCode}</span>
          </div>
        }
        open={isCancelModalOpen}
        onCancel={() => {
          setIsCancelModalOpen(false);
          setSelectedOrderToCancel(null);
        }}
        onOk={handleSubmitCancelOrder}
        confirmLoading={submittingAction}
        okText="Xác nhận từ chối đơn"
        okButtonProps={{ danger: true, className: 'font-semibold' }}
        cancelText="Đóng"
        destroyOnClose
      >
        <div className="py-2 space-y-4">
          <Paragraph className="text-slate-600 text-xs mb-3">
            Vui lòng chọn lý do quán từ chối đơn để hệ thống thông báo rõ ràng đến Khách hàng và hoàn tiền (nếu thanh toán online):
          </Paragraph>

          <Radio.Group
            value={cancelReasonPreset}
            onChange={(e) => setCancelReasonPreset(e.target.value)}
            className="flex flex-col gap-2.5"
          >
            {CANCEL_REASONS.map((reason) => (
              <Radio key={reason} value={reason} className="text-xs text-slate-700">
                {reason}
              </Radio>
            ))}
          </Radio.Group>

          {cancelReasonPreset === CANCEL_REASONS[4] && (
            <div className="mt-2">
              <TextArea
                rows={3}
                placeholder="Nhập chi tiết lý do quán từ chối đơn..."
                value={customCancelReason}
                onChange={(e) => setCustomCancelReason(e.target.value)}
                maxLength={200}
                showCount
                className="text-xs rounded-lg"
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Drawer: Xem chi tiết toàn bộ đơn hàng */}
      <Drawer
        title={
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Chi tiết đơn {viewingOrderDetail?.orderCode}</span>
              {viewingOrderDetail && getStatusBadge(viewingOrderDetail.statusCode)}
            </div>
          </div>
        }
        placement="right"
        width={540}
        onClose={() => setIsDetailDrawerOpen(false)}
        open={isDetailDrawerOpen}
      >
        {viewingOrderDetail && (
          <div className="space-y-5 text-sm">
            {/* Customer Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                Thông tin người nhận
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{viewingOrderDetail.customerName}</span>
                <a
                  href={`tel:${viewingOrderDetail.customerPhone}`}
                  className="text-orange-600 font-bold hover:underline flex items-center gap-1"
                >
                  <PhoneOutlined /> {viewingOrderDetail.customerPhone}
                </a>
              </div>
              <div className="flex items-start gap-1.5 text-xs text-slate-600">
                <EnvironmentOutlined className="mt-0.5 text-orange-500 flex-shrink-0" />
                <span>{viewingOrderDetail.receiverAddress}</span>
              </div>
              {viewingOrderDetail.customerNote && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-xs text-amber-800">
                  <strong>Ghi chú của khách:</strong> "{viewingOrderDetail.customerNote}"
                </div>
              )}
            </div>

            {/* Payment & Order Meta */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-400 block mb-1">Phương thức thanh toán:</span>
                <div>{getPaymentBadge(viewingOrderDetail.paymentMethod)}</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-400 block mb-1">Thời gian đặt:</span>
                <span className="font-medium text-slate-700">{formatDate(viewingOrderDetail.createdAt)}</span>
              </div>
            </div>

            {/* Items Breakdown */}
            <div>
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-2">
                Danh sách món ăn &amp; Topping ({viewingOrderDetail.items.length})
              </div>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {viewingOrderDetail.items.map((item, i) => (
                  <div key={i} className="p-3 bg-white space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-900">
                        <span className="text-orange-600 font-bold mr-1.5">{item.quantity}x</span>
                        {item.foodName}
                      </span>
                      <span className="font-bold text-slate-700">
                        {formatCurrency(item.priceAtOrder * item.quantity)}
                      </span>
                    </div>
                    {item.toppings && item.toppings.length > 0 && (
                      <div className="pl-5 text-[11px] text-slate-500 space-y-0.5">
                        {item.toppings.map((t, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>+ {t.name} (x{t.quantity || 1})</span>
                            <span>{formatCurrency(t.price * (t.quantity || 1))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Billing breakdown */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tổng tiền món:</span>
                <span>{formatCurrency(viewingOrderDetail.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí vận chuyển:</span>
                <span>{formatCurrency(viewingOrderDetail.shippingFee)}</span>
              </div>
              {viewingOrderDetail.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Giảm giá voucher:</span>
                  <span>-{formatCurrency(viewingOrderDetail.discountAmount)}</span>
                </div>
              )}
              <Divider className="my-2" />
              <div className="flex justify-between text-sm font-bold text-slate-900">
                <span>Tổng thanh toán:</span>
                <span className="text-base text-orange-600">
                  {formatCurrency(viewingOrderDetail.totalAmount)}
                </span>
              </div>
            </div>

            {/* Action buttons inside drawer */}
            {viewingOrderDetail.statusCode === 'PENDING' && (
              <div className="pt-2 flex gap-3">
                <Button
                  danger
                  block
                  onClick={() => handleOpenCancelModal(viewingOrderDetail)}
                  className="rounded-lg font-medium"
                >
                  Từ chối đơn
                </Button>
                <Button
                  type="primary"
                  block
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleConfirmOrder(viewingOrderDetail)}
                  loading={submittingAction}
                  style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                  className="rounded-lg font-bold shadow-sm"
                >
                  Xác nhận nhận đơn
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default MerchantDashboardPage;
