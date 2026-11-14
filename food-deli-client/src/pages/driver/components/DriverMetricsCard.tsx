import React from 'react';
import { Wallet, TrendingUp, Calendar, AlertCircle } from '../icons';
import type { DriverIncomeStatistics } from '@/services/modules/driverApi';

interface DriverMetricsCardProps {
  stats: DriverIncomeStatistics;
}

export const DriverMetricsCard: React.FC<DriverMetricsCardProps> = ({ stats }) => {
  return (
    <div className="space-y-4">
      {/* 3 Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Tổng cước tích lũy */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-600" />
              Tổng cước đã quyết toán
            </span>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">
              Tích lũy
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {stats.walletBalance.toLocaleString('vi-VN')} đ
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Chỉ cộng tiền cước từ các đơn giao thành công
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
            <span className="text-[11px]">Đơn thất bại / hủy:</span>
            <span className="text-rose-600 font-black">{stats.failedTripsAll} đơn</span>
          </div>
        </div>

        {/* 2. Thu nhập hôm nay */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-100 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-200" />
              Thu nhập hôm nay
            </span>
            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Hôm nay
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight">
              {stats.todayEarnings.toLocaleString('vi-VN')} đ
            </div>
            <div className="mt-2 text-xs flex items-center gap-3 text-emerald-100">
              <span>
                <strong>{stats.completedTripsToday}</strong> thành công
              </span>
              <span>&bull;</span>
              <span>
                <strong>{stats.failedTripsToday}</strong> hủy/thất bại
              </span>
            </div>
          </div>
          <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs">
            <span className="text-emerald-200 text-[11px]">Tỷ lệ hoàn thành:</span>
            <span className="font-black text-white">{stats.completionRate}%</span>
          </div>
        </div>

        {/* 3. Thu nhập tích lũy tuần này */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/15 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              Thu nhập tuần này
            </span>
            <span className="bg-white/10 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
              7 ngày qua
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-amber-400">
              {stats.weekEarnings.toLocaleString('vi-VN')} đ
            </div>
            <div className="mt-2 text-xs flex items-center gap-3 text-slate-300">
              <span>
                <strong>{stats.completedTripsWeek}</strong> thành công
              </span>
              <span>&bull;</span>
              <span>
                <strong>{stats.failedTripsWeek}</strong> hủy/thất bại
              </span>
            </div>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Tổng chuyến:</span>
            <span className="font-black text-white">{stats.totalTripsAll} cuốc</span>
          </div>
        </div>
      </div>

      {/* Driver Performance Metrics (AR / CR) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            ⚡
          </div>
          <div>
            <div className="font-bold text-slate-800">Hiệu suất hoạt động tài xế</div>
            <div className="text-slate-400 text-[11px]">Dựa trên 100 cuốc xe gần nhất theo quy định Food Thunder</div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center sm:text-right">
            <span className="text-[11px] text-slate-400 block font-semibold">Tỷ lệ Nhận đơn (AR)</span>
            <span className={`text-base font-black ${stats.acceptanceRate >= 80 ? 'text-emerald-600' : 'text-amber-500'}`}>
              {stats.acceptanceRate}%
            </span>
          </div>

          <div className="text-center sm:text-right">
            <span className="text-[11px] text-slate-400 block font-semibold">Tỷ lệ Hủy đơn (CR)</span>
            <span className={`text-base font-black ${stats.completionRate >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {100 - stats.completionRate}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

