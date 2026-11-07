import React, { useState, useEffect } from 'react';
import { Card, Button, Tag, message } from 'antd';
import {
  ClockCircleOutlined,
  QrcodeOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { orderApi } from '@/services/modules/orderApi';
import { paymentApi, type SepayGenerateResponse } from '@/services/modules/paymentApi';
import { SepayQrPaymentModal } from '../../checkout/components/SepayQrPaymentModal';

interface AwaitingPaymentOrdersCardProps {
  orders: any[];
  onRefresh: () => void;
}

export const AwaitingPaymentOrdersCard: React.FC<AwaitingPaymentOrdersCardProps> = ({
  orders,
  onRefresh,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [sepayQrData, setSepayQrData] = useState<SepayGenerateResponse | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Filter only AWAITING_PAYMENT orders
  const awaitingOrders = orders.filter((o) => o.statusCode === 'AWAITING_PAYMENT');

  if (awaitingOrders.length === 0) return null;

  const handleOpenPayment = async (order: any) => {
    setSelectedOrder(order);
    try {
      const res = await paymentApi.generateSepayQr({
        orderId: order.id,
        amount: Number(order.totalAmount || 0),
        orderInfo: `FOODDELI ORD${order.id}`,
      });
      setSepayQrData(res.data);
    } catch {
      // Fallback inside modal
    }
    setIsQrModalOpen(true);
  };

  const handleCancelOrder = async (orderId: number) => {
    setCancellingId(orderId);
    try {
      await orderApi.cancelOrder(orderId, 'Khách hàng hủy đơn trong thời gian chờ thanh toán');
      message.success('Đã hủy đơn hàng');
      onRefresh();
    } catch {
      message.error('Không thể hủy đơn hàng');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <span className="font-extrabold text-sm text-red-600 flex items-center gap-1.5">
          <ClockCircleOutlined className="animate-spin text-base" />
          ĐƠN HÀNG CHỜ THANH TOÁN SEPAY ({awaitingOrders.length})
        </span>
        <Button
          type="link"
          size="small"
          onClick={onRefresh}
          className="text-xs text-orange-600 font-semibold p-0"
        >
          Làm mới
        </Button>
      </div>

      {awaitingOrders.map((order) => {
        // Calculate remaining seconds out of 480 seconds (8 mins) from createdAt
        const createdTime = order.createdAt ? new Date(order.createdAt).getTime() : Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - createdTime) / 1000));
        const remaining = Math.max(0, 480 - elapsedSeconds);

        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        return (
          <Card
            key={order.id}
            className="rounded-2xl border-2 border-red-300 bg-red-50/40 shadow-xs text-left overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-red-100 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold font-mono text-slate-800 text-sm">
                  {order.orderCode}
                </span>
                <Tag color="error" className="font-extrabold px-2 py-0.5 rounded-full">
                  ⏳ Hết hạn sau: {timeStr}
                </Tag>
              </div>
              <span className="text-xs text-slate-400">
                {order.createdAt ? formatDate(order.createdAt) : ''}
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-600 mb-3">
              <div className="font-extrabold text-slate-800 text-sm">
                {order.restaurantName || `Quán ăn #${order.restaurantId}`}
              </div>
              <div className="text-slate-500 line-clamp-1">{order.receiverAddress}</div>
              <div className="flex justify-between items-center pt-1 font-semibold">
                <span className="text-slate-500">Phương thức: SePay VietQR (Napas 247)</span>
                <span className="text-orange-600 font-black text-base">
                  {formatCurrency(Number(order.totalAmount || 0))}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="primary"
                icon={<QrcodeOutlined />}
                onClick={() => handleOpenPayment(order)}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl font-bold border-none h-10 shadow-xs"
              >
                Tiếp tục quét mã thanh toán
              </Button>
              <Button
                danger
                loading={cancellingId === order.id}
                icon={<CloseCircleOutlined />}
                onClick={() => handleCancelOrder(order.id)}
                className="rounded-xl font-semibold h-10 text-xs"
              >
                Hủy đơn
              </Button>
            </div>
          </Card>
        );
      })}

      {/* QR Modal when user clicks 'Tiếp tục quét mã' */}
      {selectedOrder && (
        <SepayQrPaymentModal
          isOpen={isQrModalOpen}
          onClose={() => {
            setIsQrModalOpen(false);
            setSelectedOrder(null);
            onRefresh();
          }}
          qrData={sepayQrData}
          orderId={selectedOrder.id}
          totalAmount={Number(selectedOrder.totalAmount || 0)}
        />
      )}
    </div>
  );
};

export default AwaitingPaymentOrdersCard;
