import React from 'react';
import { Row, Col, Button, Tag } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  FireOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { MerchantOrder } from '@/services/modules/orderApi';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { MerchantStatusBadge, MerchantPaymentBadge } from './MerchantStatusBadge';

interface MerchantOrderCardProps {
  order: MerchantOrder;
  submittingAction: boolean;
  onConfirmOrder: (order: MerchantOrder) => void;
  onOpenCancelModal: (order: MerchantOrder) => void;
  onViewDetail: (order: MerchantOrder) => void;
}

export const MerchantOrderCard: React.FC<MerchantOrderCardProps> = ({
  order,
  submittingAction,
  onConfirmOrder,
  onOpenCancelModal,
  onViewDetail,
}) => {
  const isPending = order.statusCode === 'PENDING';
  const isConfirmed = order.statusCode === 'CONFIRMED';
  const isCompleted = order.statusCode === 'COMPLETED';
  const isCancelled = order.statusCode === 'CANCELLED';

  return (
    <div
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
          <MerchantStatusBadge status={order.statusCode} />
          <MerchantPaymentBadge method={order.paymentMethod} />
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
            onClick={() => onViewDetail(order)}
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
                onClick={() => onOpenCancelModal(order)}
                className="rounded-lg font-medium"
              >
                Báo hết món / Từ chối đơn
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => onConfirmOrder(order)}
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
                onClick={() => onOpenCancelModal(order)}
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
};
