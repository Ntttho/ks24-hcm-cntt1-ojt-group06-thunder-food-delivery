import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Tag,
  Button,
  Spin,
  Typography,
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
} from '@ant-design/icons';
import { orderApi } from '@/services/modules/orderApi';
import { reviewApi } from '@/services/api/reviewApi';
import type { CustomerOrder } from '@/types';
import { APP_ROUTES } from '@/constants';
import {
  OrderLiveTrackingStepper,
  OrderContactCards,
  OrderItemsBreakdown,
  RestaurantReviewModal,
  DriverReviewModal,
} from './components';

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
  PICKING_UP: 'Tài xế đang lấy món',
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
  const statusId = Number(
    data.orderStatusId ?? data.statusId ?? data.orderStatus?.id ?? data.status?.id,
  );
  return (
    ORDER_STATUS_CODES_BY_ID[statusId] ??
    data.statusCode ??
    data.orderStatus?.code ??
    data.status?.code ??
    'DELIVERING'
  );
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

  useEffect(() => {
    const fetchOrderDetail = async () => {
      setLoading(true);
      try {
        if (!id) return;
        const response = await orderApi.getById(id);
        const data = response?.data;

        if (data) {
          const statusCode = getOrderStatusCode(data);
          const mappedOrder: CustomerOrder = {
            id: data.id,
            orderCode: data.orderCode || `#ORD-${data.id}`,
            customerId: data.customerId,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            restaurantId: data.restaurantId,
            restaurantName:
              data.restaurantName ||
              (data.restaurantId === 1
                ? 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi'
                : `Quán ăn #${data.restaurantId}`),
            driverId: data.driverId,
            driverName: data.driverName || 'Nguyễn Tuấn Tài (Tài xế Thunder)',
            driverPhone: data.driverPhone || '0912345678',
            receiverAddress:
              data.receiverAddress || '720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM',
            distanceKm: data.distanceKm || 2.1,
            subtotalAmount: Number(data.subtotalAmount || 0),
            shippingFee: Number(data.shippingFee || 18000),
            discountAmount: Number(data.discountAmount || 0),
            totalAmount: Number(data.totalAmount || 0),
            paymentMethod: data.paymentMethod || 'COD',
            statusCode,
            statusLabel: data.statusLabel || ORDER_STATUS_LABELS[statusCode] || statusCode,
            cancelReason: data.cancelReason,
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

          // Kiểm tra trạng thái đã đánh giá quán / tài xế chưa
          if (['DELIVERED', 'COMPLETED'].includes(statusCode)) {
            reviewApi.getOrderReviewStatus(mappedOrder.id)
              .then((res) => {
                if (res?.data) {
                  if (res.data.isRestaurantReviewed) setRestaurantReviewed(true);
                  if (res.data.isDriverReviewed) setDriverReviewed(true);
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

  const getStepCurrent = (status?: string): { current: number; statusText: string } => {
    switch (status) {
      case 'PENDING':
        return { current: 0, statusText: 'Đơn hàng đang chờ quán xác nhận' };
      case 'AWAITING_PAYMENT':
        return { current: 0, statusText: 'Đơn hàng đang chờ thanh toán' };
      case 'CONFIRMED':
      case 'PREPARING':
        return { current: 1, statusText: 'Quán ăn đang chuẩn bị món ăn tươi ngon' };
      case 'DRIVER_ACCEPTED':
        return { current: 1, statusText: 'Tài xế đã nhận đơn, quán đang chuẩn bị món' };
      case 'DRIVER_REJECTED':
        return { current: 1, statusText: 'Tài xế từ chối nhận đơn, đang tìm tài xế khác' };
      case 'PICKING_UP':
        return { current: 2, statusText: 'Tài xế đang đến lấy món' };
      case 'READY_FOR_PICKUP':
      case 'PICKED_UP':
      case 'DELIVERING':
        return { current: 2, statusText: 'Tài xế đang hỏa tốc giao đơn hàng tới bạn' };
      case 'DELIVERED':
      case 'COMPLETED':
        return { current: 3, statusText: 'Đơn hàng đã được giao thành công' };
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
      <div className="flex items-center justify-between">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(APP_ROUTES.ORDERS)}
          className="rounded-xl font-semibold border-gray-200 hover:border-orange-500 hover:text-orange-600"
        >
          Quay lại danh sách đơn hàng
        </Button>

        <Link to={APP_ROUTES.HOME}>
          <Button icon={<HomeOutlined />} className="rounded-xl font-semibold">
            Trang chủ
          </Button>
        </Link>
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

                {/* 2. Nút / Tag Đánh giá Tài xế nếu có */}
                {order.driverId && (
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

        {/* 3. Live Tracking Progress Bar */}
        <OrderLiveTrackingStepper
          current={current}
          statusText={statusText}
          isError={isError}
          statusCode={order.statusCode}
        />

        {/* 4. Driver & Restaurant Contact Cards */}
        <OrderContactCards
          driverName={order.driverName}
          driverPhone={order.driverPhone}
          restaurantId={order.restaurantId}
          restaurantName={order.restaurantName}
          distanceKm={order.distanceKm}
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
            <span>{order.customerPhone || '0987654321'}</span>
          </div>
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
    </div>
  );
};

export default OrderDetailPage;
