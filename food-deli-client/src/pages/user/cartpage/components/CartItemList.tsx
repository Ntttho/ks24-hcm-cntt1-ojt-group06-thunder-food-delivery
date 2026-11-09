import React, { useMemo } from 'react';
import { Checkbox, Tag } from 'antd';
import type { CartItemType } from '../../types';
import { CartItemRow } from './CartItemRow';

interface CartItemListProps {
  items: CartItemType[];
  totalItemCount: number;
  onToggleSelectItem: (id: string) => void;
  onToggleSelectShop: (shopId: number, selected: boolean) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onEditOptions?: (item: CartItemType) => void;
  onClearCart?: () => void;
}

export const CartItemList: React.FC<CartItemListProps> = ({
  items,
  totalItemCount,
  onToggleSelectItem,
  onToggleSelectShop,
  onUpdateQuantity,
  onRemoveItem,
  onEditOptions,
  onClearCart,
}) => {
  // Group items by shopId
  const groupedByShop = useMemo(() => {
    const map = new Map<number, { shopName: string; items: CartItemType[] }>();
    items.forEach((item) => {
      const sId = item.shopId || 1;
      const sName = item.shopName || 'Quán ăn';
      if (!map.has(sId)) {
        map.set(sId, { shopName: sName, items: [] });
      }
      map.get(sId)!.items.push(item);
    });
    return Array.from(map.entries()).map(([shopId, data]) => ({
      shopId,
      shopName: data.shopName,
      items: data.items,
    }));
  }, [items]);

  return (
    <section className="px-4 mt-3 flex flex-col gap-3">
      {/* Top Header of Cart */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-slate-800">
            Giỏ hàng của bạn ({groupedByShop.length} quán ăn)
          </span>
          <span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">
            {totalItemCount} món
          </span>
        </div>

        {onClearCart && items.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-gray-400 hover:text-red-500 text-xs font-semibold cursor-pointer transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Shopee-style: Render each restaurant as a grouped block */}
      {groupedByShop.map((group) => {
        const allSelected = group.items.every((it) => it.selected !== false);
        const someSelected = group.items.some((it) => it.selected !== false);
        const shopSelectedCount = group.items.filter((it) => it.selected !== false).length;

        return (
          <div
            key={group.shopId}
            className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
              someSelected ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-100'
            }`}
          >
            {/* Restaurant Group Header with Checkbox */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50/70 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={(e) => onToggleSelectShop(group.shopId, e.target.checked)}
                />
                <span className="material-symbols-outlined text-orange-500 text-lg">storefront</span>
                <span className="font-extrabold text-sm text-slate-800">
                  {group.shopName}
                </span>
                <Tag color="orange" className="text-[10px] font-bold px-1.5 py-0 rounded">
                  {group.items.length} món
                </Tag>
              </div>

              {shopSelectedCount > 0 && (
                <span className="text-xs text-orange-600 font-bold">
                  Đã chọn {shopSelectedCount}/{group.items.length}
                </span>
              )}
            </div>

            {/* List of Items for this Shop */}
            <div className="p-3 divide-y divide-gray-100">
              {group.items.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5 py-3 first:pt-1 last:pb-1">
                  <div className="pt-2">
                    <Checkbox
                      checked={item.selected !== false}
                      onChange={() => onToggleSelectItem(item.id)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CartItemRow
                      item={item}
                      onUpdateQuantity={onUpdateQuantity}
                      onRemoveItem={onRemoveItem}
                      onEditOptions={onEditOptions}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default CartItemList;
