import React from 'react';
import { Button, Tag } from 'antd';
import { FireOutlined, PlusOutlined } from '@ant-design/icons';
import { getOptimizedCloudinaryUrl } from '@/services/modules/cloudinaryService';
import type { FoodItem } from '../types';

interface RestaurantFoodCardProps {
  food: FoodItem;
  onAddToCart: (food: FoodItem) => void;
}

export const RestaurantFoodCard: React.FC<RestaurantFoodCardProps> = ({ food, onAddToCart }) => {
  return (
    <div className="group bg-white p-4 rounded-2xl border border-gray-100 flex gap-4 hover:shadow-md transition-all justify-between items-center">
      <div className="flex flex-col justify-between flex-1 min-w-0 self-stretch py-0.5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
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
            icon={<PlusOutlined />}
            className="h-9 rounded-xl bg-orange-500 px-3 font-bold hover:bg-orange-600 shadow-sm active:scale-95 transition-transform"
            onClick={() => onAddToCart(food)}
          >
            <span className="hidden sm:inline">Thêm</span>
          </Button>
        </div>
      </div>

      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-100 shrink-0 shadow-inner">
        <img
          src={getOptimizedCloudinaryUrl(food.imageUrl, 260, 260)}
          alt={food.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
          }}
        />
        {food.soldCount !== undefined && food.soldCount > 0 && (
          <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-[10px] text-white px-1.5 py-0.5 rounded font-medium">
            Đã bán {food.soldCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantFoodCard;
