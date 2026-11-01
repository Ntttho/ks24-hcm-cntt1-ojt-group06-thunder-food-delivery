import React from 'react';
import type { CartItemType } from '../../types';
import { CartItemRow } from './CartItemRow';

interface CartItemListProps {
  items: CartItemType[];
  totalItemCount: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onRestoreSampleItems?: () => void;
  onEditOptions?: (item: CartItemType) => void;
}

export const CartItemList: React.FC<CartItemListProps> = ({
  items,
  totalItemCount,
  onUpdateQuantity,
  onRemoveItem,
  onRestoreSampleItems,
  onEditOptions,
}) => {
  return (
    <section className="px-gutter mt-space-md">
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
            Món đã chọn
          </span>
          <span className="text-label-sm font-label-sm text-on-surface-variant font-medium">
            {items.length} món ({totalItemCount} phần)
          </span>
        </div>

        {items.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center text-on-surface-variant gap-2">
            <span className="material-symbols-outlined text-4xl text-outline">
              shopping_basket
            </span>
            <p className="font-body-md font-medium">Giỏ hàng của bạn đang trống</p>
            {onRestoreSampleItems && (
              <button
                type="button"
                onClick={onRestoreSampleItems}
                className="mt-2 text-primary text-sm font-semibold hover:underline cursor-pointer"
              >
                Khôi phục món mẫu thử nghiệm
              </button>
            )}
          </div>
        ) : (
          items.map((item, index) => (
            <React.Fragment key={item.id}>
              <CartItemRow
                item={item}
                isFirstItem={index === 0}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
                onEditOptions={onEditOptions}
              />
              {index < items.length - 1 && (
                <div className="h-[1px] bg-surface-container-highest w-full my-1" />
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </section>
  );
};

export default CartItemList;

