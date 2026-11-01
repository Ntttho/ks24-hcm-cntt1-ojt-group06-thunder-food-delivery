import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCartOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { APP_ROUTES } from '@/constants';

interface StoreCartDrawerProps {
  totalQuantity: number;
  totalAmount: number;
}

export const StoreCartDrawer: React.FC<StoreCartDrawerProps> = ({
  totalQuantity,
  totalAmount,
}) => {
  const navigate = useNavigate();

  if (totalQuantity <= 0) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-40 max-w-xl mx-auto animate-bounce-subtle">
      <div
        onClick={() => navigate(APP_ROUTES.CART)}
        className="bg-gray-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between cursor-pointer hover:bg-black transition-all hover:scale-[1.01]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white text-lg shadow-md font-bold">
            <ShoppingCartOutlined />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">{totalQuantity} món trong giỏ</div>
            <div className="font-extrabold text-base text-orange-400">
              {totalAmount.toLocaleString('vi-VN')}đ
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors">
          <span>Xem giỏ hàng</span>
          <ArrowRightOutlined />
        </div>
      </div>
    </div>
  );
};

export default StoreCartDrawer;

