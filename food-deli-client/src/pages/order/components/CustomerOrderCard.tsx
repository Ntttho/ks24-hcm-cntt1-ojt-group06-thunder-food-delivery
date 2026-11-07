import React from 'react';
import { Button, Tag } from 'antd';
import {
  ShopOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { CustomerOrder } from '@/types';

interface CustomerOrderCardProps {
  order: CustomerOrder;
  onViewDetail?: (order: CustomerOrder) => void;
}

export const CustomerOrderCard: React.FC<CustomerOrderCardProps> = ({
  order,
  onViewDetail,
}) => {
  const navigate = useNavigate();

  const handleGoToDetail = () => {
    if (onViewDetail) {
      onViewDetail(order);
    } else {
      navigate(`/orders/${order.id}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Tag color="gold" className="font-semibold">Chờ xác nhận</Tag>;
      case 'AWAITING_PAYMENT':
        return <Tag color="orange" className="font-semibold">Chờ thanh toán VietQR</Tag>;
      case 'CONFIRMED':
        return <Tag color="cyan" className="font-semibold">Quán đã nhận</Tag>;
      case 'PREPARING':
        return <Tag color="purple" className="font-semibold">Đang chế biến</Tag>;
      case 'READY_FOR_PICKUP':
        return <Tag color="lime" className="font-semibold">Chờ tài xế</Tag>;
      case 'PICKED_UP':
      case 'DELIVERING':
        return <Tag color="green" className="font-semibold animate-pulse">Đang giao hàng</Tag>;
      case 'DELIVERED':
        return <Tag color="success" className="font-semibold">Giao thành công</Tag>;
      case 'CANCELLED':
        return <Tag color="error" className="font-semibold">Đã hủy</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-2xs hover:shadow-md hover:border-orange-200 transition-all p-5 flex flex-col gap-4 cursor-pointer"
      onClick={handleGoToDetail}
    >
      {/* Card Header: Restaurant, Date & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg font-bold shrink-0">
            <ShopOutlined />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-base mb-0.5">
              {order.restaurantName || `Quán ăn #${order.restaurantId}`}
            </h3>
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span className="font-semibold text-gray-700">{order.orderCode}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ClockCircleOutlined />
                {new Date(order.createdAt).toLocaleString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="self-start sm:self-auto">
          {getStatusBadge(order.statusCode)}
        </div>
      </div>

      {/* Items summary */}
      <div className="space-y-1.5 py-1">
        {order.items.slice(0, 2).map((item, idx) => (
          <div key={item.id || idx} className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="font-bold text-orange-600">{item.quantity}x</span>
              <span className="font-medium">{item.foodName}</span>
              {Boolean(item.toppings && item.toppings.length > 0) && (
                <span className="text-xs text-gray-400 italic">
                  (+{item.toppings!.map((t) => t.name || 'Topping').join(', ')})
                </span>
              )}
            </div>
            <span className="text-gray-500 font-semibold text-xs">
              {(item.priceAtOrder * item.quantity).toLocaleString('vi-VN')}đ
            </span>
          </div>
        ))}

        {order.items.length > 2 && (
          <div className="text-xs text-gray-400 font-medium italic">
            +{order.items.length - 2} món ăn khác...
          </div>
        )}
      </div>

      {/* Delivery Address Preview */}
      <div className="bg-gray-50/70 p-2.5 rounded-xl text-xs text-gray-600 truncate">
        <span className="font-bold text-gray-700 mr-1.5">Giao tới:</span>
        <span>{order.receiverAddress}</span>
      </div>

      {/* Card Footer: Total Amount, Payment Method & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-100">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-gray-500 font-medium">Tổng thanh toán:</span>
          <span className="text-lg font-extrabold text-orange-600">
            {order.totalAmount.toLocaleString('vi-VN')}đ
          </span>
          <Tag
            color={order.paymentMethod === 'VNPAY' ? 'blue' : 'orange'}
            className="text-xs font-semibold ml-1"
          >
            <CreditCardOutlined className="mr-1" />
            {order.paymentMethod === 'VNPAY' ? 'VNPay' : order.paymentMethod === 'COD' ? 'Tiền mặt' : order.paymentMethod}
          </Tag>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
          <Button
            type="primary"
            icon={<CompassOutlined />}
            onClick={handleGoToDetail}
            className="bg-orange-500 hover:bg-orange-600 rounded-xl font-bold text-xs sm:text-sm shadow-xs"
          >
            Xem chi tiết & tiến trình
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderCard;

