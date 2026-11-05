import React from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/constants';

interface CheckoutSuccessModalProps {
  isOpen: boolean;
  finalTotal: number;
  onReset: () => void;
  shopName?: string;
  orderCode?: string;
}

export const CheckoutSuccessModal: React.FC<CheckoutSuccessModalProps> = ({
  isOpen,
  finalTotal,
  onReset,
  shopName = 'Cơm Tấm Sà Bì Chưởng',
  orderCode = '#THUNDER-8829',
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <span
            className="material-symbols-outlined text-4xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Đặt đơn thành công!</h3>
          <p className="text-sm text-gray-500 mt-1">
            {shopName} đang chuẩn bị món ăn cho bạn. Shipper sẽ nhận đơn trong ít phút.
          </p>
        </div>
        <div className="w-full bg-gray-50 p-3 rounded-2xl text-left text-xs text-gray-600 flex flex-col gap-1 border border-gray-100">
          <div className="flex justify-between">
            <span>Mã đơn:</span>
            <span className="font-bold text-gray-800">{orderCode}</span>
          </div>
          <div className="flex justify-between">
            <span>Thời gian dự kiến:</span>
            <span className="font-semibold text-primary">20 - 25 phút</span>
          </div>
          <div className="flex justify-between">
            <span>Tổng thanh toán:</span>
            <span className="font-bold text-primary text-sm">
              {finalTotal.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full pt-2">
          <button
            type="button"
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-container shadow-md cursor-pointer"
            onClick={() => navigate(APP_ROUTES.ORDERS)}
          >
            Theo dõi đơn hàng
          </button>
          <button
            type="button"
            className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 cursor-pointer"
            onClick={() => {
              onReset();
              navigate(APP_ROUTES.HOME);
            }}
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessModal;

