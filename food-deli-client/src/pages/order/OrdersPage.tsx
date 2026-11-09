import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Spin, Empty, Typography } from 'antd';
import { ReloadOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '@/services/modules/orderApi';
import { CustomerOrderCard, OrderFilterBar } from './components';
import type { CustomerOrder } from '@/types';
import { APP_ROUTES } from '@/constants';

const { Title, Text } = Typography;

// Sample fallback orders if backend has not created orders yet for this user
const DEMO_MY_ORDERS: CustomerOrder[] = [
  {
    id: 101,
    orderCode: '#ORD-2026110301',
    customerId: 1,
    restaurantId: 1,
    restaurantName: 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi',
    receiverAddress: '720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM',
    distanceKm: 2.3,
    subtotalAmount: 147000,
    shippingFee: 18000,
    discountAmount: 15000,
    totalAmount: 150000,
    paymentMethod: 'COD',
    statusCode: 'DELIVERING',
    statusLabel: 'Đang giao hàng',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
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
  },
  {
    id: 98,
    orderCode: '#ORD-2026110288',
    customerId: 1,
    restaurantId: 2,
    restaurantName: 'The Alley Tea House - Quận 3',
    receiverAddress: '123 Cách Mạng Tháng 8, Phường 5, Quận 3, TP.HCM',
    distanceKm: 1.5,
    subtotalAmount: 110000,
    shippingFee: 15000,
    discountAmount: 0,
    totalAmount: 125000,
    paymentMethod: 'VNPAY',
    statusCode: 'DELIVERED',
    statusLabel: 'Giao thành công',
    driverId: 2,
    driverName: 'Nguyễn Văn Shipper - Giao Hàng Siêu Tốc',
    driverPhone: '0912345678',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 4,
        foodId: 10,
        foodName: 'Sữa Tươi Trân Châu Đường Đen',
        quantity: 2,
        priceAtOrder: 55000,
        toppings: [
          { id: 3, toppingId: 201, name: 'Trân châu đường đen thêm', quantity: 1, price: 10000 },
        ],
      },
    ],
  },
];

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchCode, setSearchCode] = useState<string>('');

  // Fetch orders from API Gateway: GET /api/v1/orders/my-orders
  const fetchMyOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await orderApi.getMyOrders({ page: 0, size: 20 });
      const apiData = response?.data;
      const list = Array.isArray(apiData)
        ? apiData
        : Array.isArray(apiData?.content)
        ? apiData.content
        : [];

      if (list && list.length > 0) {
        const mappedOrders: CustomerOrder[] = list.map((item: any) => ({
          id: item.id,
          orderCode: item.orderCode || `#ORD-${item.id}`,
          customerId: item.customerId,
          customerName: item.customerName,
          customerPhone: item.customerPhone,
          restaurantId: item.restaurantId,
          restaurantName: item.restaurantName || (item.restaurantId === 1 ? 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi' : `Quán ăn #${item.restaurantId}`),
          driverId: item.driverId ? Number(item.driverId) : undefined,
          driverName: item.driverName || (item.driverId ? `Tài xế đối tác #${item.driverId}` : undefined),
          driverPhone: item.driverPhone,
          receiverAddress: item.receiverAddress || 'Địa chỉ giao hàng mặc định',
          distanceKm: item.distanceKm,
          subtotalAmount: Number(item.subtotalAmount || 0),
          shippingFee: Number(item.shippingFee || 0),
          discountAmount: Number(item.discountAmount || 0),
          totalAmount: Number(item.totalAmount || 0),
          paymentMethod: item.paymentMethod || 'COD',
          statusCode: item.statusCode || 'PENDING',
          statusLabel: item.statusLabel || item.statusCode,
          cancelReason: item.cancelReason,
          createdAt: item.createdAt || new Date().toISOString(),
          items: (item.items || []).map((it: any) => ({
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
        }));
        setOrders(mappedOrders);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  // Tab Filtering
  const filteredOrders = useMemo(() => {
    let result = orders;

    if (activeTab === 'PROCESSING') {
      result = result.filter((o) =>
        ['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'PREPARING'].includes(o.statusCode)
      );
    } else if (activeTab === 'DELIVERING') {
      result = result.filter((o) =>
        ['READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERING'].includes(o.statusCode)
      );
    } else if (activeTab === 'COMPLETED') {
      result = result.filter((o) => ['DELIVERED', 'COMPLETED'].includes(o.statusCode));
    } else if (activeTab === 'CANCELLED') {
      result = result.filter((o) => o.statusCode === 'CANCELLED');
    }

    if (searchCode.trim()) {
      const q = searchCode.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.orderCode.toLowerCase().includes(q) ||
          (o.restaurantName && o.restaurantName.toLowerCase().includes(q))
      );
    }

    return result;
  }, [orders, activeTab, searchCode]);

  return (
    <div className="space-y-6 w-full">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <Title level={2} className="!mb-1 text-gray-900 font-extrabold flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600 text-xl inline-flex items-center justify-center">
              <ShoppingOutlined />
            </span>
            <span>Đơn hàng của tôi</span>
          </Title>
          <Text type="secondary" className="text-sm">
            Theo dõi tiến trình trực tiếp, lịch sử đặt món và chi tiết từng đơn hàng
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined spin={loading} />}
          onClick={fetchMyOrders}
          className="rounded-xl font-semibold border-gray-200 hover:border-orange-500 hover:text-orange-600 self-start sm:self-auto"
        >
          Làm mới
        </Button>
      </div>

      {/* 2. Filter & Search Bar */}
      <OrderFilterBar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        searchCode={searchCode}
        onChangeSearch={setSearchCode}
      />

      {/* 3. Orders List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Spin size="large" />
          <span className="text-gray-500 font-medium">Đang tải danh sách đơn hàng...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-2xs">
          <Empty
            description={
              <div className="space-y-1">
                <div className="font-bold text-gray-700 text-base">Không tìm thấy đơn hàng nào</div>
                <div className="text-gray-400 text-sm">
                  {searchCode ? 'Hãy thử tìm kiếm với từ khóa khác' : 'Bạn chưa có đơn hàng nào trong mục này'}
                </div>
              </div>
            }
          >
            <Button
              type="primary"
              className="bg-orange-500 hover:bg-orange-600 rounded-xl font-bold mt-2"
              onClick={() => navigate(APP_ROUTES.HOME)}
            >
              Khám phá món ngon ngay
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <CustomerOrderCard
              key={order.id}
              order={order}
              onViewDetail={(order) => navigate(`/orders/${order.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
