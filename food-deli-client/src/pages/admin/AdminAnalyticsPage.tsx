import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Select,
  Skeleton,
  Spin,
  Statistic,
  Tag,
  Tooltip as AntTooltip,
} from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined,
  LineChartOutlined,
  ReloadOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  adminAnalyticsApi,
  type AdminAnalyticsSummary,
} from '@/services/modules/adminAnalyticsApi';
import { formatCurrency } from '@/utils/formatters';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { month: string; revenue: number; completedOrdersCount?: number } }>;
  label?: string;
}

const CustomChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const point = payload[0].payload;
  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-orange-100 text-xs space-y-1.5 min-w-[190px]">
      <div className="font-bold text-gray-800 border-b border-gray-100 pb-1 flex items-center justify-between">
        <span>Tháng {point.month}</span>
        <span className="text-[10px] text-gray-400 font-normal">{label}</span>
      </div>
      <div className="flex items-center justify-between text-orange-600 font-semibold pt-0.5 gap-4">
        <span>Doanh thu:</span>
        <span className="text-sm font-bold">{formatCurrency(point.revenue ?? 0)}</span>
      </div>
      {typeof point.completedOrdersCount === 'number' && (
        <div className="flex items-center justify-between text-emerald-600 gap-4">
          <span>Đơn hoàn tất:</span>
          <span className="font-bold">{point.completedOrdersCount.toLocaleString('vi-VN')} đơn</span>
        </div>
      )}
    </div>
  );
};

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_ERROR_MESSAGE = 'Không thể tải dữ liệu thống kê hệ thống. Vui lòng thử lại.';
const INVALID_RESPONSE_MESSAGE = 'Máy chủ không trả về dữ liệu thống kê hợp lệ.';

const extractAnalyticsErrorMessage = (err: unknown): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const apiMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (apiMsg) {
      return apiMsg;
    }
  }
  return DEFAULT_ERROR_MESSAGE;
};

