import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Steps,
  Tag,
  Button,
  Spin,
  Divider,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ShopOutlined,
  UserOutlined,
  CreditCardOutlined,
  ThunderboltFilled,
  CarOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { orderApi } from '@/services/modules/orderApi';
import type { CustomerOrder } from '@/types';
import { APP_ROUTES } from '@/constants';

const { Title, Text } = Typography;

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      setLoading(true);
      try {
        if (!id) return;
        const response = await orderApi.getById(id);
        const data = response?.data;

        if (data) {
          const mappedOrder: CustomerOrder = {
            id: data.id,
            orderCode: data.orderCode || `#ORD-${data.id}`,
            customerId: data.customerId,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            restaurantId: data.restaurantId,
            restaurantName: data.restaurantName || (data.restaurantId === 1 ? 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi' : `Quán ăn #${data.restaurantId}`),
            driverId: data.driverId,
            driverName: data.driverName || 'Nguyễn Tuấn Tài (Tài xế Thunder)',
            driverPhone: data.driverPhone || '0912345678',
            receiverAddress: data.receiverAddress || '720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM',
            distanceKm: data.distanceKm || 2.1,
            subtotalAmount: Number(data.subtotalAmount || 0),
            shippingFee: Number(data.shippingFee || 18000),
            discountAmount: Number(data.discountAmount || 0),
            totalAmount: Number(data.totalAmount || 0),
            paymentMethod: data.paymentMethod || 'COD',
            statusCode: data.statusCode || 'DELIVERING',
            statusLabel: data.statusLabel || data.statusCode,
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

  // Determine current step index in the state machine
  const getStepCurrent = (status?: string): { current: number; statusText: string } => {
    switch (status) {
      case 'PENDING':
      case 'AWAITING_PAYMENT':
        return { current: 0, statusText: 'Đã gửi đơn hàng tới quán ăn' };
      case 'CONFIRMED':
      case 'PREPARING':
        return { current: 1, statusText: 'Quán ăn đang chuẩn bị món ăn tươi ngon' };
      case 'READY_FOR_PICKUP':
      case 'PICKED_UP':
      case 'DELIVERING':
        return { current: 2, statusText: 'Tài xế đang hỏa tốc giao đơn hàng tới bạn' };
      case 'DELIVERED':
        return { current: 3, statusText: 'Đơn hàng đã được giao thành công' };
      case 'CANCELLED':
        return { current: 0, statusText: 'Đơn hàng đã bị hủy' };
      default:
        return { current: 2, statusText: 'Đang xử lý đơn hàng' };
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-3">
        <Spin size="large" />
        <span className="text-gray-500 font-medium">Đang tải chi tiết tiến trình đơn hàng #{id}...</span>
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
  const isCancelled = order.statusCode === 'CANCELLED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top back navigation button */}
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

      {/* Hero Tracking Card */}
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

          <div className="flex items-center gap-2">
            {isCancelled ? (
              <Tag color="error" className="text-sm py-1 px-3 font-bold rounded-lg">
                Đã hủy
              </Tag>
            ) : (
              <Tag color="green" className="text-sm py-1 px-3 font-bold rounded-lg animate-pulse">
                {order.statusLabel || 'Đang giao hàng'}
              </Tag>
            )}
          </div>
        </div>

        {/* Live Tracking Progress Bar */}
        <div className="py-2">
          <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                <ClockCircleOutlined />
              </div>
              <div>
                <div className="text-xs font-bold text-orange-800 uppercase tracking-wider">
                  Trạng thái hiện tại
                </div>
                <div className="font-bold text-gray-900 text-base">{statusText}</div>
              </div>
            </div>
            {!isCancelled && order.statusCode !== 'DELIVERED' && (
              <div className="text-right hidden sm:block">
                <span className="text-xs text-gray-500 block">Dự kiến nhận món</span>
                <span className="text-base font-extrabold text-orange-600">~ 15 - 20 phút</span>
              </div>
            )}
          </div>

          <Steps
            current={current}
            status={isCancelled ? 'error' : undefined}
            responsive
            items={[
              {
                title: 'Đặt đơn',
                description: 'Đơn đã xác nhận',
              },
              {
                title: 'Quán chế biến',
                description: 'Đang nấu món',
              },
              {
                title: 'Đang giao hàng',
                description: 'Tài xế đang đến',
              },
              {
                title: 'Giao thành công',
                description: 'Thưởng thức món ngon',
              },
            ]}
          />
        </div>

        {/* Driver & Restaurant Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Driver Card */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shrink-0">
                <CarOutlined />
              </div>
              <div>
                <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Tài xế phụ trách
                </div>
                <div className="font-bold text-gray-900 text-sm">{order.driverName}</div>
                <div className="text-xs text-gray-500">Xe máy • 59-P1 888.99</div>
              </div>
            </div>
            {order.driverPhone && (
              <a
                href={`tel:${order.driverPhone}`}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs"
              >
                <PhoneOutlined /> Gọi tài xế
              </a>
            )}
          </div>

          {/* Restaurant Card */}
          <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xl shrink-0">
                <ShopOutlined />
              </div>
              <div>
                <div className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">
                  Quán ăn
                </div>
                <div className="font-bold text-gray-900 text-sm truncate max-w-[200px]">
                  {order.restaurantName}
                </div>
                <div className="text-xs text-gray-500">Khoảng cách: ~{order.distanceKm} km</div>
              </div>
            </div>
            <Link
              to={`/restaurants/${order.restaurantId}`}
              className="px-3 py-1.5 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 font-bold rounded-xl text-xs flex items-center gap-1"
            >
              Xem quán
            </Link>
          </div>
        </div>

        {/* Receiver Address */}
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

        {/* Items List */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Món ăn trong đơn ({order.items.reduce((s, i) => s + i.quantity, 0)} món)
          </div>
          <div className="space-y-2.5">
            {order.items.map((it, idx) => {
              const itemToppings = it.toppings || [];
              const toppingsTotal = itemToppings.reduce((sum, t) => sum + (t.price || 0) * (t.quantity || 1), 0);
              const singleItemTotal = it.priceAtOrder + toppingsTotal;

              return (
                <div
                  key={it.id || idx}
                  className="p-3.5 bg-white border border-gray-100 rounded-xl shadow-2xs flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center">
                        {it.quantity}x
                      </span>
                      <span className="font-bold text-gray-900 text-sm">{it.foodName}</span>
                    </div>
                    {itemToppings.length > 0 && (
                      <div className="pl-8 text-xs text-gray-500">
                        Topping: {itemToppings.map((t) => `${t.name || 'Topping'} (+${t.price.toLocaleString('vi-VN')}đ)`).join(', ')}
                      </div>
                    )}
                  </div>
                  <span className="font-extrabold text-gray-900 text-sm">
                    {(singleItemTotal * it.quantity).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Divider className="my-2" />

        {/* Pricing Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Tạm tính món</span>
            <span>{order.subtotalAmount.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Phí vận chuyển ({order.distanceKm} km)</span>
            <span>{order.shippingFee.toLocaleString('vi-VN')}đ</span>
          </div>
          {Boolean(order.discountAmount && order.discountAmount > 0) && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Khuyến mãi</span>
              <span>-{order.discountAmount!.toLocaleString('vi-VN')}đ</span>
            </div>
          )}
          <div className="flex justify-between items-center text-base font-extrabold text-gray-900 pt-2 border-t border-gray-100">
            <span>Tổng số tiền</span>
            <span className="text-2xl text-orange-600 font-black">
              {order.totalAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
            <span className="flex items-center gap-1">
              <CreditCardOutlined /> Phương thức:
            </span>
            <Tag color={order.paymentMethod === 'VNPAY' ? 'blue' : 'orange'} className="font-bold">
              {order.paymentMethod === 'VNPAY' ? 'Thanh toán VNPay' : 'Tiền mặt khi nhận hàng (COD)'}
            </Tag>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
