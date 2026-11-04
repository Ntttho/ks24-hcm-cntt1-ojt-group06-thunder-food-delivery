import React from 'react';
import { Select, Button } from 'antd';
import {
  FilterOutlined,
  ThunderboltFilled,
  StarFilled,
  ClockCircleOutlined,
  CarOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

export const CUISINES_LIST = [
  { key: 'ALL', label: 'Tất cả', icon: '🍽️' },
  { key: 'Cơm', label: 'Cơm & Cơm tấm', icon: '🍛' },
  { key: 'Bún / Phở', label: 'Bún / Phở / Mì', icon: '🍜' },
  { key: 'Trà sữa', label: 'Trà sữa & Đồ uống', icon: '🧋' },
  { key: 'Đồ ăn nhanh', label: 'Đồ ăn nhanh', icon: '🍔' },
  { key: 'Món Hàn', label: 'Món Hàn', icon: '🍲' },
  { key: 'Món Nhật', label: 'Món Nhật', icon: '🍣' },
  { key: 'Đồ ăn vặt', label: 'Đồ ăn vặt', icon: '🍟' },
  { key: 'Đồ chay', label: 'Đồ chay thanh tịnh', icon: '🥗' },
  { key: 'Cà phê', label: 'Cà phê & Bánh ngọt', icon: '☕' },
];

export interface FilterState {
  selectedCuisine: string;
  sortBy: string;
  openOnly: boolean;
  freeshipOnly: boolean;
  highRatingOnly: boolean;
  fastDeliveryOnly: boolean;
  partnerOnly: boolean;
}

interface RestaurantFilterBarProps {
  filters: FilterState;
  onChange: (updater: (prev: FilterState) => FilterState) => void;
  onReset: () => void;
  totalCount: number;
}

export const RestaurantFilterBar: React.FC<RestaurantFilterBarProps> = ({
  filters,
  onChange,
  onReset,
  totalCount,
}) => {
  const hasActiveFilters =
    filters.selectedCuisine !== 'ALL' ||
    filters.openOnly ||
    filters.freeshipOnly ||
    filters.highRatingOnly ||
    filters.fastDeliveryOnly ||
    filters.partnerOnly ||
    filters.sortBy !== 'POPULAR';

  return (
    <div className="space-y-4">
      {/* 1. Horizontal Scrollable Cuisine Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CUISINES_LIST.map((c) => {
          const isActive = filters.selectedCuisine === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() =>
                onChange((prev) => ({
                  ...prev,
                  selectedCuisine: c.key,
                }))
              }
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs ${
                isActive
                  ? 'bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 border-transparent'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-400 hover:text-orange-600'
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Quick Toggles & Sort Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-gray-100">
        {/* Quick Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-wrap">
          {/* Open Only */}
          <button
            type="button"
            onClick={() => onChange((prev) => ({ ...prev, openOnly: !prev.openOnly }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              filters.openOnly
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${filters.openOnly ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            <span>Đang mở cửa</span>
          </button>

          {/* Freeship */}
          <button
            type="button"
            onClick={() => onChange((prev) => ({ ...prev, freeshipOnly: !prev.freeshipOnly }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              filters.freeshipOnly
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            <CarOutlined className={filters.freeshipOnly ? 'text-emerald-600' : 'text-gray-400'} />
            <span>Freeship</span>
          </button>

          {/* High Rating */}
          <button
            type="button"
            onClick={() => onChange((prev) => ({ ...prev, highRatingOnly: !prev.highRatingOnly }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              filters.highRatingOnly
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            <StarFilled className={filters.highRatingOnly ? 'text-amber-500' : 'text-gray-400'} />
            <span>4.5+ ⭐</span>
          </button>

          {/* Fast Delivery */}
          <button
            type="button"
            onClick={() => onChange((prev) => ({ ...prev, fastDeliveryOnly: !prev.fastDeliveryOnly }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              filters.fastDeliveryOnly
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            <ClockCircleOutlined className={filters.fastDeliveryOnly ? 'text-blue-500' : 'text-gray-400'} />
            <span>Giao &lt;20p</span>
          </button>

          {/* Thunder Pro */}
          <button
            type="button"
            onClick={() => onChange((prev) => ({ ...prev, partnerOnly: !prev.partnerOnly }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              filters.partnerOnly
                ? 'bg-orange-50 text-orange-700 border-orange-300'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            <ThunderboltFilled className={filters.partnerOnly ? 'text-orange-500' : 'text-gray-400'} />
            <span>Đối tác Pro</span>
          </button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={onReset}
              className="text-xs text-gray-500 hover:text-orange-600 font-medium"
            >
              Đặt lại
            </Button>
          )}
        </div>

        {/* Right side: Count & Sort Dropdown */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
          <span className="text-xs text-gray-400 font-medium">
            Tìm thấy <strong className="text-gray-800">{totalCount}</strong> quán ăn
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium hidden sm:inline flex items-center gap-1">
              <FilterOutlined /> Sắp xếp:
            </span>
            <Select
              value={filters.sortBy}
              onChange={(value) => onChange((prev) => ({ ...prev, sortBy: value }))}
              className="w-44 text-xs font-semibold"
              options={[
                { value: 'POPULAR', label: '🔥 Gợi ý phổ biến' },
                { value: 'RATING_DESC', label: '⭐ Đánh giá cao nhất' },
                { value: 'DISTANCE_ASC', label: '📍 Gần tôi nhất' },
                { value: 'DELIVERY_FAST', label: '⚡ Giao nhanh nhất' },
                { value: 'SHIPPING_LOW', label: '🛵 Phí ship thấp nhất' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
