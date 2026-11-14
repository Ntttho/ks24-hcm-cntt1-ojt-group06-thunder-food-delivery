import React from 'react';
import { Search } from '../icons';

interface TripHistoryFilterBarProps {
  selectedPeriod: 'today' | 'week' | 'all';
  onPeriodChange: (period: 'today' | 'week' | 'all') => void;
  selectedStatus: 'ALL' | 'SUCCESS' | 'FAILED';
  onStatusChange: (status: 'ALL' | 'SUCCESS' | 'FAILED') => void;
  searchKeyword: string;
  onSearchChange: (keyword: string) => void;
  totalDisplayCount: number;
}

export const TripHistoryFilterBar: React.FC<TripHistoryFilterBarProps> = ({
  selectedPeriod,
  onPeriodChange,
  selectedStatus,
  onStatusChange,
  searchKeyword,
  onSearchChange,
  totalDisplayCount,
}) => {
  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
      {/* 1. Filter Tabs: Thời gian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold shrink-0">
          <button
            onClick={() => onPeriodChange('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              selectedPeriod === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Tất cả thời gian
          </button>
          <button
            onClick={() => onPeriodChange('today')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              selectedPeriod === 'today'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Hôm nay
          </button>
          <button
            onClick={() => onPeriodChange('week')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              selectedPeriod === 'week'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            7 ngày qua
          </button>
        </div>

        {/* 2. Filter Status: Tất cả / Thành công / Thất bại */}
        <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => onStatusChange('ALL')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              selectedStatus === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => onStatusChange('SUCCESS')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              selectedStatus === 'SUCCESS'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Giao thành công
          </button>
          <button
            onClick={() => onStatusChange('FAILED')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              selectedStatus === 'FAILED'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
            }`}
          >
            Đơn hủy / Thất bại
          </button>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo mã đơn (ORD-...), tên quán, tên khách hàng hoặc địa chỉ..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl text-xs text-slate-800 placeholder-slate-400 transition-colors outline-none"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-bold">
          {totalDisplayCount} chuyến
        </div>
      </div>
    </div>
  );
};

