import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Tag,
  Button,
  Spin,
  Typography,
  Tooltip,
  FloatButton,
  Badge,
  notification,
  message,
  Modal,
  Radio,
  Input,
} from 'antd';
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  UserOutlined,
  ThunderboltFilled,
  HomeOutlined,
  StarFilled,
  ShopOutlined,
  CarOutlined,
  MessageOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { orderApi } from '@/services/modules/orderApi';
import { reviewApi } from '@/services/api/reviewApi';
import { chatApi } from '@/services/modules/chatApi';
import { soundManager } from '@/utils/soundNotification';
import { maskPhoneNumber } from '@/utils/privacyMask';
import { orderLiveTrackingWs } from '@/services/modules/orderLiveTrackingWebSocket';
import type { CustomerOrder } from '@/types';
import { APP_ROUTES } from '@/constants';
import {
  OrderLiveTrackingStepper,
  OrderContactCards,
  OrderItemsBreakdown,
  RestaurantReviewModal,
  DriverReviewModal,
  OrderChatDrawer,
} from './components';
import { RealMapRouteView } from '@/components/map/RealMapRouteView';

const { Title, Text } = Typography;

const ORDER_STATUS_CODES_BY_ID: Record<number, string> = {
  1: 'PENDING',
  2: 'DRIVER_ACCEPTED',
  3: 'DRIVER_REJECTED',
  4: 'CONFIRMED',
  5: 'PICKING_UP',
  6: 'DELIVERING',
  7: 'COMPLETED',
  8: 'CANCELLED',
  9: 'TIMEOUT',
  10: 'AWAITING_PAYMENT',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  DRIVER_ACCEPTED: 'Tài xế đã nhận đơn',
  DRIVER_REJECTED: 'Tài xế đã từ chối',
  CONFIRMED: 'Quán đã xác nhận',
  PREPARING: 'Quán đang chế biến',
  PICKING_UP: 'Tài xế đang lấy món',
  READY_FOR_PICKUP: 'Chờ tài xế lấy món',
  PICKED_UP: 'Đang giao hàng',
  DELIVERING: 'Đang giao hàng',
  COMPLETED: 'Giao thành công',
  DELIVERED: 'Giao thành công',
  CANCELLED: 'Đã hủy',
  TIMEOUT: 'Hết thời gian xử lý',
  AWAITING_PAYMENT: 'Chờ thanh toán',
};

interface OrderStatusPayload {
  orderStatusId?: number | string;
  statusId?: number | string;
  orderStatus?: { id?: number | string; code?: string };
  status?: { id?: number | string; code?: string };
  statusCode?: string;
}

