import React from 'react';
import { Link } from 'react-router-dom';
import { CarOutlined, PhoneOutlined, ShopOutlined } from '@ant-design/icons';

interface OrderContactCardsProps {
  driverName?: string;
  driverPhone?: string;
  restaurantId: number;
  restaurantName?: string;
  distanceKm?: number;
}

export const OrderContactCards: React.FC<OrderContactCardsProps> = ({
  driverName = 'Nguyễn Tuấn Tài (Tài xế Thunder)',
  driverPhone,
  restaurantId,
  restaurantName,
  distanceKm = 2.1,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
      {/* Driver Card */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shrink-0">
            <CarOutlined />
          </div>
          <div>
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              Tài xế phụ trách
            </div>
            <div className="font-bold text-gray-900 text-sm">{driverName}</div>
            <div className="text-xs text-gray-500">Xe máy • 59-P1 888.99</div>
          </div>
        </div>
        {driverPhone && (
          <a
            href={`tel:${driverPhone}`}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs"
          >
            <PhoneOutlined /> Gọi tài xế
          </a>
        )}
      </div>

      {/* Restaurant Card */}
      <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xl shrink-0">
            <ShopOutlined />
          </div>
          <div>
            <div className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">
              Quán ăn
            </div>
            <div className="font-bold text-gray-900 text-sm truncate max-w-[200px]">
              {restaurantName}
            </div>
            <div className="text-xs text-gray-500">Khoảng cách: ~{distanceKm} km</div>
          </div>
        </div>
        <Link
          to={`/restaurants/${restaurantId}`}
          className="px-3 py-1.5 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 font-bold rounded-xl text-xs flex items-center gap-1"
        >
          Xem quán
        </Link>
      </div>
    </div>
  );
};

export default OrderContactCards;

