import React from 'react';
import { Button, Tag } from 'antd';
<<<<<<< HEAD
import { PlusOutlined, FireOutlined } from '@ant-design/icons';
=======
import {
  PlusOutlined,
  FireOutlined,
  ClockCircleOutlined,
  StarFilled,
} from '@ant-design/icons';
>>>>>>> feature/restaurant-list
import type { FoodItem } from '../types';

interface StoreFoodCardProps {
  food: FoodItem;
  onAddToCart: (food: FoodItem) => void;
}

export const StoreFoodCard: React.FC<StoreFoodCardProps> = ({ food, onAddToCart }) => {
  return (
<<<<<<< HEAD
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-all flex gap-4 justify-between group">
=======
    <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-xs hover:shadow-md transition-all flex gap-3 sm:gap-4 justify-between group">
>>>>>>> feature/restaurant-list
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-orange-600 transition-colors line-clamp-1">
              {food.name}
            </h3>
            {food.isPopular && (
              <Tag color="volcano" className="text-[10px] font-bold px-1.5 py-0 border-none rounded">
                <FireOutlined /> Bán chạy
              </Tag>
            )}
            {food.isNew && (
              <Tag color="blue" className="text-[10px] font-bold px-1.5 py-0 border-none rounded">
                Mới
              </Tag>
            )}
          </div>
          <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
            {food.description}
          </p>
<<<<<<< HEAD
=======
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 font-bold text-amber-700">
              <StarFilled className="text-[10px] text-amber-500" />
              {food.rating ?? 4.8}
            </span>
            <span className="inline-flex items-center gap-1 text-gray-500">
              <ClockCircleOutlined />
              {food.prepTime ?? '15-20 phút'}
            </span>
          </div>
>>>>>>> feature/restaurant-list
        </div>

        <div className="flex items-center justify-between mt-3 pt-2">
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-orange-600 text-base sm:text-lg">
              {food.price.toLocaleString('vi-VN')}đ
            </span>
            {food.originalPrice && food.originalPrice > food.price && (
              <span className="text-xs text-gray-400 line-through">
                {food.originalPrice.toLocaleString('vi-VN')}đ
              </span>
            )}
          </div>

          <Button
            type="primary"
<<<<<<< HEAD
            shape="circle"
            icon={<PlusOutlined />}
            className="bg-orange-500 hover:bg-orange-600 shadow-sm active:scale-95 transition-transform"
            onClick={() => onAddToCart(food)}
          />
=======
            icon={<PlusOutlined />}
            className="h-9 rounded-xl bg-orange-500 px-3 font-bold hover:bg-orange-600 shadow-sm active:scale-95 transition-transform"
            onClick={() => onAddToCart(food)}
          >
            <span className="hidden sm:inline">Thêm</span>
          </Button>
>>>>>>> feature/restaurant-list
        </div>
      </div>

      {/* Dish Image */}
<<<<<<< HEAD
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-inner">
=======
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-inner">
>>>>>>> feature/restaurant-list
        <img
          src={food.imageUrl}
          alt={food.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {food.soldCount && (
          <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-[10px] text-white px-1.5 py-0.5 rounded font-medium">
            Đã bán {food.soldCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreFoodCard;
<<<<<<< HEAD

=======
>>>>>>> feature/restaurant-list
