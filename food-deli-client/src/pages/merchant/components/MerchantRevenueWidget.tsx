import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Button, Segmented, Spin, Empty, Tag } from 'antd';
import {
  DollarCircleOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  LineChartOutlined,
  RightOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  revenueApi,
  type MerchantRevenueSummary,
  type RevenueChartData,
} from '@/services/modules/revenueApi';
import { formatCurrency } from '@/utils/formatters';
import { APP_ROUTES } from '@/constants';

interface MerchantRevenueWidgetProps {
  restaurantId: number;
  restaurantName?: string;
}

export const MerchantRevenueWidget: React.FC<MerchantRevenueWidgetProps> = ({
  restaurantId,
  restaurantName,
}) => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<string>('WEEK');
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<MerchantRevenueSummary | null>(null);
  const [chartData, setChartData] = useState<RevenueChartData | null>(null);

  const fetchWidgetData = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const [sumRes, chartRes] = await Promise.all([
        revenueApi.getSummary({ restaurantId, period }),
        revenueApi.getChart({ restaurantId, period }),
      ]);
      if (sumRes?.data) setSummary(sumRes.data);
      if (chartRes?.data) setChartData(chartRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [restaurantId, period]);

  useEffect(() => {
    fetchWidgetData();
  }, [fetchWidgetData]);

  const formatYAxisTick = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return String(val);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-xs p-2.5 rounded-xl shadow-md border border-orange-100 text-xs space-y-1 min-w-[150px]">
          <div className="font-bold text-gray-800 border-b border-gray-100 pb-1">
            {data.label || label}
          </div>
          <div className="flex justify-between text-orange-600 font-semibold">
            <span>Doanh thu:</span>
            <span>{formatCurrency(data.revenue)}</span>
          </div>
          <div className="flex justify-between text-emerald-600">
            <span>Đơn hoàn thành:</span>
            <span className="font-bold">{data.orderCount} đơn</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      className="rounded-2xl border-orange-100 shadow-2xs overflow-hidden"
      bodyStyle={{ padding: '18px 20px' }}
    >
      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            <LineChartOutlined className="text-base" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight">
                Hiệu Quả Doanh Thu
              </h3>
              <Tag color="orange" className="font-semibold text-[10px] rounded-md m-0">
                {period === 'DAY' ? 'Hôm nay' : period === 'WEEK' ? '7 ngày' : 'Tháng này'}
              </Tag>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
              <ShopOutlined /> {restaurantName || `Quán #${restaurantId}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Segmented
            value={period}
            onChange={(val) => setPeriod(val as string)}
            size="small"
            options={[
              { label: 'Hôm nay', value: 'DAY' },
              { label: '7 ngày', value: 'WEEK' },
              { label: 'Tháng này', value: 'MONTH' },
            ]}
            className="bg-gray-100 text-xs font-semibold"
          />
          <Button
            type="primary"
            size="small"
            onClick={() => navigate(APP_ROUTES.MERCHANT_REVENUE)}
            className="bg-orange-500 hover:bg-orange-600 font-bold text-xs rounded-lg flex items-center gap-1"
          >
            Báo cáo đa quán <RightOutlined className="text-[10px]" />
          </Button>
        </div>
      </div>

      {/* Content Area: KPI summary left + Mini Area Chart right */}
      {loading ? (
        <div className="h-44 flex flex-col items-center justify-center gap-2">
          <Spin />
          <span className="text-gray-400 text-xs">Đang đồng bộ số liệu doanh thu...</span>
        </div>
      ) : (
        <Row gutter={[16, 16]} className="pt-3 items-center">
          {/* Quick Metrics */}
          <Col xs={24} md={10} lg={8}>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-orange-50/60 border border-orange-100/80">
                <span className="text-[11px] font-bold text-orange-800 uppercase block truncate">
                  Doanh Thu Thu Về
                </span>
                <span className="text-base font-extrabold text-orange-600 block mt-0.5">
                  {summary ? formatCurrency(summary.totalRevenue) : '0 ₫'}
                </span>
                <span className="text-[10px] text-orange-500/80 mt-0.5 block flex items-center gap-1">
                  <DollarCircleOutlined /> Đơn hoàn thành
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100/80">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block truncate">
                  Đơn Hoàn Thành
                </span>
                <span className="text-base font-extrabold text-emerald-600 block mt-0.5">
                  {summary?.successfulOrders ?? 0} đơn
                </span>
                <span className="text-[10px] text-emerald-600/80 mt-0.5 block flex items-center gap-1">
                  <CheckCircleOutlined /> / {summary?.totalOrders ?? 0} đơn
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100/80">
                <span className="text-[11px] font-bold text-blue-800 uppercase block truncate">
                  Giá Trị TB / Đơn
                </span>
                <span className="text-sm font-extrabold text-blue-600 block mt-0.5">
                  {summary ? formatCurrency(summary.averageOrderValue) : '0 ₫'}
                </span>
                <span className="text-[10px] text-blue-500/80 mt-0.5 block flex items-center gap-1">
                  <ShoppingOutlined /> AOV
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100/80">
                <span className="text-[11px] font-bold text-purple-800 uppercase block truncate">
                  Tỉ Lệ Hoàn Tất
                </span>
                <span className="text-base font-extrabold text-purple-600 block mt-0.5">
                  {summary?.completionRate ?? 0}%
                </span>
                <span className="text-[10px] text-purple-500/80 mt-0.5 block">
                  Hủy: {summary?.cancelledOrders ?? 0} đơn
                </span>
              </div>
            </div>
          </Col>

          {/* Mini Area Chart */}
          <Col xs={24} md={14} lg={16}>
            <div className="h-44 w-full pt-1">
              {!chartData?.points || chartData.points.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.points} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="widgetColorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatYAxisTick}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Doanh thu"
                      stroke="#ea580c"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#widgetColorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Col>
        </Row>
      )}
    </Card>
  );
};

export default MerchantRevenueWidget;

