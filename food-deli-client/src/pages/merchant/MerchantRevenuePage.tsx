import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Select,
  Segmented,
  DatePicker,
  Table,
  Tag,
  Progress,
  Empty,
  Spin,
  message,
  Tooltip as AntTooltip,
  Badge,
} from 'antd';
import {
  DollarCircleOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  PieChartOutlined,
  ReloadOutlined,
  ShopOutlined,
  BarChartOutlined,
  LineChartOutlined,
  TrophyOutlined,
  CalendarOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useMerchantContext } from '@/layouts/merchant/MerchantLayout';
import {
  revenueApi,
  type MerchantRevenueSummary,
  type RevenueChartData,
  type TopSellingFood,
  type MultiBranchRevenue,
} from '@/services/modules/revenueApi';
import { formatCurrency } from '@/utils/formatters';

const { RangePicker } = DatePicker;

export const MerchantRevenuePage: React.FC = () => {
  const { restaurantId, activeRestaurant, restaurants, setActiveRestaurant } = useMerchantContext();

  // Filter states
  const [selectedBranchId, setSelectedBranchId] = useState<string>('CURRENT'); // 'ALL' | 'CURRENT' | specific id
  const [period, setPeriod] = useState<string>('WEEK'); // 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM'
  const [customDates, setCustomDates] = useState<[string, string] | null>(null);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<MerchantRevenueSummary | null>(null);
  const [chartData, setChartData] = useState<RevenueChartData | null>(null);
  const [topFoods, setTopFoods] = useState<TopSellingFood[]>([]);
  const [branchesData, setBranchesData] = useState<MultiBranchRevenue[]>([]);

  // Synchronize branch selection with MerchantLayout's activeRestaurant
  useEffect(() => {
    if (selectedBranchId !== 'ALL' && activeRestaurant) {
      setSelectedBranchId(String(activeRestaurant.id));
    }
  }, [activeRestaurant]);

  // Determine current active restaurant IDs for query
  const targetParams = useMemo(() => {
    const allShopIds = restaurants.map((s) => s.id);
    if (selectedBranchId === 'ALL') {
      return {
        restaurantId: undefined,
        restaurantIds: allShopIds,
      };
    }
    const currentId = selectedBranchId === 'CURRENT' ? (restaurantId || allShopIds[0] || 1) : Number(selectedBranchId);
    return {
      restaurantId: currentId,
      restaurantIds: undefined,
    };
  }, [selectedBranchId, restaurantId, restaurants]);

  // Fetch all revenue data
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const allShopIds = restaurants.map((s) => s.id);
      const startDate = customDates ? customDates[0] : undefined;
      const endDate = customDates ? customDates[1] : undefined;

      const baseParams = {
        restaurantId: targetParams.restaurantId,
        restaurantIds: targetParams.restaurantIds,
        period,
        startDate,
        endDate,
      };

      // 1. Fetch KPI Summary
      const summaryPromise = revenueApi.getSummary(baseParams);

      // 2. Fetch Chart Data
      const chartPromise = revenueApi.getChart(baseParams);

      // 3. Fetch Top Foods
      const topFoodsPromise = revenueApi.getTopFoods({
        ...baseParams,
        limit: 5,
      });

      // 4. Fetch Multi-branch Comparison (if merchant has >= 1 shops)
      const branchesPromise = allShopIds.length > 0
        ? revenueApi.getBranches(allShopIds, period, startDate, endDate)
        : Promise.resolve({ data: [] } as any);

      const [summaryRes, chartRes, topFoodsRes, branchesRes] = await Promise.all([
        summaryPromise,
        chartPromise,
        topFoodsPromise,
        branchesPromise,
      ]);

      if (summaryRes?.data) setSummary(summaryRes.data);
      if (chartRes?.data) setChartData(chartRes.data);
      if (topFoodsRes?.data) setTopFoods(topFoodsRes.data);
      if (branchesRes?.data) setBranchesData(branchesRes.data);
    } catch {
      message.error('Không thể đồng bộ dữ liệu doanh thu từ máy chủ');
    } finally {
      setLoading(false);
    }
  }, [targetParams, period, customDates, restaurants]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle switching branch from this page
  const handleSelectBranch = (val: string) => {
    setSelectedBranchId(val);
    if (val !== 'ALL') {
      const match = restaurants.find((s) => s.id === Number(val));
      if (match) {
        setActiveRestaurant(match);
        localStorage.setItem('thunder_merchant_active_shop_id', String(match.id));
        message.info(`Đã chọn chi nhánh: ${match.name}`);
      }
    } else {
      message.info('Đang xem dữ liệu tổng hợp của tất cả các chi nhánh');
    }
  };

  // Format Y-axis tick values (e.g. 1.000.000 -> 1M)
  const formatYAxisTick = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return String(val);
  };

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-orange-100 text-xs space-y-1.5 min-w-[180px]">
          <div className="font-bold text-gray-800 border-b border-gray-100 pb-1 flex items-center justify-between">
            <span>{data.label || label}</span>
            <span className="text-[10px] text-gray-400 font-normal">{data.date}</span>
          </div>
          <div className="flex items-center justify-between text-orange-600 font-semibold pt-0.5">
            <span>Doanh thu:</span>
            <span className="text-sm font-bold">{formatCurrency(data.revenue)}</span>
          </div>
          <div className="flex items-center justify-between text-emerald-600">
            <span>Đơn hoàn tất:</span>
            <span className="font-bold">{data.orderCount} đơn</span>
          </div>
          {data.cancelledCount > 0 && (
            <div className="flex items-center justify-between text-rose-500">
              <span>Đơn bị hủy:</span>
              <span>{data.cancelledCount} đơn</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const currentBranchName = useMemo(() => {
    if (selectedBranchId === 'ALL') return `Tất cả chi nhánh (${restaurants.length} quán)`;
    const found = restaurants.find((s) => s.id === Number(selectedBranchId));
    return found ? found.name : activeRestaurant?.name || 'Chi nhánh hiện tại';
  }, [selectedBranchId, restaurants, activeRestaurant]);

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar: Title, Branch Switcher & Period Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Báo Cáo Doanh Thu Đa Quán
            </h1>
            <Tag color="orange" className="rounded-full px-2.5 font-bold uppercase text-[10px]">
              Merchant Portal
            </Tag>
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
            <CalendarOutlined className="text-orange-500" />
            Đang hiển thị dữ liệu của: <strong className="text-gray-800">{currentBranchName}</strong>
          </p>
        </div>

        {/* Filters Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch Selector */}
          <Select
            value={selectedBranchId}
            onChange={handleSelectBranch}
            className="w-56"
            prefix={<ShopOutlined className="text-orange-500" />}
            options={[
              ...(restaurants.length > 1
                ? [{ value: 'ALL', label: `✨ Tất cả chi nhánh (${restaurants.length} quán)` }]
                : []),
              ...restaurants.map((s) => ({
                value: String(s.id),
                label: `🏪 ${s.name}`,
              })),
            ]}
          />

          {/* Period Selector */}
          <Segmented
            value={period}
            onChange={(val) => {
              setPeriod(val as string);
              if (val !== 'CUSTOM') setCustomDates(null);
            }}
            options={[
              { label: 'Hôm nay', value: 'DAY' },
              { label: '7 ngày qua', value: 'WEEK' },
              { label: 'Tháng này', value: 'MONTH' },
              { label: 'Năm nay', value: 'YEAR' },
              { label: 'Tùy chọn', value: 'CUSTOM' },
            ]}
            className="bg-gray-100 p-1 font-semibold text-xs"
          />

          {/* Date Range Picker when CUSTOM is selected */}
          {period === 'CUSTOM' && (
            <RangePicker
              onChange={(_, dateStrings) => {
                if (dateStrings[0] && dateStrings[1]) {
                  setCustomDates([dateStrings[0], dateStrings[1]]);
                }
              }}
              className="rounded-lg text-xs"
            />
          )}

          {/* Refresh Button */}
          <AntTooltip title="Làm mới số liệu">
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={() => fetchData()}
              className="rounded-xl border-gray-200 hover:border-orange-500 hover:text-orange-600"
            />
          </AntTooltip>
        </div>
      </div>

      {/* 2. Revenue, commission and settlement KPI cards */}
      <Row gutter={[16, 16]}>
        {/* Total Revenue */}
        <Col xs={24} sm={12} lg={8}>
          <Card className="rounded-2xl border-orange-200/80 bg-linear-to-br from-amber-50 to-orange-100/60 shadow-xs hover:shadow-md transition-all">
            <Statistic
              title={<span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Tổng Doanh Thu Thu Về</span>}
              value={summary ? formatCurrency(summary.totalRevenue) : '0 ₫'}
              valueStyle={{ color: '#c2410c', fontWeight: 800, fontSize: '1.45rem' }}
              prefix={<DollarCircleOutlined className="text-orange-500 mr-2 text-2xl" />}
            />
            <div className="mt-2.5 pt-2 border-t border-orange-200/60 flex items-center justify-between text-[11px] text-amber-800">
              <span>Đã hoàn thành thanh toán</span>
              <span className="font-bold text-orange-700">Đơn COMPLETED</span>
            </div>
          </Card>
        </Col>

        {/* Successful Orders */}
        <Col xs={24} sm={12} lg={8}>
          <Card className="rounded-2xl border-emerald-200/80 bg-linear-to-br from-emerald-50 to-teal-100/60 shadow-xs hover:shadow-md transition-all">
            <Statistic
              title={<span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Đơn Hàng Hoàn Thành</span>}
              value={summary?.successfulOrders ?? 0}
              suffix={<span className="text-xs font-semibold text-emerald-700">đơn</span>}
              valueStyle={{ color: '#047857', fontWeight: 800, fontSize: '1.45rem' }}
              prefix={<CheckCircleOutlined className="text-emerald-500 mr-2 text-2xl" />}
            />
            <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-800">
              <span>Tổng đơn phát sinh:</span>
              <span className="font-bold text-emerald-900">{summary?.totalOrders ?? 0} đơn</span>
            </div>
          </Card>
        </Col>

        {/* Average Order Value (AOV) */}
        <Col xs={24} sm={12} lg={8}>
          <Card className="rounded-2xl border-blue-200/80 bg-linear-to-br from-blue-50 to-indigo-100/60 shadow-xs hover:shadow-md transition-all">
            <Statistic
              title={<span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Giá Trị TB / Đơn (AOV)</span>}
              value={summary ? formatCurrency(summary.averageOrderValue) : '0 ₫'}
              valueStyle={{ color: '#1d4ed8', fontWeight: 800, fontSize: '1.45rem' }}
              prefix={<ShoppingOutlined className="text-blue-500 mr-2 text-2xl" />}
            />
            <div className="mt-2.5 pt-2 border-t border-blue-200/60 flex items-center justify-between text-[11px] text-blue-800">
              <span>Giảm giá/voucher đã cấp:</span>
              <span className="font-bold text-blue-900">{summary ? formatCurrency(summary.totalDiscount) : '0 ₫'}</span>
            </div>
          </Card>
        </Col>

        {/* Completion Rate */}
        <Col xs={24} sm={12} lg={8}>
          <Card className="rounded-2xl border-purple-200/80 bg-linear-to-br from-purple-50 to-fuchsia-100/60 shadow-xs hover:shadow-md transition-all">
            <Statistic
              title={<span className="text-xs font-bold text-purple-900 uppercase tracking-wider">Tỉ Lệ Hoàn Tất Đơn</span>}
              value={summary?.completionRate ?? 0}
              suffix="%"
              valueStyle={{ color: '#7e22ce', fontWeight: 800, fontSize: '1.45rem' }}
              prefix={<PieChartOutlined className="text-purple-500 mr-2 text-2xl" />}
            />
            <div className="mt-2.5 pt-2 border-t border-purple-200/60 flex items-center justify-between text-[11px] text-purple-800">
              <span>Số đơn bị hủy / từ chối:</span>
              <span className="font-bold text-rose-600">{summary?.cancelledOrders ?? 0} đơn</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card className="rounded-2xl border-rose-200/80 bg-linear-to-br from-rose-50 to-pink-100/60 shadow-xs hover:shadow-md transition-all">
            <Statistic
              title={<span className="text-xs font-bold text-rose-900 uppercase tracking-wider">Hoa hồng nền tảng</span>}
              value={summary ? formatCurrency(summary.platformCommission) : '0 ₫'}
              valueStyle={{ color: '#be123c', fontWeight: 800, fontSize: '1.45rem' }}
            />
            <div className="mt-2.5 border-t border-rose-200/60 pt-2 text-[11px] text-rose-800">
              Tính theo tỷ lệ áp dụng tại thời điểm tạo đơn
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card className="rounded-2xl border-teal-200/80 bg-linear-to-br from-teal-50 to-emerald-100/60 shadow-xs hover:shadow-md transition-all">
            <Statistic
              title={<span className="text-xs font-bold text-teal-900 uppercase tracking-wider">Khoản nhà hàng nhận</span>}
              value={summary ? formatCurrency(summary.restaurantPayout) : '0 ₫'}
              valueStyle={{ color: '#0f766e', fontWeight: 800, fontSize: '1.45rem' }}
            />
            <div className="mt-2.5 border-t border-teal-200/60 pt-2 text-[11px] text-teal-800">
              Giá trị món sau khi trừ hoa hồng nền tảng
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3. Interactive Chart & Best-Sellers Row */}
      <Row gutter={[20, 20]}>
        {/* Left: Main Revenue Visual Chart */}
        <Col xs={24} lg={16}>
          <Card
            className="rounded-2xl border-gray-100 shadow-2xs"
            title={
              <div className="flex items-center justify-between py-1">
                <div>
                  <h3 className="font-bold text-base text-gray-900">Biểu Đồ Xu Hướng Doanh Thu</h3>
                  <p className="text-xs text-gray-400 font-normal mt-0.5">
                    Biến động dòng tiền theo các mốc thời gian ({chartData?.points?.length || 0} điểm dữ liệu)
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
                  <Button
                    size="small"
                    type={chartType === 'area' ? 'primary' : 'text'}
                    icon={<LineChartOutlined />}
                    onClick={() => setChartType('area')}
                    className={chartType === 'area' ? 'bg-orange-500' : ''}
                  />
                  <Button
                    size="small"
                    type={chartType === 'bar' ? 'primary' : 'text'}
                    icon={<BarChartOutlined />}
                    onClick={() => setChartType('bar')}
                    className={chartType === 'bar' ? 'bg-orange-500' : ''}
                  />
                </div>
              </div>
            }
          >
            {loading ? (
              <div className="h-80 flex flex-col items-center justify-center gap-3">
                <Spin size="large" />
                <span className="text-gray-400 text-xs">Đang tổng hợp biểu đồ...</span>
              </div>
            ) : !chartData?.points || chartData.points.length === 0 ? (
              <div className="h-80 flex items-center justify-center">
                <Empty description="Chưa có dữ liệu đơn hàng trong khoảng thời gian này" />
              </div>
            ) : (
              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area' ? (
                    <AreaChart data={chartData.points} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatYAxisTick}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Doanh thu (VNĐ)"
                        stroke="#ea580c"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData.points} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatYAxisTick}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar
                        dataKey="revenue"
                        name="Doanh thu (VNĐ)"
                        fill="#f97316"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        {/* Right: Top 5 Best-Selling Foods */}
        <Col xs={24} lg={8}>
          <Card
            className="rounded-2xl border-gray-100 shadow-2xs h-full"
            title={
              <div className="flex items-center gap-2 py-1">
                <TrophyOutlined className="text-amber-500 text-lg" />
                <div>
                  <h3 className="font-bold text-base text-gray-900">Top Món Bán Chạy</h3>
                  <p className="text-xs text-gray-400 font-normal">Mang lại doanh thu cao nhất</p>
                </div>
              </div>
            }
          >
            {loading ? (
              <div className="py-16 text-center">
                <Spin />
              </div>
            ) : topFoods.length === 0 ? (
              <div className="py-12 text-center">
                <Empty description="Chưa có món bán ra trong kỳ này" />
              </div>
            ) : (
              <div className="space-y-4">
                {topFoods.map((item, idx) => {
                  const maxRevenue = topFoods[0]?.totalRevenue || 1;
                  const percent = Math.min(100, Math.round((item.totalRevenue / maxRevenue) * 100));
                  return (
                    <div key={item.foodId} className="space-y-1.5 p-2 rounded-xl hover:bg-orange-50/40 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[11px] shrink-0 ${
                              idx === 0
                                ? 'bg-amber-400 text-white shadow-xs'
                                : idx === 1
                                ? 'bg-gray-300 text-white'
                                : idx === 2
                                ? 'bg-amber-600 text-white'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-bold text-gray-800 line-clamp-1">{item.foodName}</span>
                        </div>
                        <span className="font-extrabold text-orange-600">
                          {formatCurrency(item.totalRevenue)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 pl-7">
                        <span>Đã bán: <strong className="text-gray-700">{item.totalQuantitySold}</strong> suất</span>
                        <Progress percent={percent} showInfo={false} strokeColor="#f97316" size="small" className="w-24 m-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 4. Multi-Branch Comparison Table (Báo cáo đa quán) */}
      <Card
        className="rounded-2xl border-gray-100 shadow-2xs"
        title={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1">
            <div className="flex items-center gap-2">
              <ShopOutlined className="text-orange-500 text-lg" />
              <div>
                <h3 className="font-bold text-base text-gray-900">Báo Cáo Doanh Thu Từng Chi Nhánh</h3>
                <p className="text-xs text-gray-400 font-normal">
                  So sánh hiệu quả kinh doanh giữa các cơ sở của chuỗi quán
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Tổng số chi nhánh: <strong className="text-gray-800">{branchesData.length} quán</strong>
            </div>
          </div>
        }
      >
        <Table
          dataSource={branchesData}
          rowKey="restaurantId"
          pagination={false}
          loading={loading}
          className="overflow-x-auto"
          columns={[
            {
              title: 'Cơ sở / Chi nhánh',
              dataIndex: 'restaurantName',
              key: 'restaurantName',
              render: (name: string, record) => {
                const isSelected = selectedBranchId === String(record.restaurantId);
                return (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
                      <ShopOutlined />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 flex items-center gap-2">
                        {name}
                        {isSelected && <Badge status="processing" text={<span className="text-[10px] text-orange-600 font-bold">Đang xem</span>} />}
                      </div>
                      <span className="text-xs text-gray-400">ID: #{record.restaurantId}</span>
                    </div>
                  </div>
                );
              },
            },
            {
              title: 'Đơn Hoàn Thành',
              dataIndex: 'completedOrders',
              key: 'completedOrders',
              render: (count: number) => (
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md text-xs">
                  {count} đơn
                </span>
              ),
            },
            {
              title: 'Đơn Bị Hủy',
              dataIndex: 'cancelledOrders',
              key: 'cancelledOrders',
              render: (count: number) => (
                <span className="font-medium text-rose-600 text-xs">
                  {count} đơn
                </span>
              ),
            },
            {
              title: 'Doanh Thu',
              dataIndex: 'totalRevenue',
              key: 'totalRevenue',
              render: (amount: number) => (
                <span className="font-extrabold text-orange-600 text-sm">
                  {formatCurrency(amount)}
                </span>
              ),
            },
            {
              title: 'Tỉ Trọng Doanh Thu',
              dataIndex: 'contributionPercentage',
              key: 'contributionPercentage',
              render: (percent: number) => (
                <div className="w-36 space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>{percent}%</span>
                  </div>
                  <Progress percent={percent} strokeColor="#f97316" size="small" showInfo={false} />
                </div>
              ),
            },
            {
              title: 'Thao Tác',
              key: 'action',
              render: (_, record) => (
                <Button
                  size="small"
                  type="link"
                  onClick={() => handleSelectBranch(String(record.restaurantId))}
                  className="font-semibold text-orange-600 hover:text-orange-700 p-0"
                >
                  Xem chi tiết &rarr;
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default MerchantRevenuePage;
