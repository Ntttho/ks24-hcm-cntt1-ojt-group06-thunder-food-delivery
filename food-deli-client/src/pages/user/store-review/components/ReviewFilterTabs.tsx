import React from 'react';
import type { ReviewFilterType } from '../types';

interface ReviewFilterTabsProps {
  currentFilter: ReviewFilterType;
  onChangeFilter: (filter: ReviewFilterType) => void;
  counts: {
    all: number;
    withPhotos: number;
    star5: number;
    star4: number;
    star3: number;
    lowStar: number;
  };
}

export const ReviewFilterTabs: React.FC<ReviewFilterTabsProps> = ({
  currentFilter,
  onChangeFilter,
  counts,
}) => {
  const filters: { key: ReviewFilterType; label: string; count: number }[] = [
    { key: 'ALL', label: 'Tất cả', count: counts.all },
    { key: 'WITH_PHOTOS', label: 'Có hình ảnh', count: counts.withPhotos },
    { key: '5_STAR', label: '5 Sao', count: counts.star5 },
    { key: '4_STAR', label: '4 Sao', count: counts.star4 },
    { key: '3_STAR', label: '3 Sao', count: counts.star3 },
    { key: 'LOW_STAR', label: '1-2 Sao', count: counts.lowStar },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 scroll-smooth no-scrollbar">
      {filters.map((f) => {
        const isActive = currentFilter === f.key;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onChangeFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {f.label} ({f.count})
          </button>
        );
      })}
    </div>
  );
};

export default ReviewFilterTabs;

