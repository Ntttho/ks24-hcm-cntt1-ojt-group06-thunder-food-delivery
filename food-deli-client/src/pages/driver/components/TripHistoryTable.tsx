import React from 'react';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DollarSign, CreditCard, Wallet } from '../icons';
import type { DriverTripHistory } from '@/services/modules/driverApi';

interface TripHistoryTableProps {
  trips: DriverTripHistory[];
  loading: boolean;
  onSelectTrip: (trip: DriverTripHistory) => void;
}

export const TripHistoryTable: React.FC<TripHistoryTableProps> = ({
  trips,
  loading,
  onSelectTrip,
}) => {
  const renderPaymentBadge = (method: string, codAmount: number, isSuccess: boolean) => {
    switch ((method || '').toUpperCase()) {
      case 'COD':
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[11px] font-bold border border-amber-200 w-fit">
              <DollarSign className="w-3 h-3 text-amber-600" />
              Tiền mặt COD
            </span>
            {codAmount > 0 && isSuccess && (
              <span className="text-[10px] text-slate-500 font-bold mt-0.5">
                Đã thu: {codAmount.toLocaleString('vi-VN')} đ
              </span>
            )}
          </div>
        );
      case 'SEPAY':
      case 'VIETQR':
        return (
          <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md text-[11px] font-bold border border-teal-200">
            <CreditCard className="w-3 h-3 text-teal-600" />
            SePay (Napas 247)
          </span>
        );
      case 'VNPAY':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[11px] font-bold border border-blue-200">
            <CreditCard className="w-3 h-3 text-blue-600" />
            VNPAY
          </span>
        );
      case 'WALLET':
      case 'E_WALLET':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md text-[11px] font-bold border border-purple-200">
            <Wallet className="w-3 h-3 text-purple-600" />
            Ví điện tử
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-bold">
            {method || 'Chưa rõ'}
          </span>
        );
    }
  };

  const columns: ColumnsType<DriverTripHistory> = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderCode',
      key: 'orderCode',
      render: (code: string, record: DriverTripHistory) => (
        <div>
          <span className="font-black text-slate-900 text-xs">{code}</span>
          <span className="text-[11px] text-slate-400 block">{record.completedAt}</span>
        </div>
      ),
    },
    {
      title: 'Tên quán ăn',
      dataIndex: 'restaurantName',
      key: 'restaurantName',
      render: (name: string, record: DriverTripHistory) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{name}</span>
          <span className="text-[11px] text-slate-500 line-clamp-1">{record.restaurantAddress}</span>
        </div>
      ),
    },
    {
      title: 'Địa chỉ giao hàng',
      dataIndex: 'receiverAddress',
      key: 'receiverAddress',
      render: (address: string, record: DriverTripHistory) => (
        <div className="max-w-xs">
          <span className="font-medium text-slate-700 text-xs line-clamp-1">{address}</span>
          <span className="text-[11px] text-slate-400 block">
            Khách: {record.receiverName} ({record.distanceKm} km)
          </span>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (_: string, record: DriverTripHistory) => (
        <div>
          <Tag color={record.isSuccess ? 'success' : 'error'} className="m-0 font-bold text-[11px]">
            {record.statusLabel}
          </Tag>
          {!record.isSuccess && record.cancelReason && (
            <span className="text-[10px] text-rose-500 block mt-1 line-clamp-1">
              {record.cancelReason}
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string, record: DriverTripHistory) =>
        renderPaymentBadge(method, record.codAmount, record.isSuccess),
    },
    {
      title: 'Tiền cước thực nhận',
      dataIndex: 'earnedFee',
      key: 'earnedFee',
      align: 'right',
      render: (fee: number, record: DriverTripHistory) =>
        record.isSuccess ? (
          <span className="font-black text-emerald-600 text-sm">
            +{fee.toLocaleString('vi-VN')} đ
          </span>
        ) : (
          <div className="text-right">
            <span className="font-bold text-slate-400 text-xs line-through block">
              {record.shippingFee.toLocaleString('vi-VN')} đ
            </span>
            <span className="font-bold text-rose-500 text-[11px]">0 đ</span>
          </div>
        ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center',
      render: (_: any, record: DriverTripHistory) => (
        <button
          onClick={() => onSelectTrip(record)}
          className="text-emerald-600 hover:text-emerald-700 font-bold text-xs bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          Chi tiết
        </button>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <Table
        columns={columns}
        dataSource={trips}
        rowKey="id"
        loading={loading}
        scroll={{ x: 800 }}
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Tổng cộng ${total} chuyến xe`,
          className: 'px-4',
        }}
        locale={{
          emptyText: (
            <div className="py-8 text-center text-xs text-slate-400">
              Không tìm thấy chuyến xe nào phù hợp với bộ lọc.
            </div>
          ),
        }}
      />
    </div>
  );
};

