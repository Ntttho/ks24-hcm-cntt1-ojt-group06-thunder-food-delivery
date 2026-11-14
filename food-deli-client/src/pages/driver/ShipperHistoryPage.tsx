import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Tag, message } from 'antd';
import { ChevronLeft, RotateCcw, AlertCircle } from './icons';
import { useAuth } from '@/hooks/useAuth';
import {
  driverApi,
  DriverTripHistory,
  DriverIncomeStatistics,
  filterDriverTripHistory,
} from '@/services/modules/driverApi';
import { APP_ROUTES } from '@/constants';
import { DriverMetricsCard } from './components/DriverMetricsCard';
import { TripHistoryFilterBar } from './components/TripHistoryFilterBar';
import { TripHistoryTable } from './components/TripHistoryTable';
import { TripDetailModal } from './components/TripDetailModal';

export const ShipperHistoryPage: React.FC = () => {
  const { user } = useAuth();

  // State management
  const [stats, setStats] = useState<DriverIncomeStatistics | null>(null);
  const [allTrips, setAllTrips] = useState<DriverTripHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedTrip, setSelectedTrip] = useState<DriverTripHistory | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const dashboard = await driverApi.getHistoryDashboard({
        driverId: user?.id,
        period: 'all',
      });
      setStats(dashboard.stats);
      setAllTrips(dashboard.trips);
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || err?.message || 'Không thể tải lịch sử đơn hàng từ máy chủ.';
      console.error('Lỗi tải dữ liệu lịch sử đơn hàng:', err);
      setLoadError(errMsg);
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const trips = useMemo(
    () =>
      filterDriverTripHistory(allTrips, {
        period: selectedPeriod,
        statusFilter: selectedStatus,
        search: searchKeyword,
      }),
    [allTrips, selectedPeriod, selectedStatus, searchKeyword]
  );

  const driverName = user?.fullName || 'Tài xế Thunder';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-start items-center py-0 sm:py-6">
      {/* Top Navigation Bar */}
      <aside className="w-full max-w-5xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-3 shadow-md flex items-center justify-between text-xs sm:rounded-t-3xl">
        <div className="flex items-center gap-2">
          <Link
            to={APP_ROUTES.SHIPPER_DASHBOARD}
            className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-lg transition-all flex items-center gap-1 font-bold text-xs cursor-pointer"
            title="Quay lại Radar Quét đơn"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Radar Quét Đơn</span>
          </Link>
          <span className="text-white/40">|</span>
          <span className="font-black tracking-wide uppercase">LỊCH SỬ ĐƠN HÀNG &amp; THU NHẬP</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
            title="Làm mới dữ liệu từ máy chủ"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <Tag color="cyan" className="text-[10px] m-0 font-bold uppercase border-0">
            {driverName}
          </Tag>
        </div>
      </aside>

      {/* Main Container */}
      <main className="w-full max-w-5xl bg-slate-50 flex flex-col p-4 sm:p-6 shadow-2xl border-x border-b border-slate-200 sm:rounded-b-3xl min-h-[780px] space-y-6">
        {loadError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-rose-700 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loadError}</span>
            </div>
            <button
              onClick={loadHistory}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shrink-0 cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* 1. Summary Metrics & Performance */}
        {stats && <DriverMetricsCard stats={stats} />}

        {/* 2. Filters & Search Toolbar */}
        <TripHistoryFilterBar
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          searchKeyword={searchKeyword}
          onSearchChange={setSearchKeyword}
          totalDisplayCount={trips.length}
        />

        {/* 3. Trip History Table */}
        <TripHistoryTable
          trips={trips}
          loading={loading}
          onSelectTrip={setSelectedTrip}
        />
      </main>

      {/* 4. Trip Detail Modal */}
      <TripDetailModal
        trip={selectedTrip}
        onClose={() => setSelectedTrip(null)}
      />
    </div>
  );
};

export default ShipperHistoryPage;
