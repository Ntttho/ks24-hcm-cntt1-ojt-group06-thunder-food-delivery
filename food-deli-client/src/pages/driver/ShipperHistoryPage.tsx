import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Table, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Wallet,
  TrendingUp,
  Calendar,
  ChevronLeft,
  Search,
  DollarSign,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  CreditCard,
} from './icons';
import { useAuth } from '@/hooks/useAuth';
import {
  driverApi,
  DriverTripHistory,
  DriverIncomeStatistics,
  filterDriverTripHistory,
} from '@/services/modules/driverApi';
import { APP_ROUTES } from '@/constants';

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

  // Payment badge helper
  const renderPaymentBadge = (method: string, codAmount: number, isSuccess: boolean) => {
    switch (method.toUpperCase()) {
      case 'COD':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[11px] font-bold border border-amber-200">
            <DollarSign className="w-3 h-3 text-amber-600" />
            {isSuccess
              ? `COD (${codAmount > 0 ? `${codAmount.toLocaleString('vi-VN')} đ` : '0 đ'})`
              : 'COD (Chưa thu)'}
          </span>
        );
      case 'SEPAY':
      case 'VIETQR':
        return (
          <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md text-[11px] font-bold border border-teal-200">
            <CreditCard className="w-3 h-3 text-teal-600" />
            SePay (QR)
          </span>
        );
      case 'VNPAY':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[11px] font-bold border border-blue-200">
            <CreditCard className="w-3 h-3 text-blue-600" />
            VNPAY
          </span>
        );
      case 'WALLET':
      case 'E_WALLET':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md text-[11px] font-bold border border-purple-200">
            <Wallet className="w-3 h-3 text-purple-600" />
            Ví điện tử
          </span>
        );
      case 'UNKNOWN':
      case '':
        return (
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[11px] font-bold">
            Chưa rõ
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-bold">
            {method}
          </span>
        );
    }
  };

  // Ant Design Table Columns for Desktop view
  const columns: ColumnsType<DriverTripHistory> = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderCode',
      key: 'orderCode',
      render: (code: string, record: DriverTripHistory) => (
        <div>
          <span className="font-black text-slate-900 text-xs">{code}</span>
          <span className="text-[11px] text-slate-400 block">{record.completedAt}</span>
        </div>
      ),
    },
    {
      title: 'Tên quán ăn',
      dataIndex: 'restaurantName',
      key: 'restaurantName',
      render: (name: string, record: DriverTripHistory) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{name}</span>
          <span className="text-[11px] text-slate-500 line-clamp-1">{record.restaurantAddress}</span>
        </div>
      ),
    },
    {
      title: 'Địa chỉ giao hàng',
      dataIndex: 'receiverAddress',
      key: 'receiverAddress',
      render: (address: string, record: DriverTripHistory) => (
        <div className="max-w-xs">
          <span className="font-medium text-slate-700 text-xs line-clamp-1">{address}</span>
          <span className="text-[11px] text-slate-400 block">
            Khách: {record.receiverName} ({record.distanceKm} km)
          </span>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (_: string, record: DriverTripHistory) => (
        <div>
          <Tag color={record.isSuccess ? 'success' : 'error'} className="m-0 font-bold text-[11px]">
            {record.statusLabel}
          </Tag>
          {!record.isSuccess && record.cancelReason && (
            <span className="text-[10px] text-rose-500 block mt-1 line-clamp-1">
              {record.cancelReason}
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string, record: DriverTripHistory) =>
        renderPaymentBadge(method, record.codAmount, record.isSuccess),
    },
    {
      title: 'Tiền cước thực nhận',
      dataIndex: 'earnedFee',
      key: 'earnedFee',
      align: 'right',
      render: (fee: number, record: DriverTripHistory) =>
        record.isSuccess ? (
          <span className="font-black text-emerald-600 text-sm">
            +{fee.toLocaleString('vi-VN')} đ
          </span>
        ) : (
          <div className="text-right">
            <span className="font-bold text-slate-400 text-xs line-through block">
              {record.shippingFee.toLocaleString('vi-VN')} đ
            </span>
            <span className="font-bold text-rose-500 text-[11px]">0 đ</span>
          </div>
        ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center',
      render: (_: any, record: DriverTripHistory) => (
        <button
          onClick={() => setSelectedTrip(record)}
          className="text-emerald-600 hover:text-emerald-700 font-bold text-xs bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          Chi tiết
        </button>
      ),
    },
  ];

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
          <span className="font-black tracking-wide uppercase">LỊCH SỬ ĐƠN HÀNG & THU NHẬP</span>
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

        {/* =========================================================================
            SECTION 1: THẺ TỔNG KẾT THU NHẬP TÍCH LŨY TỪ ĐƠN HÀNG THẬT
           ========================================================================= */}
        {stats && (
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
                  <span>•</span>
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
                  <span>•</span>
                  <span>
                    <strong>{stats.failedTripsWeek}</strong> hủy/thất bại
                  </span>
                </div>
              </div>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Tổng đơn trong hệ thống:</span>
                <span className="font-black text-amber-400">
                  {stats.completedTripsAll} / {stats.totalTripsAll} đơn
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 2: BẢNG LỊCH SỬ ĐƠN HÀNG (THÀNH CÔNG & THẤT BẠI/HỦY)
           ========================================================================= */}
        <section
          aria-labelledby="trip-history-heading"
          className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4"
        >
          {/* Header Controls: Title & Period Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2
                id="trip-history-heading"
                className="text-base font-black text-slate-900 flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Lịch sử đơn hàng của tài xế
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hiển thị {trips.length} đơn ({stats?.completedTripsAll ?? 0} thành công •{' '}
                {stats?.failedTripsAll ?? 0} thất bại/hủy trong toàn hệ thống)
              </p>
            </div>

            {/* Period Filters */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
              <button
                onClick={() => setSelectedPeriod('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setSelectedPeriod('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === 'today'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Hôm nay
              </button>
              <button
                onClick={() => setSelectedPeriod('week')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === 'week'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tuần này
              </button>
            </div>
          </div>

          {/* Status Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl shrink-0 self-start">
              <button
                onClick={() => setSelectedStatus('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedStatus === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tất cả ({allTrips.length})
              </button>
              <button
                onClick={() => setSelectedStatus('SUCCESS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedStatus === 'SUCCESS'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Thành công ({stats?.completedTripsAll ?? 0})
              </button>
              <button
                onClick={() => setSelectedStatus('FAILED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedStatus === 'FAILED'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Thất bại / Hủy ({stats?.failedTripsAll ?? 0})
              </button>
            </div>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm theo mã đơn, tên quán, địa chỉ hoặc lý do hủy..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50/50"
              />
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <Table
              columns={columns}
              dataSource={trips}
              rowKey="id"
              loading={loading}
              locale={{ emptyText: 'Chưa có đơn hàng lịch sử nào phù hợp.' }}
              pagination={{ pageSize: 6, showTotal: (total) => `Tổng ${total} đơn hàng` }}
              className="text-xs"
            />
          </div>

          {/* Mobile Card List View */}
          <div className="sm:hidden space-y-3">
            {trips.length > 0 ? (
              trips.map((trip) => (
                <article
                  key={trip.id}
                  onClick={() => setSelectedTrip(trip)}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer space-y-2.5 active:scale-98"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-xs">{trip.orderCode}</span>
                        <Tag color={trip.isSuccess ? 'success' : 'error'} className="m-0 text-[10px] font-bold">
                          {trip.statusLabel}
                        </Tag>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{trip.completedAt}</span>
                    </div>
                    {trip.isSuccess ? (
                      <span className="font-black text-emerald-600 text-sm shrink-0">
                        +{trip.earnedFee.toLocaleString('vi-VN')} đ
                      </span>
                    ) : (
                      <span className="font-bold text-rose-500 text-xs shrink-0">0 đ</span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-start gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1"></span>
                      <span className="font-bold text-slate-800 line-clamp-1">
                        {trip.restaurantName}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1"></span>
                      <span className="text-slate-600 text-[11px] line-clamp-1">
                        {trip.receiverAddress}
                      </span>
                    </div>
                    {!trip.isSuccess && trip.cancelReason && (
                      <p className="text-[11px] text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                        Lý do: {trip.cancelReason}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    {renderPaymentBadge(trip.paymentMethod, trip.codAmount, trip.isSuccess)}
                    <span className="text-emerald-700 font-bold">Xem chi tiết &gt;</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                {loading ? 'Đang tải dữ liệu từ máy chủ...' : 'Không tìm thấy đơn hàng nào phù hợp.'}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modal chi tiết đơn hàng */}
      {selectedTrip && (
        <Modal
          open={true}
          onCancel={() => setSelectedTrip(null)}
          footer={null}
          centered
          className="rounded-3xl overflow-hidden"
          title={
            <div className="flex items-center gap-2">
              {selectedTrip.isSuccess ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600" />
              )}
              <span className="font-black text-sm">Chi tiết đơn hàng {selectedTrip.orderCode}</span>
              <Tag color={selectedTrip.isSuccess ? 'success' : 'error'} className="m-0 font-bold text-[11px]">
                {selectedTrip.statusLabel}
              </Tag>
            </div>
          }
        >
          <div className="space-y-4 pt-2 text-xs">
            {/* Hero cước & thanh toán */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                selectedTrip.isSuccess
                  ? 'bg-emerald-50 border-emerald-100'
                  : 'bg-rose-50 border-rose-100'
              }`}
            >
              <div>
                <span
                  className={`text-[11px] font-bold block ${
                    selectedTrip.isSuccess ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {selectedTrip.isSuccess ? 'Tiền cước tài xế thực nhận' : 'Đơn không hoàn thành (không cộng cước)'}
                </span>
                <span
                  className={`text-2xl font-black ${
                    selectedTrip.isSuccess ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {selectedTrip.isSuccess
                    ? `+${selectedTrip.earnedFee.toLocaleString('vi-VN')} đ`
                    : '0 đ'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block mb-1">Hình thức thanh toán</span>
                {renderPaymentBadge(selectedTrip.paymentMethod, selectedTrip.codAmount, selectedTrip.isSuccess)}
              </div>
            </div>

            {!selectedTrip.isSuccess && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-[11px]">
                <strong className="block mb-0.5">Lý do thất bại / hủy:</strong>
                <span>{selectedTrip.cancelReason || 'Không có ghi chú lý do từ hệ thống.'}</span>
              </div>
            )}

            {/* Timeline Route */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 relative pl-6">
              <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-slate-200"></div>

              {/* Point of Pickup */}
              <div className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Điểm lấy món</p>
                  <p className="font-bold text-slate-900 text-xs mt-0.5">{selectedTrip.restaurantName}</p>
                  <p className="text-[11px] text-slate-500">{selectedTrip.restaurantAddress}</p>
                </div>
              </div>

              {/* Point of Dropoff */}
              <div className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-100"></div>
                <div>
                  <p className="text-[10px] font-bold text-rose-700 uppercase">Điểm giao hàng</p>
                  <p className="font-bold text-slate-900 text-xs mt-0.5">
                    {selectedTrip.receiverName} ({selectedTrip.receiverPhone})
                  </p>
                  <p className="text-[11px] text-slate-500">{selectedTrip.receiverAddress}</p>
                </div>
              </div>
            </div>

            {/* Item summary */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
              <span className="font-bold text-slate-700 text-xs block">Danh sách món ăn:</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">{selectedTrip.itemsSummary}</p>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-400">
                <span>Khoảng cách: {selectedTrip.distanceKm} km</span>
                <span>Thời gian: {selectedTrip.completedAt}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTrip(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ShipperHistoryPage;