const getOrderStatusCode = (data: OrderStatusPayload): string => {
  if (data.statusCode) return data.statusCode.toUpperCase();
  if (data.orderStatus?.code) return data.orderStatus.code.toUpperCase();
  if (data.status?.code) return data.status.code.toUpperCase();

  const rawId = data.orderStatusId ?? data.statusId ?? data.orderStatus?.id ?? data.status?.id;
  if (rawId !== undefined && rawId !== null) {
    const numericId = Number(rawId);
    if (ORDER_STATUS_CODES_BY_ID[numericId]) {
      return ORDER_STATUS_CODES_BY_ID[numericId];
    }
  }

  return 'PENDING';
};

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRestaurantReviewOpen, setIsRestaurantReviewOpen] = useState<boolean>(false);
  const [isDriverReviewOpen, setIsDriverReviewOpen] = useState<boolean>(false);
  const [restaurantReviewed, setRestaurantReviewed] = useState<boolean>(false);
  const [driverReviewed, setDriverReviewed] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [driverLiveCoords, setDriverLiveCoords] = useState<{
    lat: number;
    lng: number;
    heading?: number;
    speedKmh?: number;
  } | null>(null);

  // Đếm ngược 60s cho phép khách hủy đơn khi quán chưa chế biến
  const [cancelSecondsLeft, setCancelSecondsLeft] = useState<number>(0);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Đổi ý, không muốn đặt nữa');
  const [otherCancelReason, setOtherCancelReason] = useState<string>('');
  const [cancelling, setCancelling] = useState<boolean>(false);

  // Timer 60s tính từ order.createdAt
  useEffect(() => {
    if (!order || !order.createdAt) return;
    const canCancel = order.statusCode === 'PENDING' || order.statusCode === 'AWAITING_PAYMENT';
    if (!canCancel) {
      setCancelSecondsLeft(0);
      return;
    }

    const calculateRemaining = () => {
      const orderTime = new Date(order.createdAt).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - orderTime) / 1000);
      return Math.max(0, 60 - elapsedSeconds);
    };

    setCancelSecondsLeft(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setCancelSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [order?.createdAt, order?.statusCode]);

  const handleConfirmCancelOrder = async () => {
    if (!order) return;
    const finalReason = cancelReason === 'Lý do khác' && otherCancelReason.trim()
      ? otherCancelReason.trim()
      : cancelReason;
    try {
      setCancelling(true);
      const res = await orderApi.cancelOrder(order.id, finalReason);
      if (res) {
        message.success('Đã hủy đơn hàng thành công!');
        setOrder((prev) => prev ? {
          ...prev,
          statusCode: 'CANCELLED',
          statusLabel: 'Đã hủy',
        } : null);
        setIsCancelModalOpen(false);
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể hủy đơn hàng vào lúc này');
    } finally {
      setCancelling(false);
    }
  };

  // 1. Initial Order Fetch
  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await orderApi.getById(id);
        if (res && res.data) {
          const data = res.data;
          const statusCode = getOrderStatusCode(data);
          const mappedOrder: CustomerOrder = {
            id: Number(data.id),
            orderCode: data.orderCode || `#ORD-${data.id}`,
            customerId: Number(data.customerId || 1),
            customerName: data.customerName || 'Khách hàng',
            customerPhone: data.customerPhone || '0987654321',
            restaurantId: Number(data.restaurantId || 1),
            restaurantName: data.restaurantName || (Number(data.restaurantId) === 1 ? 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi' : 'Quán ăn đối tác'),
            restaurantAddress: data.restaurantAddress || '123 Nguyễn Trãi, Phường 2, Quận 5, TP.HCM',
            restaurantLat: data.restaurantLat ? Number(data.restaurantLat) : 10.7769,
            restaurantLng: data.restaurantLng ? Number(data.restaurantLng) : 106.7009,
            driverId: data.driverId ? Number(data.driverId) : undefined,
            driverName: data.driverName || (data.driverId ? (Number(data.driverId) === 2 ? 'Tran Thi B' : 'Tài xế Thunder') : undefined),
            driverPhone: data.driverPhone || (data.driverId ? '0900000002' : undefined),
            receiverAddress: data.receiverAddress || 'Chưa cập nhật địa chỉ giao hàng',
            receiverLat: data.receiverLat ? Number(data.receiverLat) : 10.7925,
            receiverLng: data.receiverLng ? Number(data.receiverLng) : 106.7214,
            note: (data as any).note || '',
            distanceKm: Number(data.distanceKm || 2.1),
            subtotalAmount: Number(data.subtotalAmount || 0),
            shippingFee: Number(data.shippingFee || 16000),
            discountAmount: Number(data.discountAmount || 0),
            totalAmount: Number(data.totalAmount || 0),
            paymentMethod: (data.paymentMethod || 'COD').toUpperCase(),
            statusCode,
            statusLabel: ORDER_STATUS_LABELS[statusCode] || statusCode,
            createdAt: data.createdAt || new Date().toISOString(),
            items: (data.items || []).map((it: any) => ({
              id: it.id,
              foodId: it.foodId,
              foodName: it.foodName || 'Món ăn',
              quantity: it.quantity || 1,
              priceAtOrder: Number(it.priceAtOrder || 0),
              toppings: (it.toppings || []).map((tp: any) => ({
                id: tp.id,
                toppingId: tp.toppingId,
                name: tp.name || `Topping #${tp.toppingId}`,
                quantity: tp.quantity || 1,
                price: Number(tp.price || 0),
              })),
            })),
          };
          setOrder(mappedOrder);

          // Check unread chat count
          chatApi.getOrderUnreadCount(mappedOrder.id, 'CUSTOMER').then((count) => {
            setUnreadChatCount(count);
          }).catch(() => {});

          // Check review status
          if (['DELIVERED', 'COMPLETED'].includes(statusCode)) {
            reviewApi
              .getOrderReviewStatus(mappedOrder.id)
              .then((reviewRes) => {
                if (reviewRes?.data) {
                  if (reviewRes.data.isRestaurantReviewed) setRestaurantReviewed(true);
                  if (reviewRes.data.isDriverReviewed) setDriverReviewed(true);
                }
              })
              .catch(() => {});
          }
        } else {
          fallbackDemoOrder();
        }
      } catch {
        fallbackDemoOrder();
      } finally {
        setLoading(false);
      }
    };

    const fallbackDemoOrder = () => {
      const orderId = Number(id) || 101;
      setOrder({
        id: orderId,
        orderCode: `#ORD-${orderId}`,
        customerId: 1,
        customerName: 'Nguyễn Văn Khách',
        customerPhone: '0987654321',
        restaurantId: 1,
        restaurantName: 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi',
        driverId: 5,
        driverName: 'Nguyễn Tuấn Tài (Tài xế Thunder)',
        driverPhone: '0912345678',
        receiverAddress: '720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM',
        distanceKm: 2.1,
        subtotalAmount: 147000,
        shippingFee: 18000,
        discountAmount: 15000,
        totalAmount: 150000,
        paymentMethod: 'COD',
        statusCode: 'DELIVERING',
        statusLabel: 'Đang giao hàng',
        createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        items: [
          {
            id: 1,
            foodId: 1,
            foodName: 'Cơm Tấm Sườn Bì Chả Đặc Biệt',
            quantity: 1,
            priceAtOrder: 87000,
            toppings: [
              { id: 1, toppingId: 101, name: 'Ốp la lòng đào', quantity: 1, price: 8000 },
              { id: 2, toppingId: 102, name: 'Thêm mỡ hành giòn', quantity: 1, price: 5000 },
            ],
          },
          {
            id: 2,
            foodId: 2,
            foodName: 'Canh Khổ Qua Nhồi Thịt',
            quantity: 1,
            priceAtOrder: 35000,
          },
          {
            id: 3,
            foodId: 3,
            foodName: 'Trà Tắc Xí Muội Khổng Lồ',
            quantity: 1,
            priceAtOrder: 25000,
          },
        ],
      });
    };

    fetchOrderDetail();
  }, [id]);

  // 2. Realtime WebSocket STOMP Subscription: /topic/orders/{orderId}
  useEffect(() => {
    if (!id) return;

    orderLiveTrackingWs.connect(id);

    const unsubscribe = orderLiveTrackingWs.subscribeOrderUpdates((updated) => {
      setOrder((prev) => {
        if (!prev) return prev;
        const newStatusCode = updated.statusCode || prev.statusCode;
        const newStatusLabel = ORDER_STATUS_LABELS[newStatusCode] || updated.statusLabel || prev.statusLabel;

        message.info({
          content: `Cập nhật trạng thái đơn: ${newStatusLabel}`,
          key: 'order-status-update',
          duration: 3,
        });

        return {
          ...prev,
          ...updated,
          statusCode: newStatusCode,
          statusLabel: newStatusLabel,
          driverId: updated.driverId ?? prev.driverId,
          driverName: updated.driverName || prev.driverName,
          driverPhone: updated.driverPhone || prev.driverPhone,
        };
      });
    });

    // Realtime GPS updates for moving driver bike
    const unsubLocation = orderLiveTrackingWs.subscribeDriverLocation((loc) => {
      if (loc && loc.latitude && loc.longitude) {
        setDriverLiveCoords({
          lat: loc.latitude,
          lng: loc.longitude,
          heading: loc.heading,
          speedKmh: loc.speedKmh,
        });
      }
    });

    // Realtime Chat messages listener (Sound + Badge + Notification when closed)
    const unsubChat = orderLiveTrackingWs.subscribeChatMessages((incoming) => {
      if (Number(incoming.orderId) === Number(id)) {
        if (incoming.senderRole !== 'CUSTOMER') {
          soundManager.playMessageChime();
          setUnreadChatCount((prev) => prev + 1);
          notification.info({
            message: incoming.senderRole === 'DRIVER' 
              ? 'Tin nhắn từ Tài xế'
              : 'Tin nhắn từ Quán ăn',
            description: incoming.message,
            placement: 'bottomRight',
            duration: 4.5,
            onClick: () => {
              setIsChatOpen(true);
              setUnreadChatCount(0);
            },
          });
        }
      }
    });

    return () => {
      unsubscribe();
      unsubLocation();
      unsubChat();
      orderLiveTrackingWs.disconnect();
    };
  }, [id]);

  // Stepper 5 bước: Chờ nhận → Đang nấu → Tài xế nhận → Đang giao → Đã giao
  const getStepCurrent = (status?: string): { current: number; statusText: string } => {
    switch (status) {
      case 'PENDING':
        return { current: 0, statusText: 'Đơn hàng đang chờ quán tiếp nhận' };
      case 'AWAITING_PAYMENT':
        return { current: 0, statusText: 'Đang chờ bạn hoàn tất thanh toán' };
      case 'CONFIRMED':
      case 'PREPARING':
        return { current: 1, statusText: 'Quán ăn đang chế biến món tươi ngon nóng hổi' };
      case 'DRIVER_ACCEPTED':
        return { current: 2, statusText: 'Tài xế đã nhận đơn và đang di chuyển tới quán' };
      case 'DRIVER_REJECTED':
        return { current: 1, statusText: 'Đang điều phối tìm tài xế khác cho bạn' };
      case 'PICKING_UP':
        return { current: 2, statusText: 'Tài xế đang đến lấy món ăn tại quán' };
      case 'READY_FOR_PICKUP':
        return { current: 2, statusText: 'Món ăn đã sẵn sàng, chờ tài xế nhận' };
      case 'PICKED_UP':
      case 'DELIVERING':
        return { current: 3, statusText: 'Tài xế đang hỏa tốc giao đơn hàng tới bạn' };
      case 'DELIVERED':
      case 'COMPLETED':
        return { current: 4, statusText: 'Đơn hàng đã được giao thành công!' };
      case 'CANCELLED':
        return { current: 0, statusText: 'Đơn hàng đã bị hủy' };
      case 'TIMEOUT':
        return { current: 0, statusText: 'Đơn hàng đã hết thời gian xử lý' };
      default:
        return { current: 0, statusText: 'Đơn hàng đang được cập nhật' };
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-3">
        <Spin size="large" />
        <span className="text-gray-500 font-medium">
          Đang tải chi tiết tiến trình đơn hàng #{id}...
        </span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center space-y-4">
        <Title level={4}>Không tìm thấy đơn hàng</Title>
        <Button onClick={() => navigate(APP_ROUTES.ORDERS)} type="primary">
          Quay lại danh sách đơn
        </Button>
      </div>
    );
  }

  const { current, statusText } = getStepCurrent(order.statusCode);
  const isError = order.statusCode === 'CANCELLED' || order.statusCode === 'TIMEOUT';
  const isCompleted = order.statusCode === 'DELIVERED' || order.statusCode === 'COMPLETED';

  return (
    <div className="w-full space-y-6">
      {/* 1. Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(APP_ROUTES.ORDERS)}
          className="rounded-xl font-semibold border-gray-200 hover:border-orange-500 hover:text-orange-600"
        >
          Quay lại danh sách đơn hàng
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Hủy đơn hàng 60s dành cho Khách hàng khi Quán chưa xác nhận */}
          {(order.statusCode === 'PENDING' || order.statusCode === 'AWAITING_PAYMENT') && (
            cancelSecondsLeft > 0 ? (
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setIsCancelModalOpen(true)}
                className="rounded-xl font-bold border-rose-500 text-rose-600 hover:bg-rose-50 shadow-xs"
              >
                Hủy đơn hàng ({cancelSecondsLeft}s)
              </Button>
            ) : (
              <Tooltip title="Đã hết thời hạn 60 giây hủy đơn. Quán ăn đang chế biến món ăn của bạn.">
                <Button
                  disabled
                  icon={<CloseCircleOutlined />}
                  className="rounded-xl font-medium text-gray-400 border-gray-200"
                >
                  Hết hạn hủy đơn
                </Button>
              </Tooltip>
            )
          )}

          {/* Nút Chat nhanh với Tài xế */}
          <Button
            icon={<MessageOutlined className="text-orange-500" />}
            onClick={() => setIsChatOpen(true)}
            className="rounded-xl font-bold bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
          >
            Nhắn tin tài xế
          </Button>

          <Link to={APP_ROUTES.HOME}>
            <Button icon={<HomeOutlined />} className="rounded-xl font-semibold">
              Trang chủ
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Hero Tracking Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-100 text-orange-600 font-extrabold text-sm">
                <ThunderboltFilled />
              </span>
              <Title level={3} className="!mb-0 text-gray-900 font-extrabold">
                Theo dõi đơn {order.orderCode}
              </Title>
            </div>
            <Text type="secondary" className="text-xs sm:text-sm mt-1 block">
              Đặt lúc: {new Date(order.createdAt).toLocaleString('vi-VN')}
            </Text>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isCompleted && (
              <>
                {/* 1. Nút / Tag Đánh giá Quán */}
                {restaurantReviewed ? (
                  <Tag color="orange" className="text-sm py-1 px-3 font-bold rounded-lg">
                    <StarFilled className="mr-1 text-amber-500" />
                    Quán: Đã đánh giá
                  </Tag>
                ) : (
                  <Button
                    type="primary"
                    icon={<ShopOutlined />}
                    onClick={() => setIsRestaurantReviewOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 rounded-xl font-bold text-xs sm:text-sm shadow-xs"
                  >
                    Đánh giá quán
                  </Button>
                )}

                {/* 2. Nút / Tag Đánh giá Tài xế nếu có hoặc Tag Không có tài xế */}
                {order.driverId ? (
                  driverReviewed ? (
                    <Tag color="green" className="text-sm py-1 px-3 font-bold rounded-lg">
                      <StarFilled className="mr-1 text-emerald-500" />
                      Tài xế: Đã đánh giá
                    </Tag>
                  ) : (
                    <Button
                      type="primary"
                      icon={<CarOutlined />}
                      onClick={() => setIsDriverReviewOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-xs sm:text-sm shadow-xs"
                    >
                      Đánh giá tài xế
                    </Button>
                  )
                ) : (
                  <Tooltip title="Đơn hàng hoàn tất không qua tài xế giao nên không cần đánh giá tài xế">
                    <Tag color="default" className="text-sm py-1 px-3 font-semibold rounded-lg cursor-help">
                      Không có tài xế
                    </Tag>
                  </Tooltip>
                )}
              </>
            )}

            {isError ? (
              <Tag color="error" className="text-sm py-1 px-3 font-bold rounded-lg">
                {order.statusLabel}
              </Tag>
            ) : (
              <Tag color="green" className="text-sm py-1 px-3 font-bold rounded-lg animate-pulse">
                {order.statusLabel || 'Đang giao hàng'}
              </Tag>
            )}
          </div>
        </div>

        {/* 3. Live Tracking Progress Bar - Stepper 5 bước */}
        <OrderLiveTrackingStepper
          current={current}
          statusText={statusText}
          isError={isError}
          statusCode={order.statusCode}
        />

        {/* Live Interactive Real-World Map Route with Simulation & Realtime GPS */}
        <RealMapRouteView
          restaurantName={order.restaurantName}
          restaurantAddress={order.restaurantAddress || order.restaurantName}
          restaurantLat={order.restaurantLat || 10.7769}
          restaurantLng={order.restaurantLng || 106.7009}
          customerName={order.customerName}
          customerAddress={order.receiverAddress}
          customerLat={order.receiverLat || 10.7925}
          customerLng={order.receiverLng || 106.7214}
          driverLiveCoords={driverLiveCoords}
          isDelivering={order.statusCode === 'DELIVERING'}
          orderCode={order.orderCode}
          statusCode={order.statusCode}
        />

        {/* 4. Driver & Restaurant Contact Cards */}
        <OrderContactCards
          driverName={order.driverName}
          driverPhone={order.driverPhone}
          restaurantId={order.restaurantId}
          restaurantName={order.restaurantName}
          distanceKm={order.distanceKm}
          statusCode={order.statusCode}
          onOpenChat={() => setIsChatOpen(true)}
        />

        {/* 5. Receiver Address */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-1">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <EnvironmentOutlined className="text-orange-500" />
            <span>Địa chỉ giao hàng</span>
          </div>
          <div className="text-sm font-bold text-gray-900">{order.receiverAddress}</div>
          <div className="text-xs text-gray-500 flex items-center gap-2 pt-1">
            <UserOutlined />
            <span>{order.customerName || 'Khách hàng'}</span>
            <span>•</span>
            <PhoneOutlined />
            <span>{maskPhoneNumber(order.customerPhone)}</span>
          </div>
          {(order as any).note && (
            <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-start gap-1.5 text-xs text-amber-900 bg-amber-50/80 p-2.5 rounded-xl">
              <span className="font-extrabold text-amber-700 shrink-0">📝 Ghi chú:</span>
              <span className="font-medium">{(order as any).note}</span>
            </div>
          )}
        </div>

        {/* 6. Items & Pricing Breakdown */}
        <OrderItemsBreakdown
          items={order.items}
          subtotalAmount={order.subtotalAmount}
          shippingFee={order.shippingFee}
          discountAmount={order.discountAmount}
          totalAmount={order.totalAmount}
          paymentMethod={order.paymentMethod}
          distanceKm={order.distanceKm}
        />
      </div>

      {/* Floating Action Button for Realtime Chat */}
      <div className="fixed right-6 bottom-6 z-40">
        <Badge count={unreadChatCount} overflowCount={9} offset={[-6, 6]}>
          <FloatButton
            icon={<MessageOutlined />}
            type="primary"
            tooltip={unreadChatCount > 0 ? `${unreadChatCount} tin nhắn mới chưa đọc` : "Nhắn tin trao đổi đơn hàng"}
            style={{ position: 'relative', right: 0, bottom: 0 }}
            onClick={() => {
              setIsChatOpen(true);
              setUnreadChatCount(0);
            }}
          />
        </Badge>
      </div>

      {/* Real-time Customer-Driver Chat Drawer with Quick Replies */}
      {order && (
        <OrderChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          orderId={order.id}
          orderCode={order.orderCode}
          shopId={order.restaurantId}
          driverName={order.driverName}
          driverPhone={order.driverPhone}
          restaurantName={order.restaurantName}
        />
      )}

      {/* Modals for Ratings */}
      {isRestaurantReviewOpen && order && (
        <RestaurantReviewModal
          isOpen={isRestaurantReviewOpen}
          onClose={() => setIsRestaurantReviewOpen(false)}
          order={order}
          onSuccess={() => setRestaurantReviewed(true)}
        />
      )}

      {isDriverReviewOpen && order && (
        <DriverReviewModal
          isOpen={isDriverReviewOpen}
          onClose={() => setIsDriverReviewOpen(false)}
          order={order}
          onSuccess={() => setDriverReviewed(true)}
        />
      )}

      {/* Modal xác nhận hủy đơn trong 60s cho khách hàng */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-rose-600 font-bold text-lg">
            <CloseCircleOutlined />
            <span>Xác nhận hủy đơn hàng</span>
          </div>
        }
        open={isCancelModalOpen}
        onCancel={() => !cancelling && setIsCancelModalOpen(false)}
        footer={[
          <Button key="back" onClick={() => setIsCancelModalOpen(false)} disabled={cancelling} className="rounded-xl">
            Giữ lại đơn
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={cancelling}
            onClick={handleConfirmCancelOrder}
            className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700"
          >
            Xác nhận hủy đơn {cancelSecondsLeft > 0 ? `(${cancelSecondsLeft}s)` : ''}
          </Button>,
        ]}
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-600">
            Bạn có thể hủy đơn hàng miễn phí trong vòng <strong>60 giây</strong> kể từ khi đặt nếu quán chưa bắt đầu chế biến. 
            Vui lòng chọn lý do hủy đơn:
          </p>

          <Radio.Group
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="flex flex-col gap-2.5 w-full"
          >
            <Radio value="Đổi ý, không muốn đặt nữa">Đổi ý, không muốn đặt nữa</Radio>
            <Radio value="Đặt nhầm món / sai số lượng">Đặt nhầm món / sai số lượng</Radio>
            <Radio value="Nhầm địa chỉ nhận hàng">Nhầm địa chỉ nhận hàng</Radio>
            <Radio value="Thời gian chờ đợi quá lâu">Thời gian chờ đợi quá lâu</Radio>
            <Radio value="Lý do khác">Lý do khác</Radio>
          </Radio.Group>

          {cancelReason === 'Lý do khác' && (
            <Input.TextArea
              rows={3}
              placeholder="Nhập lý do cụ thể..."
              value={otherCancelReason}
              onChange={(e) => setOtherCancelReason(e.target.value)}
              maxLength={200}
              showCount
              className="rounded-xl"
            />
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            ⏳ Sau 60 giây, quán ăn sẽ chuẩn bị món và bạn sẽ không thể tự hủy đơn hàng qua ứng dụng được nữa.
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetailPage;
