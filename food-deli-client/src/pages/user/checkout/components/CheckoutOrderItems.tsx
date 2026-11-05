import React from 'react';

interface CheckoutOrderItemsProps {
  isOrderSummaryOpen: boolean;
  onToggleSummary: () => void;
  kitchenNote: string;
  onChangeKitchenNote: (note: string) => void;
  selectedKitchenChips: string[];
  onToggleKitchenChip: (chip: string) => void;
  subtotal: number;
}

export const CheckoutOrderItems: React.FC<CheckoutOrderItemsProps> = ({
  isOrderSummaryOpen,
  onToggleSummary,
  kitchenNote,
  onChangeKitchenNote,
  selectedKitchenChips,
  onToggleKitchenChip,
  subtotal,
}) => {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Merchant Header */}
      <div className="p-space-lg flex items-center justify-between bg-surface-container-low/60 border-b border-surface-container-high/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center flex-shrink-0 text-primary">
            <span className="material-symbols-outlined text-[20px]">restaurant</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-headline-sm text-headline-sm text-on-surface truncate font-bold">
                Cơm Tấm Sà Bì Chưởng
              </span>
              <span
                className="material-symbols-outlined text-primary text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
              Chi nhánh Nguyễn Trãi, Quận 1
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-label="Thu gọn hoặc mở rộng danh sách"
          className="flex items-center gap-1 text-on-surface-variant font-label-md text-label-md px-2 py-1 rounded bg-surface-container-lowest active:scale-95 transition-transform cursor-pointer hover:bg-surface-container font-semibold"
          onClick={onToggleSummary}
        >
          <span>Chi tiết (3 món)</span>
          <span
            className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
              isOrderSummaryOpen ? 'rotate-0' : 'rotate-180'
            }`}
          >
            keyboard_arrow_up
          </span>
        </button>
      </div>

      {/* Items List */}
      {isOrderSummaryOpen && (
        <div className="p-space-lg flex flex-col gap-3.5 transition-all">
          {/* Item 1 */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="bg-surface-container-high text-on-surface font-label-sm text-label-sm w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                1x
              </span>
              <div className="flex flex-col min-w-0">
                <p className="font-body-lg text-body-lg text-on-surface font-semibold leading-tight">
                  Cơm Tấm Sườn Bì Chả Đặc Biệt
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Sườn nướng mật ong, nước mắm kẹo, mỡ hành nhiều
                </p>
                <span className="text-tertiary text-xs mt-0.5 italic">
                  Ghi chú: Ít cơm, nhiều dưa chua
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="font-bold text-on-surface">89.000đ</span>
            </div>
          </div>

          {/* Item 2 */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="bg-surface-container-high text-on-surface font-label-sm text-label-sm w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                1x
              </span>
              <div className="flex flex-col min-w-0">
                <p className="font-body-lg text-body-lg text-on-surface font-semibold leading-tight">
                  Canh Khổ Qua Nhồi Thịt
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Nóng hổi, chuẩn vị truyền thống
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="font-bold text-on-surface">35.000đ</span>
            </div>
          </div>

          {/* Item 3 */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="bg-surface-container-high text-on-surface font-label-sm text-label-sm w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                2x
              </span>
              <div className="flex flex-col min-w-0">
                <p className="font-body-lg text-body-lg text-on-surface font-semibold leading-tight">
                  Trà Tắc Xí Muội Khổng Lồ
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  70% đường, 100% đá
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="font-bold text-on-surface">48.000đ</span>
              <p className="text-[11px] text-on-surface-variant">24.000đ/ly</p>
            </div>
          </div>

          {/* Kitchen Note Box */}
          <div className="p-3 rounded-xl bg-surface-container-low/70 flex flex-col gap-2 border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  soup_kitchen
                </span>
                <span className="font-label-sm text-label-sm font-bold text-on-surface">
                  Dặn dò Quán ăn &amp; Bếp
                </span>
              </div>
              <span className="text-[11px] font-label-sm text-on-surface-variant">Tùy chọn</span>
            </div>

            <div className="flex items-center justify-between bg-surface-container-lowest px-3 py-2 rounded-lg border border-surface-container-high">
              <input
                type="text"
                placeholder="Ghi chú cho quán (dị ứng, gia vị...)..."
                className="w-full bg-transparent text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none"
                value={kitchenNote}
                onChange={(e) => onChangeKitchenNote(e.target.value)}
              />
              <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
                edit_note
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {['+ Ít cay', '+ Không hành lá', '+ Để riêng nước sốt', '+ Lấy thêm muỗng đũa'].map(
                (chip) => {
                  const isSelected = selectedKitchenChips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      className={`flex-shrink-0 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm transition-all active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-secondary text-white font-bold'
                          : 'bg-surface-container-high/60 text-on-surface hover:bg-secondary-fixed hover:text-secondary'
                      }`}
                      onClick={() => onToggleKitchenChip(chip)}
                    >
                      {chip}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Cutlery footnote */}
          <div className="pt-2 flex items-center justify-between text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">eco</span>
              <span className="text-xs">Kèm muỗng nĩa &amp; khăn giấy</span>
            </div>
            <div className="text-xs text-on-surface">
              Tạm tính: <span className="font-bold">{subtotal.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutOrderItems;

