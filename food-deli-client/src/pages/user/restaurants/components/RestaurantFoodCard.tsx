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
  const isOutOfStock = food.isAvailable === false || (typeof food.currentQuantity === 'number' && food.currentQuantity <= 0);

  return (
    <div className={`group bg-white p-4 rounded-2xl border flex gap-4 transition-all justify-between items-center ${
      isOutOfStock ? 'opacity-75 border-gray-200 bg-gray-50/50' : 'border-gray-100 hover:shadow-md'
    }`}>
      <div className="flex flex-col justify-between flex-1 min-w-0 self-stretch py-0.5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className={`font-bold text-base leading-snug line-clamp-1 transition-colors ${
              isOutOfStock ? 'text-gray-400 line-through' : 'text-gray-900 group-hover:text-orange-600'
            }`}>
              {food.name}
            </h3>
            {isOutOfStock ? (
              <Tag color="default" className="text-[10px] font-bold px-1.5 py-0 border-none rounded bg-gray-200 text-gray-600">
                Hết món
              </Tag>
            ) : typeof food.currentQuantity === 'number' && food.currentQuantity > 0 && food.currentQuantity <= 10 ? (
              <Tag color="warning" className="text-[10px] font-bold px-1.5 py-0 border-none rounded">
                Còn {food.currentQuantity} phần
              </Tag>
            ) : null}
            {food.isPopular && !isOutOfStock && (
              <Tag color="volcano" className="text-[10px] font-bold px-1.5 py-0 border-none rounded">
                <FireOutlined /> Bán chạy
              </Tag>
            )}
            {food.isNew && !isOutOfStock && (
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
            <span className={`font-extrabold text-base sm:text-lg ${isOutOfStock ? 'text-gray-400' : 'text-orange-600'}`}>
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
            icon={!isOutOfStock ? <PlusOutlined /> : undefined}
            disabled={isOutOfStock}
            className={`h-9 rounded-xl px-3 font-bold shadow-sm transition-transform ${
              isOutOfStock ? 'bg-gray-200 text-gray-400 border-none' : 'bg-orange-500 hover:bg-orange-600 active:scale-95'
            }`}
            onClick={() => onAddToCart(food)}
          >
            <span>{isOutOfStock ? 'Hết hàng' : 'Thêm'}</span>
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
