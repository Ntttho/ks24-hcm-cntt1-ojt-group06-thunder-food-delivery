import React from 'react';
import { Drawer, Button, Divider } from 'antd';
import {
  PhoneOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { MerchantOrder } from '@/services/modules/orderApi';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { MerchantStatusBadge, MerchantPaymentBadge } from './MerchantStatusBadge';

interface MerchantOrderDetailDrawerProps {
  isOpen: boolean;
  order: MerchantOrder | null;
  submittingAction: boolean;
  onClose: () => void;
  onConfirmOrder: (order: MerchantOrder) => void;
  onOpenCancelModal: (order: MerchantOrder) => void;
}

export const MerchantOrderDetailDrawer: React.FC<MerchantOrderDetailDrawerProps> = ({
  isOpen,
  order,
  submittingAction,
  onClose,
  onConfirmOrder,
  onOpenCancelModal,
}) => {
  return (
    <Drawer
      title={
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Chi tiết đơn {order?.orderCode}</span>
            {order && <MerchantStatusBadge status={order.statusCode} />}
          </div>
        </div>
      }
      placement="right"
      width={540}
      onClose={onClose}
      open={isOpen}
    >
      {order && (
        <div className="space-y-5 text-sm">
          {/* Customer Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              Thông tin người nhận
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">{order.customerName}</span>
              <a
                href={`tel:${order.customerPhone}`}
                className="text-orange-600 font-bold hover:underline flex items-center gap-1"
              >
                <PhoneOutlined /> {order.customerPhone}
              </a>
            </div>
            <div className="flex items-start gap-1.5 text-xs text-slate-600">
              <EnvironmentOutlined className="mt-0.5 text-orange-500 flex-shrink-0" />
              <span>{order.receiverAddress}</span>
            </div>
            {order.customerNote && (
              <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-xs text-amber-800">
                <strong>Ghi chú của khách:</strong> "{order.customerNote}"
              </div>
            )}
          </div>

          {/* Payment & Order Meta */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-slate-400 block mb-1">Phương thức thanh toán:</span>
              <div><MerchantPaymentBadge method={order.paymentMethod} /></div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-slate-400 block mb-1">Thời gian đặt:</span>
              <span className="font-medium text-slate-700">{formatDate(order.createdAt)}</span>
            </div>
          </div>

          {/* Items Breakdown */}
          <div>
            <div className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-2">
              Danh sách món ăn &amp; Topping ({order.items.length})
            </div>
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {order.items.map((item, i) => (
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
              <span>{formatCurrency(order.subtotalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển:</span>
              <span>{formatCurrency(order.shippingFee)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Giảm giá voucher:</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <Divider className="my-2" />
            <div className="flex justify-between text-sm font-bold text-slate-900">
              <span>Tổng thanh toán:</span>
              <span className="text-base text-orange-600">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Action buttons inside drawer */}
          {order.statusCode === 'PENDING' && (
            <div className="pt-2 flex gap-3">
              <Button
                danger
                block
                onClick={() => onOpenCancelModal(order)}
                className="rounded-lg font-medium"
              >
                Từ chối đơn
              </Button>
              <Button
                type="primary"
                block
                icon={<CheckCircleOutlined />}
                onClick={() => onConfirmOrder(order)}
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
  );
};
