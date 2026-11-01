import React from 'react';
import { useNavigate } from 'react-router-dom';

interface CartHeaderProps {
  shopName?: string;
  distance?: string;
}

export const CartHeader: React.FC<CartHeaderProps> = ({
  shopName = 'Cơm Tấm Sà Bì Chưởng',
  distance = '1.8 km',
}) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 w-full z-40 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-xl mx-auto h-16 px-gutter flex items-center justify-between gap-space-xs">
        <div className="flex items-center gap-space-xs min-w-0 flex-1">
          <button
            type="button"
            aria-label="Quay lại"
            className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors flex-shrink-0 cursor-pointer"
            onClick={() => navigate(-1)}
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-primary to-primary-container flex items-center justify-center text-on-primary font-extrabold text-sm flex-shrink-0 shadow-sm">
            ⚡
          </div>
          <div className="flex flex-col min-w-0 ml-space-xs">
            <h1 className="font-headline-sm text-headline-sm text-on-surface truncate leading-tight font-bold">
              Giỏ hàng của bạn
            </h1>
            <div className="flex items-center gap-1 text-on-surface-variant truncate">
              <span className="material-symbols-outlined text-[14px] text-primary">storefront</span>
              <span className="font-label-sm text-label-sm truncate">
                {shopName} • {distance}
              </span>
            </div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-space-xs shadow-xs">
          <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
        </div>
      </div>
    </header>
  );
};

export default CartHeader;

