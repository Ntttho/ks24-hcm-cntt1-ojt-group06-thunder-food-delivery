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
  isFirstItem = false,
  onUpdateQuantity,
  onRemoveItem,
  onEditOptions,
}) => {
  return (
    <div className="flex flex-col gap-space-xs pt-1">
      <div className="flex gap-space-md justify-between items-start">
        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="font-headline-sm text-headline-sm text-on-surface leading-snug font-bold">
            {item.name}
          </h3>
          {item.options && (
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">
              {item.options}
            </p>
          )}
          {item.note && (
            <div className="inline-flex items-center gap-1.5 mt-1.5 text-on-surface-variant text-body-sm font-body-sm bg-surface-container-low px-2 py-1 rounded-lg w-fit">
              <span className="material-symbols-outlined text-[14px] text-tertiary">
                edit_note
              </span>
              <span className="italic">"{item.note}"</span>
            </div>
          )}
          <div className="mt-2 text-headline-sm font-headline-sm text-on-surface font-bold">
            {(item.price * item.quantity).toLocaleString('vi-VN')}đ
            {item.quantity > 1 && (
              <span className="text-label-md font-label-md text-on-surface-variant font-normal ml-1">
                ({item.price.toLocaleString('vi-VN')}đ/phần)
              </span>
            )}
          </div>
        </div>

        {/* Dish Image */}
        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container shadow-sm">
          <img
            className="w-full h-full object-cover"
            src={item.imageUrl}
            alt={item.name}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2">
        {!isFirstItem ? (
          <button
            type="button"
            className="text-error font-label-md text-label-md flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer font-semibold"
            onClick={() => onRemoveItem(item.id)}
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Xoá món
          </button>
        ) : (
          <button
            type="button"
            className="text-primary font-label-md text-label-md flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer font-semibold"
            onClick={() => onEditOptions?.(item)}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            Chỉnh sửa
          </button>
        )}

        {/* Quantity Counter Pill */}
        <div className="flex items-center gap-3 bg-surface-container-low rounded-full px-2 py-1 shadow-sm">
          <button
            aria-label="Giảm số lượng"
            type="button"
            className="w-6 h-6 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface shadow-sm active:scale-95 transition-transform cursor-pointer"
            onClick={() => onUpdateQuantity(item.id, -1)}
          >
            <span className="material-symbols-outlined text-[14px]">remove</span>
          </button>
          <span className="font-headline-sm text-headline-sm text-on-surface min-w-[14px] text-center font-bold">
            {item.quantity}
          </span>
          <button
            aria-label="Tăng số lượng"
            type="button"
            className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-sm active:scale-95 transition-transform cursor-pointer"
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

