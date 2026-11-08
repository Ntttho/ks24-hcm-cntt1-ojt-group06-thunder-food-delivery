import React from 'react';
import type { CartItemType } from '../../types';

interface CartItemRowProps {
  item: CartItemType;
  isFirstItem?: boolean;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onEditOptions?: (item: CartItemType) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onRemoveItem,
  onEditOptions,
}) => {
  return (
    <div className="flex flex-col gap-2 py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex gap-3 justify-between items-start">
        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="text-base text-gray-900 leading-snug font-bold">
            {item.name}
          </h3>

          {item.options && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {item.options}
            </p>
          )}

          {/* Button to Add / Change Topping */}
          {onEditOptions && (
            <button
              type="button"
              onClick={() => onEditOptions(item)}
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100/80 px-2.5 py-1 rounded-lg w-fit cursor-pointer transition-colors border border-orange-200/60"
            >
              <span className="material-symbols-outlined text-[14px]">tune</span>
              <span>{item.options ? 'Đổi / Thêm topping' : '+ Thêm topping'}</span>
            </button>
          )}

          {item.note && (
            <div className="inline-flex items-center gap-1.5 mt-1.5 text-gray-600 text-xs bg-orange-50/70 px-2 py-0.5 rounded-md w-fit border border-orange-100">
              <span className="material-symbols-outlined text-[13px] text-orange-500">
                edit_note
              </span>
              <span className="italic">"{item.note}"</span>
            </div>
          )}

          <div className="mt-2 text-base text-orange-600 font-extrabold flex items-baseline gap-1.5">
            <span>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
            {item.quantity > 1 && (
              <span className="text-xs text-gray-400 font-normal">
                ({item.price.toLocaleString('vi-VN')}đ/phần)
              </span>
            )}
          </div>
        </div>

        {/* Dish Image */}
        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 shadow-2xs border border-gray-100">
          <img
            className="w-full h-full object-cover"
            src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'}
            alt={item.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        {/* Delete Item Button */}
        <button
          type="button"
          className="text-red-500 hover:text-red-600 text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-red-50"
          onClick={() => onRemoveItem(item.id)}
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
          <span>Xóa món</span>
        </button>

        {/* Quantity Counter Pill */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-2 py-1 shadow-2xs">
          <button
            aria-label="Giảm số lượng"
            type="button"
            className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 active:scale-90 transition-transform cursor-pointer shadow-xs"
            onClick={() => onUpdateQuantity(item.id, -1)}
          >
            <span className="material-symbols-outlined text-[14px]">remove</span>
          </button>

          <span className="text-sm font-extrabold text-gray-900 min-w-[20px] text-center">
            {item.quantity}
          </span>

          <button
            aria-label="Tăng số lượng"
            type="button"
            className="w-6 h-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-xs active:scale-90 transition-transform cursor-pointer"
            onClick={() => onUpdateQuantity(item.id, 1)}
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItemRow;
