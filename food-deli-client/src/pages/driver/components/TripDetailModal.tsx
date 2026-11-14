import React from 'react';
import { Modal, Tag } from 'antd';
import { CheckCircle, AlertCircle, DollarSign, CreditCard, Wallet } from '../icons';
import type { DriverTripHistory } from '@/services/modules/driverApi';

interface TripDetailModalProps {
  trip: DriverTripHistory | null;
  onClose: () => void;
}

export const TripDetailModal: React.FC<TripDetailModalProps> = ({ trip, onClose }) => {
  if (!trip) return null;

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

  return (
    <Modal
      open={true}
      onCancel={onClose}
      footer={null}
      centered
      className="rounded-3xl overflow-hidden"
      title={
        <div className="flex items-center gap-2">
          {trip.isSuccess ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
          <span className="font-black text-sm">Chi tiết đơn hàng {trip.orderCode}</span>
          <Tag color={trip.isSuccess ? 'success' : 'error'} className="m-0 font-bold text-[11px]">
            {trip.statusLabel}
          </Tag>
        </div>
      }
    >
      <div className="space-y-4 pt-2 text-xs">
        {/* Hero cước & thanh toán */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            trip.isSuccess
              ? 'bg-emerald-50 border-emerald-100'
              : 'bg-rose-50 border-rose-100'
          }`}
        >
          <div>
            <span
              className={`text-[11px] font-bold block ${
                trip.isSuccess ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {trip.isSuccess ? 'Tiền cước tài xế thực nhận' : 'Đơn không hoàn thành (không cộng cước)'}
            </span>
            <span
              className={`text-2xl font-black ${
                trip.isSuccess ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trip.isSuccess
                ? `+${trip.earnedFee.toLocaleString('vi-VN')} đ`
                : '0 đ'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block mb-1">Hình thức thanh toán</span>
            {renderPaymentBadge(trip.paymentMethod, trip.codAmount, trip.isSuccess)}
          </div>
        </div>

        {!trip.isSuccess && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-[11px]">
            <strong className="block mb-0.5">Lý do thất bại / hủy:</strong>
            <span>{trip.cancelReason || 'Không có ghi chú lý do từ hệ thống.'}</span>
          </div>
        )}

        {/* Timeline Route */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 relative pl-6">
          <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-slate-200"></div>

          {/* Point of Pickup */}
          <div className="relative">
            <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></div>
            <div>
              <p className="text-[10px] font-bold text-emerald-700 uppercase">Điểm lấy món</p>
              <p className="font-bold text-slate-900 text-xs mt-0.5">{trip.restaurantName}</p>
              <p className="text-[11px] text-slate-500">{trip.restaurantAddress}</p>
            </div>
          </div>

          {/* Point of Dropoff */}
          <div className="relative">
            <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-100"></div>
            <div>
              <p className="text-[10px] font-bold text-rose-700 uppercase">Điểm giao hàng</p>
              <p className="font-bold text-slate-900 text-xs mt-0.5">
                {trip.receiverName} ({trip.receiverPhone})
              </p>
              <p className="text-[11px] text-slate-500">{trip.receiverAddress}</p>
            </div>
          </div>
        </div>

        {/* Item summary */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
          <span className="font-bold text-slate-700 text-xs block">Danh sách món ăn:</span>
          <p className="text-slate-600 text-xs leading-relaxed">
            {trip.itemsSummary || 'Chi tiết các món ăn theo đơn hàng.'}
          </p>
        </div>

        {/* Distance & Info */}
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block">Khoảng cách giao hàng</span>
            <span className="font-bold text-slate-800 text-xs">{trip.distanceKm} km</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block">Thời gian hoàn thành</span>
            <span className="font-bold text-slate-800 text-xs">{trip.completedAt}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

