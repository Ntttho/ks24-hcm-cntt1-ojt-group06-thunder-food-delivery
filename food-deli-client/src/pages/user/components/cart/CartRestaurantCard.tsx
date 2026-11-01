import React from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/constants';

interface CartRestaurantCardProps {
  shopName?: string;
  deliveryTime?: string;
  distance?: string;
  shopId?: number | string;
}

export const CartRestaurantCard: React.FC<CartRestaurantCardProps> = ({
  shopName = 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi',
  deliveryTime = '20-25 phút',
  distance = '1.8 km',
  shopId = 1,
}) => {
  const navigate = useNavigate();

  return (
    <section className="px-gutter pt-space-md">
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs">
        <div className="flex items-center justify-between gap-space-xs">
          <div className="flex items-center gap-space-xs min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-[20px]">
                restaurant
              </span>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface truncate font-bold">
              {shopName}
            </h2>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-container/15 text-primary text-label-sm font-label-sm whitespace-nowrap">
            <span
              className="material-symbols-outlined text-[14px] mr-1"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            Đối tác ưu tiên
          </span>
        </div>
        <div className="flex items-center gap-space-md text-on-surface-variant text-body-sm font-body-sm pl-10">
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
            {deliveryTime} ({distance})
          </span>
          <span>•</span>
          <button
            type="button"
            onClick={() => navigate(shopId ? `/restaurants/${shopId}` : APP_ROUTES.HOME)}
            className="text-primary font-label-md hover:underline inline-flex items-center gap-0.5 cursor-pointer font-semibold"
          >
            Thêm món khác
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default CartRestaurantCard;

