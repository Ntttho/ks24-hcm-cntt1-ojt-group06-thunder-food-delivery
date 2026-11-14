import React from 'react';
import { Tag } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FireOutlined,
  DollarOutlined,
  CreditCardOutlined,
  CarOutlined,
} from '@ant-design/icons';

interface StatusBadgeProps {
  status: string;
}

export const MerchantStatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'PENDING':
      return (
        <Tag color="gold" className="font-semibold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
          <ClockCircleOutlined /> Đơn mới (PENDING)
        </Tag>
      );
    case 'CONFIRMED':
      return (
        <Tag color="processing" className="font-semibold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
          <FireOutlined /> Đang nấu (CONFIRMED)
        </Tag>
      );
    case 'DRIVER_ACCEPTED':
      return (
        <Tag color="cyan" className="font-semibold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
          <CarOutlined /> Tài xế đã nhận (DRIVER_ACCEPTED)
        </Tag>
      );
    case 'PICKING_UP':
      return (
        <Tag color="cyan" className="font-semibold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
          <CarOutlined /> Tài xế đang lấy món (PICKING_UP)
        </Tag>
      );
    case 'DELIVERING':
      return (
        <Tag color="cyan" className="font-semibold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
          <CarOutlined /> Đang giao tới khách (DELIVERING)
        </Tag>
      );
    case 'COMPLETED':
      return (
        <Tag color="success" className="font-semibold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
          <CheckCircleOutlined /> Hoàn thành (COMPLETED)
        </Tag>
      );
    case 'CANCELLED':
      return (
        <Tag color="error" className="font-semibold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
          <CloseCircleOutlined /> Đã hủy (CANCELLED)
        </Tag>
      );
    default:
      return <Tag>{status}</Tag>;
  }
};

interface PaymentBadgeProps {
  method?: string;
}

export const MerchantPaymentBadge: React.FC<PaymentBadgeProps> = ({ method }) => {
  if (method === 'VNPAY') {
    return (
      <Tag color="blue" className="rounded-md font-semibold text-[11px] px-2 py-0.5">
        <CreditCardOutlined className="mr-1" /> VNPay (Đã thanh toán)
      </Tag>
    );
  }
  return (
    <Tag color="orange" className="rounded-md font-semibold text-[11px] px-2 py-0.5">
      <DollarOutlined className="mr-1" /> Tiền mặt (COD)
    </Tag>
  );
};
