import React from 'react';
import type { UpsellItemType } from '../../types';

interface CartUpsellRailProps {
  upsellItems: UpsellItemType[];
  onAddUpsell: (item: UpsellItemType) => void;
}

export const CartUpsellRail: React.FC<CartUpsellRailProps> = ({
  upsellItems,
  onAddUpsell,
}) => {
  return (
    <section className="mt-space-md flex flex-col">
      <div className="px-gutter flex items-center justify-between mb-space-xs">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-[20px]">thumb_up</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            Món ngon gợi ý thêm
          </h3>
        </div>
        <span className="text-label-sm font-label-sm text-on-surface-variant font-medium">
          Thường gọi kèm
        </span>
      </div>

      {/* Horizontal Scroll Carousel */}
      <div className="flex gap-space-md overflow-x-auto px-gutter py-2 scroll-smooth no-scrollbar">
        {upsellItems.map((upsell) => (
          <div
            key={upsell.id}
            className="flex-shrink-0 w-36 bg-surface-container-lowest rounded-xl p-2.5 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all"
          >
            <div>
              <div className="relative w-full h-24 rounded-lg overflow-hidden bg-surface-container mb-2 shadow-inner">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src={upsell.imageUrl}
                  alt={upsell.name}
                />
                <button
                  aria-label={`Thêm ${upsell.name}`}
                  type="button"
                  className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
                  onClick={() => onAddUpsell(upsell)}
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
              <h4 className="font-label-md text-label-md text-on-surface line-clamp-1 font-bold">
                {upsell.name}
              </h4>
            </div>
            <p className="font-headline-sm text-headline-sm text-primary mt-1 font-extrabold">
              +{upsell.price.toLocaleString('vi-VN')}đ
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CartUpsellRail;

