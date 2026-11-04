import React from 'react';
import { Modal, Tag, Button, Divider } from 'antd';
import {
  EnvironmentOutlined,
  PhoneOutlined,
  UserOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { CustomerOrder } from '@/types';

interface OrderDetailModalProps {
  order: CustomerOrder | null;
  open: boolean;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  open,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!order) return null;

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Tag color="gold" className="font-semibold">Chờ xác nhận</Tag>;
      case 'AWAITING_PAYMENT':
        return <Tag color="blue" className="font-semibold">Chờ thanh toán VNPay</Tag>;
      case 'CONFIRMED':
        return <Tag color="cyan" className="font-semibold">Quán đã nhận</Tag>;
      case 'PREPARING':
        return <Tag color="purple" className="font-semibold">Đang chế biến</Tag>;
      case 'READY_FOR_PICKUP':
        return <Tag color="lime" className="font-semibold">Chờ tài xế lấy món</Tag>;
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

  const handleTrackProgress = () => {
    onClose();
    navigate(`/orders/${order.id}`);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} className="rounded-lg">
          Đóng
        </Button>,
        <Button
          key="track"
          type="primary"
          icon={<CompassOutlined />}
          className="bg-orange-500 hover:bg-orange-600 rounded-lg font-bold"
          onClick={handleTrackProgress}
        >
          Xem tiến trình đơn hàng
        </Button>,
      ]}
      title={
        <div className="flex items-center justify-between pr-6">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-gray-900 text-lg">
              Chi tiết đơn hàng {order.orderCode}
            </span>
          </div>
          {getStatusTag(order.statusCode)}
        </div>
      }
      width={560}
      centered
    >
      <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
        {/* Restaurant & Date Header */}
        <div className="bg-orange-50/70 border border-orange-100 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-lg">
              <ShopOutlined />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base">
                {order.restaurantName || `Quán ăn #${order.restaurantId}`}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <ClockCircleOutlined />
                <span>
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
        </div>

        {/* Delivery Address Details */}
        <div className="bg-gray-50 rounded-xl p-3.5 space-y-2 border border-gray-100">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <EnvironmentOutlined className="text-orange-500" />
            <span>Địa chỉ nhận hàng</span>
          </div>
          <div className="text-sm font-semibold text-gray-800">
            {order.receiverAddress}
          </div>
          {(order.customerName || order.customerPhone) && (
            <div className="text-xs text-gray-500 flex items-center gap-3 pt-1">
              {order.customerName && (
                <span className="flex items-center gap-1">
                  <UserOutlined /> {order.customerName}
                </span>
              )}
              {order.customerPhone && (
                <span className="flex items-center gap-1">
                  <PhoneOutlined /> {order.customerPhone}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Items List */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Danh sách món ăn ({order.items.reduce((s, i) => s + i.quantity, 0)} món)
          </div>
          <div className="space-y-2">
            {order.items.map((item, idx) => {
              const itemToppings = item.toppings || [];
              const toppingsTotal = itemToppings.reduce((sum, t) => sum + (t.price || 0) * (t.quantity || 1), 0);
              const singleItemTotal = item.priceAtOrder + toppingsTotal;
              const lineTotal = singleItemTotal * item.quantity;

              return (
                <div
                  key={item.id || idx}
                  className="p-3 bg-white border border-gray-100 rounded-xl shadow-2xs flex flex-col gap-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center shrink-0">
                        {item.quantity}x
                      </span>
                      <span className="font-bold text-gray-800 text-sm">{item.foodName}</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm shrink-0">
                      {lineTotal.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  {/* Toppings Details */}
                  {itemToppings.length > 0 && (
                    <div className="pl-8 text-xs text-gray-500 space-y-0.5">
                      {itemToppings.map((tp, tIdx) => (
                        <div key={tp.id || tIdx} className="flex justify-between text-gray-500">
                          <span>+ {tp.name || `Topping #${tp.toppingId}`}</span>
                          <span>+{((tp.price || 0) * (tp.quantity || 1)).toLocaleString('vi-VN')}đ</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Divider className="my-2" />

        {/* Payment Summary */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Tạm tính món ăn</span>
            <span>{order.subtotalAmount.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Phí giao hàng</span>
            <span>{order.shippingFee.toLocaleString('vi-VN')}đ</span>
          </div>
          {Boolean(order.discountAmount && order.discountAmount > 0) && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Giảm giá khuyến mãi</span>
              <span>-{order.discountAmount!.toLocaleString('vi-VN')}đ</span>
            </div>
          )}
          <div className="flex justify-between items-center text-base font-extrabold text-gray-900 pt-2 border-t border-gray-100">
            <span>Tổng thanh toán</span>
            <span className="text-xl text-orange-600">
              {order.totalAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
            <span className="flex items-center gap-1">
              <CreditCardOutlined /> Phương thức thanh toán:
            </span>
            <Tag color={order.paymentMethod === 'VNPAY' ? 'blue' : 'orange'} className="font-bold">
              {order.paymentMethod === 'VNPAY' ? 'VNPay' : order.paymentMethod === 'COD' ? 'Tiền mặt (COD)' : order.paymentMethod}
            </Tag>
          </div>
        </div>

        {order.cancelReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
            <strong className="block mb-0.5">Lý do hủy đơn:</strong>
            {order.cancelReason}
          </div>
        )}
      </div>
    </Modal>
  );
};

