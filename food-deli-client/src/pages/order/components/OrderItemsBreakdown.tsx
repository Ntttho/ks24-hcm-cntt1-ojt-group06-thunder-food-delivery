import React from 'react';
import { Tag, Divider } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';
import type { OrderItem, OrderItemTopping } from '@/types';

interface OrderItemsBreakdownProps {
  items: OrderItem[];
  subtotalAmount: number;
  shippingFee: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod: string;
  distanceKm?: number;
}

export const OrderItemsBreakdown: React.FC<OrderItemsBreakdownProps> = ({
  items,
  subtotalAmount,
  shippingFee,
  discountAmount = 0,
  totalAmount,
  paymentMethod,
  distanceKm = 2.1,
}) => {
  return (
    <div className="space-y-4">
      {/* Items List */}
      <div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Món ăn trong đơn ({items.reduce((s: number, i: OrderItem) => s + i.quantity, 0)} món)
        </div>
        <div className="space-y-2.5">
          {items.map((it: OrderItem, idx: number) => {
            const itemToppings: OrderItemTopping[] = it.toppings || [];
            const toppingsTotal = itemToppings.reduce(
              (sum: number, t: OrderItemTopping) => sum + (t.price || 0) * (t.quantity || 1),
              0
            );
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
                      Topping:{' '}
                      {itemToppings
                        .map(
                          (t: OrderItemTopping) => `${t.name || 'Topping'} (+${t.price.toLocaleString('vi-VN')}đ)`
                        )
                        .join(', ')}
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
          <span>{subtotalAmount.toLocaleString('vi-VN')}đ</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Phí vận chuyển ({distanceKm} km)</span>
          <span>{shippingFee.toLocaleString('vi-VN')}đ</span>
        </div>
        {Boolean(discountAmount && discountAmount > 0) && (
          <div className="flex justify-between text-emerald-600 font-medium">
            <span>Khuyến mãi</span>
            <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
          </div>
        )}
        <div className="flex justify-between items-center text-base font-extrabold text-gray-900 pt-2 border-t border-gray-100">
          <span>Tổng số tiền</span>
          <span className="text-2xl text-orange-600 font-black">
            {totalAmount.toLocaleString('vi-VN')}đ
          </span>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
          <span className="flex items-center gap-1">
            <CreditCardOutlined /> Phương thức:
          </span>
          <Tag color={paymentMethod === 'VNPAY' ? 'blue' : 'orange'} className="font-bold">
            {paymentMethod === 'VNPAY'
              ? 'Thanh toán VNPay'
              : 'Tiền mặt khi nhận hàng (COD)'}
          </Tag>
        </div>
      </div>
    </div>
  );
};

export default OrderItemsBreakdown;
