import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag } from 'antd';
import {
  StarFilled,
  ClockCircleOutlined,
  ThunderboltFilled,
  EnvironmentOutlined,
  CarOutlined,
} from '@ant-design/icons';

export interface RestaurantData {
  id: number | string;
  name: string;
  cuisine: string;
  address: string;
  imageUrl: string;
  rating: number;
  reviewCount?: number;
  deliveryTime: string;
  distance: string;
  distanceKm?: number;
  shippingFee: number;
  isOpen: boolean;
  isFreeship?: boolean;
  promoTag?: string;
  isPartner?: boolean;
  priceRange?: string;
}

interface RestaurantCardProps {
  restaurant: RestaurantData;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/restaurants/${restaurant.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-xl hover:border-orange-200 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full transform hover:-translate-y-1"
    >
      {/* 1. Cover Image with Badges */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-gray-100">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            {restaurant.isPartner && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-md">
                <ThunderboltFilled className="text-xs" /> Pro
              </span>
            )}
            {restaurant.isFreeship && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-md">
                <CarOutlined className="text-xs" /> Freeship
              </span>
            )}
            {restaurant.promoTag && !restaurant.isFreeship && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500 text-white shadow-md">
                {restaurant.promoTag}
              </span>
            )}
          </div>

          <div>
            {restaurant.isOpen ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Mở cửa
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-900/80 text-gray-200 backdrop-blur-xs">
                Tạm đóng
              </span>
            )}
          </div>
        </div>

        {/* Bottom Distance & Time pill overlay */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg text-xs font-semibold bg-black/60 text-white backdrop-blur-xs flex items-center gap-2">
          <span className="flex items-center gap-1">
            <ClockCircleOutlined className="text-[11px]" /> {restaurant.deliveryTime}
          </span>
          <span>•</span>
          <span>{restaurant.distance}</span>
        </div>
      </div>

      {/* 2. Restaurant Body Details */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Category Tag & Rating */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <Tag color="orange" className="!mr-0 font-medium text-[11px] rounded-md">
              {restaurant.cuisine}
            </Tag>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
              <StarFilled className="text-amber-400" />
              <span>{restaurant.rating.toFixed(1)}</span>
              {restaurant.reviewCount && (
                <span className="text-gray-400 font-normal">({restaurant.reviewCount}+)</span>
              )}
            </div>
          </div>

          {/* Restaurant Name */}
          <h3 className="font-extrabold text-base text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1 mb-1">
            {restaurant.name}
          </h3>

          {/* Address */}
          <p className="text-xs text-gray-500 line-clamp-1 flex items-center gap-1 mb-0">
            <EnvironmentOutlined className="text-gray-400 shrink-0" />
            <span>{restaurant.address}</span>
          </p>
        </div>

        {/* 3. Footer: Shipping Fee & Price Level */}
        <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Phí giao:</span>
            {restaurant.shippingFee === 0 || restaurant.isFreeship ? (
              <span className="font-bold text-emerald-600">Miễn phí</span>
            ) : (
              <span className="font-bold text-gray-800">
                {restaurant.shippingFee.toLocaleString('vi-VN')}đ
              </span>
            )}
          </div>
          <span className="text-gray-400 font-medium">
            {restaurant.priceRange || '25k - 95k'}
          </span>
        </div>
      </div>
    </div>
  );
};

