import React from 'react';
import { Tag } from 'antd';
import {
  StarFilled,
  ClockCircleOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { getOptimizedCloudinaryUrl } from '@/services/modules/cloudinaryService';
import type { StoreDetail } from '../types';

interface StoreHeroBannerProps {
  store: StoreDetail;
  onViewReviews?: () => void;
}

export const StoreHeroBanner: React.FC<StoreHeroBannerProps> = ({ store, onViewReviews }) => {
  return (
    <div className="relative bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-gray-100">
        <img
          src={getOptimizedCloudinaryUrl(store.coverImageUrl, 1200, 400)}
          alt={store.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-4 left-4 flex gap-2">
          {store.isVerified && (
            <Tag color="green" className="font-bold flex items-center gap-1 px-3 py-1 rounded-full border-none shadow-sm">
              <CheckCircleFilled /> Đối tác ưu tiên
            </Tag>
          )}
          <Tag color="orange" className="font-bold px-3 py-1 rounded-full border-none shadow-sm">
            Giao siêu tốc {store.deliveryTime}
          </Tag>
        </div>
      </div>

      {/* Info Body */}
      <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 sm:-mt-20 relative z-10">
        <div className="flex items-start sm:items-end gap-4 sm:gap-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white flex-shrink-0">
            <img
              src={getOptimizedCloudinaryUrl(store.avatarUrl, 200, 200)}
              alt={store.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {store.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <EnvironmentOutlined className="text-orange-500" />
                {store.address} ({store.distance})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <PhoneOutlined /> {store.phone}
              </span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onViewReviews}
                className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg text-amber-700 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
              >
                <StarFilled className="text-amber-500" />
                <span>{store.rating.toFixed(1)}</span>
                <span className="text-amber-600 font-normal">({store.reviewCount}+ đánh giá)</span>
              </button>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <ClockCircleOutlined /> {store.openTime} - {store.closeTime}
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 self-start md:self-auto">
          {store.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoreHeroBanner;

