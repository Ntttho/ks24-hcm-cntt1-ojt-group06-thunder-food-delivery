import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { APP_ROUTES } from '@/constants';
import { useAppSelector } from '@/hooks/useAppSelector';
import { formatCurrency } from '@/utils/formatters';

export const HeaderCartPanel: React.FC = () => {
  const { items, shopName, totalQuantity, totalAmount } = useAppSelector((state) => state.cart);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        const toggle = document.getElementById('header-cart-toggle') as HTMLInputElement | null;
        if (toggle) toggle.checked = false;
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <input id="header-cart-toggle" type="checkbox" className="peer sr-only" />

      <label
        htmlFor="header-cart-toggle"
        className="relative z-20 flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-full transition-colors font-bold text-sm shadow-sm cursor-pointer"
      >
        <ShoppingCart className="h-5 w-5" />
        <span>Giỏ hàng</span>
        {totalQuantity > 0 && (
          <span className="flex items-center justify-center h-5 min-w-5 px-1.5 bg-rose-500 text-white text-[10px] font-black rounded-full">
            {totalQuantity}
          </span>
        )}
      </label>

      <div className="absolute right-0 top-full mt-2 w-[22rem] max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 hidden peer-checked:block">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-900">Giỏ hàng của bạn</p>
          <p className="text-xs text-slate-500 truncate">{shopName || 'Chưa chọn quán'}</p>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-sm text-slate-500 text-center">Giỏ hàng đang trống</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 px-4 py-3 border-b border-slate-50">
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 line-clamp-1">{item.productName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">x{item.quantity}</p>
                  <p className="text-sm font-bold text-primary mt-1">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 bg-slate-50 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-slate-500">Tạm tính</p>
            <p className="text-base font-black text-primary">{formatCurrency(totalAmount)}</p>
          </div>
          <Link
            to={APP_ROUTES.CART}
            className="px-4 py-2 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary-hover"
          >
            Xem giỏ hàng
          </Link>
        </div>
      </div>
    </div>
  );
};
