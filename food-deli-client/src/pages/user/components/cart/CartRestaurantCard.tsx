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
    <section className="px-4 pt-4">
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 font-bold">
              <span className="material-symbols-outlined text-[20px]">
                storefront
              </span>
            </div>
            <h2 className="text-base text-gray-900 truncate font-extrabold !mb-0">
              {shopName}
            </h2>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold whitespace-nowrap border border-orange-200">
            <span
              className="material-symbols-outlined text-[13px] mr-1 text-orange-500"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            Đối tác chính thức
          </span>
        </div>
        <div className="flex items-center gap-3 text-gray-500 text-xs pl-11">
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[15px] text-orange-500">schedule</span>
            {deliveryTime} ({distance})
          </span>
          <span>•</span>
          <button
            type="button"
            onClick={() => navigate(shopId ? `/restaurants/${shopId}` : APP_ROUTES.HOME)}
            className="text-orange-600 hover:text-orange-700 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
          >
            <span>Thêm món khác</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default CartRestaurantCard;