export const AdminAnalyticsPage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdminAnalyticsSummary | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const latestRequestIdRef = useRef<number>(0);

  const yearOptions = useMemo(() => {
    const years: Array<{ label: string; value: number }> = [];
    for (let y = CURRENT_YEAR; y >= Math.max(2024, CURRENT_YEAR - 3); y -= 1) {
      years.push({ label: `Năm ${y}`, value: y });
    }
    return years;
  }, []);

  const loadAnalytics = useCallback((yearToLoad: number) => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    return adminAnalyticsApi
      .getSummary(yearToLoad)
      .then((response) => {
        if (latestRequestIdRef.current !== requestId) return;
        if (response?.data) {
          setSummary(response.data);
          setLastUpdated(new Date());
          setErrorMessage(null);
        } else {
          setErrorMessage(INVALID_RESPONSE_MESSAGE);
        }
      })
      .catch((err: unknown) => {
        if (latestRequestIdRef.current !== requestId) return;
        setErrorMessage(extractAnalyticsErrorMessage(err));
      })
      .finally(() => {
        if (latestRequestIdRef.current === requestId) {
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    void loadAnalytics(selectedYear);

    return () => {
      latestRequestIdRef.current += 1;
    };
  }, [selectedYear, loadAnalytics]);

  const handleYearChange = (val: number) => {
    setLoading(true);
    setErrorMessage(null);
    setSelectedYear(val);
  };

  const handleRefresh = () => {
    setLoading(true);
    setErrorMessage(null);
    void loadAnalytics(selectedYear);
  };

  const formatYAxisTick = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return String(val);
  };

  const hasMatchingYearData = summary != null && (summary.year == null || summary.year === selectedYear);

  const chartData = useMemo(() => {
    if (!hasMatchingYearData || !summary) {
      return [];
    }
    return (summary.monthlyRevenue ?? []).map((item, idx) => ({
      ...item,
      shortLabel: item.label || `T${idx + 1}`,
    }));
  }, [summary, hasMatchingYearData]);

  const totalYearlyRevenue = useMemo(() => {
    if (!hasMatchingYearData || !summary) {
      return 0;
    }
    if (typeof summary.yearlyRevenue === 'number') {
      return summary.yearlyRevenue;
    }
    return chartData.reduce((acc, item) => acc + (Number(item.revenue) || 0), 0);
  }, [summary, chartData, hasMatchingYearData]);

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight m-0">
              Tổng Thu Toàn Sàn & Chỉ Số Hệ Thống
            </h1>
            <Tag color="red" className="rounded-full px-2.5 font-bold uppercase text-[10px] m-0">
              Admin Portal
            </Tag>
          </div>
          <p className="text-xs text-gray-500 mt-1.5 mb-0 flex items-center gap-2 flex-wrap">
            <CalendarOutlined className="text-orange-500" />
            <span>Dữ liệu realtime toàn hệ thống Food Thunder Deli</span>
            {lastUpdated && (
              <span className="text-gray-400">
                • Cập nhật lúc {lastUpdated.toLocaleTimeString('vi-VN')}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            value={selectedYear}
            onChange={handleYearChange}
            options={yearOptions}
            className="w-32"
            aria-label="Chọn năm thống kê"
          />

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <AntTooltip title="Biểu đồ cột">
              <Button
                size="small"
                type={chartType === 'bar' ? 'primary' : 'text'}
                icon={<BarChartOutlined />}
                onClick={() => setChartType('bar')}
                className={chartType === 'bar' ? 'bg-orange-500 border-orange-500' : ''}
              >
                Cột
              </Button>
            </AntTooltip>
            <AntTooltip title="Biểu đồ đường">
              <Button
                size="small"
                type={chartType === 'line' ? 'primary' : 'text'}
                icon={<LineChartOutlined />}
                onClick={() => setChartType('line')}
                className={chartType === 'line' ? 'bg-orange-500 border-orange-500' : ''}
              >
                Đường
              </Button>
            </AntTooltip>
          </div>

          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={handleRefresh}
            className="rounded-xl border-gray-200 hover:border-orange-500 hover:text-orange-600 font-semibold"
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* Partial Data or Error Alert */}
      {errorMessage && (
        <Alert
          type="error"
          showIcon
          message="Lỗi tải dữ liệu thống kê"
          description={errorMessage}
          action={
            <Button size="small" danger onClick={handleRefresh}>
              Thử lại
            </Button>
          }
          className="rounded-xl"
        />
      )}

      {!errorMessage && summary?.partialData && summary.warnings && summary.warnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message="Một số microservice phụ đang phản hồi chậm"
          description={summary.warnings.join(' | ')}
          className="rounded-xl"
        />
      )}

      {/* 2. 5 Core System KPI Statistic Cards */}
      {loading && !summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <Card key={item} className="rounded-2xl border-gray-100">
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Số lượng người dùng */}
          <Card className="rounded-2xl border-blue-200/80 bg-linear-to-br from-blue-50 to-indigo-100/60 shadow-xs hover:shadow-md transition-all">
            <Statistic
              title={
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Số lượng người dùng
                </span>
              }
              value={summary?.totalUsersCount ?? 0}
              suffix={<span className="text-xs font-semibold text-blue-700">tài khoản</span>}
              valueStyle={{ color: '#1d4ed8', fontWeight: 800, fontSize: '1.5rem' }}
              prefix={<UserOutlined className="text-blue-500 mr-1.5 text-xl" />}
            />
            <div className="mt-2.5 pt-2 border-t border-blue-200/60 text-[11px] text-blue-800">
              Tài khoản đang hoạt động
            </div>
          </Card>

          {/* Card 2: Số lượng nhà hàng */}
          <Card className="rounded-2xl border-orange-200/80 bg-linear-to-br from-orange-50 to-amber-100/60 shadow-xs hover:shadow-md transition-all">
            <Statistic
              title={
                <span className="text-xs font-bold text-orange-900 uppercase tracking-wider">
                  Số lượng nhà hàng
                </span>
              }
              value={summary?.totalRestaurantsCount ?? 0}
              suffix={<span className="text-xs font-semibold text-orange-700">quán</span>}
              valueStyle={{ color: '#c2410c', fontWeight: 800, fontSize: '1.5rem' }}
              prefix={<ShopOutlined className="text-orange-500 mr-1.5 text-xl" />}
            />
            <div className="mt-2.5 pt-2 border-t border-orange-200/60 text-[11px] text-orange-800">
              Đã duyệt & đang mở bán
            </div>
          </Card>

          {/* Card 3: Số lượng đối tác kinh doanh (Merchants) */}
          <Card className="rounded-2xl border-purple-200/80 bg-linear-to-br from-purple-50 to-fuchsia-100/60 shadow-xs hover:shadow-md transition-all">
            <Statistic
              title={
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                  Đối tác (Merchants)
                </span>
              }
              value={summary?.totalMerchantsCount ?? 0}
              suffix={<span className="text-xs font-semibold text-purple-700">đối tác</span>}
              valueStyle={{ color: '#7e22ce', fontWeight: 800, fontSize: '1.5rem' }}
              prefix={<TeamOutlined className="text-purple-500 mr-1.5 text-xl" />}
            />
            <div className="mt-2.5 pt-2 border-t border-purple-200/60 text-[11px] text-purple-800">
              Chủ gian hàng trên hệ thống
            </div>
          </Card>

          {/* Card 4: Tỷ lệ đơn thành công / Tổng đơn đặt hàng */}
          <Card className="rounded-2xl border-emerald-200/80 bg-linear-to-br from-emerald-50 to-teal-100/60 shadow-xs hover:shadow-md transition-all">
            <Statistic
              title={
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Tỷ lệ đơn thành công
                </span>
              }
              value={summary?.orderSuccessRate ?? 0}
              precision={2}
              suffix="%"
              valueStyle={{ color: '#047857', fontWeight: 800, fontSize: '1.5rem' }}
              prefix={<CheckCircleOutlined className="text-emerald-500 mr-1.5 text-xl" />}
            />
            <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-800">
              <span>Thành công / Tổng đơn:</span>
              <span className="font-bold text-emerald-900">
                {(summary?.completedOrdersCount ?? 0).toLocaleString('vi-VN')} /{' '}
                {(summary?.totalOrdersCount ?? 0).toLocaleString('vi-VN')}
              </span>
            </div>
          </Card>

          {/* Card 5: Số lượng món ăn toàn sàn */}
          <Card className="rounded-2xl border-amber-200/80 bg-linear-to-br from-amber-50 to-yellow-100/60 shadow-xs hover:shadow-md transition-all">
            <Statistic
              title={
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Số lượng món ăn
                </span>
              }
              value={summary?.totalFoodItemsCount ?? 0}
              suffix={<span className="text-xs font-semibold text-amber-700">món</span>}
              valueStyle={{ color: '#b45309', fontWeight: 800, fontSize: '1.5rem' }}
              prefix={<AppstoreOutlined className="text-amber-500 mr-1.5 text-xl" />}
            />
            <div className="mt-2.5 pt-2 border-t border-amber-200/60 text-[11px] text-amber-800">
              Thực đơn toàn sàn hiện hành
            </div>
          </Card>
        </div>
      )}

      {/* 3. Platform Monthly Revenue Chart (12 Months) */}
      <Card
        className="rounded-2xl border-gray-100 shadow-2xs"
        title={
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-1">
            <div>
              <h2 className="font-bold text-lg text-gray-900 m-0">
                Biểu Đồ Biến Động Doanh Thu Toàn Sàn Năm {selectedYear}
              </h2>
              <p className="text-xs text-gray-400 font-normal mt-0.5 mb-0">
                Tổng hợp doanh thu các đơn hàng hoàn tất (COMPLETED) theo 12 tháng trong năm
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-orange-50/80 border border-orange-100 rounded-xl px-4 py-2">
              <div className="flex items-center gap-2">
                <DollarCircleOutlined className="text-orange-500 text-xl" />
                <div>
                  <div className="text-[11px] text-gray-500 font-medium">
                    Tổng doanh thu toàn sàn (All-time)
                  </div>
                  <div className="text-base font-extrabold text-orange-600">
                    {formatCurrency(summary?.totalRevenue ?? 0)}
                  </div>
                </div>
              </div>
              <div className="h-8 w-px bg-orange-200 hidden sm:block" />
              <div>
                <div className="text-[11px] text-gray-500 font-medium">
                  Doanh thu năm {selectedYear}
                </div>
                <div className="text-base font-bold text-gray-800">
                  {hasMatchingYearData ? formatCurrency(totalYearlyRevenue) : '—'}
                </div>
              </div>
            </div>
          </div>
        }
      >
        {loading && !hasMatchingYearData ? (
          <div className="h-80 flex flex-col items-center justify-center gap-3">
            <Spin size="large" />
            <span className="text-gray-400 text-xs">Đang tổng hợp biểu đồ doanh thu 12 tháng...</span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <Empty description={`Chưa có dữ liệu doanh thu trong năm ${selectedYear}`} />
          </div>
        ) : (
          <Spin spinning={loading} tip="Đang cập nhật số liệu...">
            <div className="space-y-2">
              {totalYearlyRevenue === 0 && (
                <Alert
                  type="info"
                  showIcon
                  message={`Năm ${selectedYear} chưa ghi nhận đơn hàng COMPLETED nào (hiển thị giá trị 0 ₫ cho 12 tháng).`}
                  className="rounded-xl mb-3"
                />
              )}
              <div className="h-88 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="shortLabel" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatYAxisTick}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar
                        dataKey="revenue"
                        name="Doanh thu tháng (VNĐ)"
                        fill="#f97316"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={44}
                      />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="shortLabel" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatYAxisTick}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Doanh thu tháng (VNĐ)"
                        stroke="#ea580c"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: '#ea580c' }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </Spin>
        )}
      </Card>
    </div>
  );
};

export default AdminAnalyticsPage;
