import React from 'react';

export interface CheckoutOrderItemData {
  id: string | number;
  name: string;
  quantity: number;
  price: number;
  toppings?: string[];
  note?: string;
}

interface CheckoutOrderItemsProps {
  isOrderSummaryOpen: boolean;
  onToggleSummary: () => void;
  kitchenNote: string;
  onChangeKitchenNote: (note: string) => void;
  selectedKitchenChips: string[];
  onToggleKitchenChip: (chip: string) => void;
  subtotal: number;
  items?: CheckoutOrderItemData[];
  shopName?: string;
}

const DEFAULT_KITCHEN_CHIPS = [
  'Ít cay',
  'Không cay',
  'Để riêng nước sốt',
  'Nhiều đá',
  'Ít ngọt',
  'Nóng hổi',
];

export const CheckoutOrderItems: React.FC<CheckoutOrderItemsProps> = ({
  isOrderSummaryOpen,
  onToggleSummary,
  kitchenNote,
  onChangeKitchenNote,
  selectedKitchenChips,
  onToggleKitchenChip,
  subtotal,
  items = [],
  shopName = 'Thunder Food Delivery',
}) => {
  const displayItems = items.length > 0 ? items : [
    {
      id: 1,
      name: 'Món ăn trong giỏ hàng',
      quantity: 1,
      price: subtotal,
      toppings: [],
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden flex flex-col">
      {/* Merchant Header */}
      <div className="p-4 flex items-center justify-between bg-orange-50/50 border-b border-gray-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600 font-bold">
            <span className="material-symbols-outlined text-[18px]">storefront</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-900 truncate font-extrabold">
                {shopName}
              </span>
              <span
                className="material-symbols-outlined text-orange-500 text-[15px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <span className="text-xs text-gray-400 truncate">
              Đơn hàng được chế biến tươi nóng theo yêu cầu
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-label="Thu gọn hoặc mở rộng danh sách"
          className="flex items-center gap-1 text-gray-600 text-xs px-2.5 py-1 rounded-lg bg-white border border-gray-200 active:scale-95 transition-all cursor-pointer hover:bg-gray-50 font-semibold"
          onClick={onToggleSummary}
        >
          <span>{displayItems.length} món</span>
          <span
            className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${
              isOrderSummaryOpen ? 'rotate-0' : 'rotate-180'
            }`}
          >
            keyboard_arrow_up
          </span>
        </button>
      </div>

      {/* Items List */}
      {isOrderSummaryOpen && (
        <div className="p-4 flex flex-col gap-3 transition-all">
          <div className="divide-y divide-gray-100">
            {displayItems.map((item) => (
              <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="bg-orange-100 text-orange-700 text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.quantity}x
                  </span>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm text-gray-900 font-bold leading-snug">
                      {item.name}
                    </p>
                    {item.toppings && item.toppings.length > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.toppings.join(', ')}
                      </p>
                    )}
                    {item.note && (
                      <span className="text-orange-600 text-xs mt-0.5 italic">
                        Ghi chú: {item.note}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-gray-900 text-sm">
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Kitchen Note & Quick Chips */}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-orange-500 text-[16px]">
                soup_kitchen
              </span>
              Ghi chú cho quán ăn
            </span>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_KITCHEN_CHIPS.map((chip) => {
                const isSelected = selectedKitchenChips.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => onToggleKitchenChip(chip)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-500 text-white font-bold shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={kitchenNote}
              onChange={(e) => onChangeKitchenNote(e.target.value)}
              placeholder="VD: Không hành lá, xin thêm muỗng nĩa..."
              className="mt-1 w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-gray-50/50"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutOrderItems;
