import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  Button,
  Table,
  Tag,
  Typography,
  Space,
  Spin,
  Empty,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BarChartOutlined,
  ReloadOutlined,
  DollarCircleOutlined,
  UserOutlined,
  ShopOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  adminAnalyticsApi,
  type AdminAnalyticsSummary,
  type TopRestaurantRevenue,
} from '@/services/modules/adminAnalyticsApi';

const { Title, Text } = Typography;

const CURRENT_YEAR = new Date().getFullYear();

const formatVnd = (amount: number): string =>
  `${Math.round(amount || 0).toLocaleString('vi-VN')}đ`;

export const AdminAnalyticsPage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<AdminAnalyticsSummary | null>(null);

  const yearOptions = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((y) => ({
    value: y,
    label: `Năm ${y}`,
  }));

  const loadAnalyticsData = useCallback(async (year: number): Promise<AdminAnalyticsSummary | null> => {
    const res = await adminAnalyticsApi.getSummary(year);
    return res?.data ?? null;
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadAnalyticsData(selectedYear);
      if (data) setSummary(data);
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể tải dữ liệu phân tích hệ thống');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, loadAnalyticsData]);

  useEffect(() => {
    let active = true;
    loadAnalyticsData(selectedYear)
      .then((data) => {
        if (active && data) setSummary(data);
      })
      .catch((err: any) => {
        if (active) {
          message.error(err?.response?.data?.message || 'Không thể tải dữ liệu phân tích hệ thống');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedYear, loadAnalyticsData]);

  const topColumns: ColumnsType<TopRestaurantRevenue> = [
    {
      title: 'Hạng',
      key: 'rank',
      width: 80,
      align: 'center',
      render: (_val, _record, index) => {
        const colors = ['gold', 'default', 'orange'];
        return <Tag color={colors[index] || 'blue'}>#{index + 1}</Tag>;
      },
    },
    {
      title: 'Tên quán ăn',
      dataIndex: 'restaurantName',
      key: 'restaurantName',
      render: (name: string, record) => (
        <div>
          <div className="font-semibold text-slate-900">{name}</div>
          <Text className="text-xs text-slate-400">ID: #{record.restaurantId}</Text>
        </div>
      ),
    },
    {
      title: 'Đơn hoàn tất',
      dataIndex: 'completedOrders',
      key: 'completedOrders',
      align: 'right',
      render: (count: number) => (
        <span className="font-semibold text-slate-700">
          {Number(count || 0).toLocaleString('vi-VN')} đơn
        </span>
      ),
    },
    {
      title: 'Tổng doanh thu (GMV)',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      render: (rev: number) => (
        <span className="font-bold text-orange-600">{formatVnd(Number(rev || 0))}</span>
      ),
    },
  ];

  const monthlyData = summary?.monthlyRevenue || [];
  const topRestaurants = summary?.topRestaurants || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm">
            <BarChartOutlined className="text-xl" />
          </div>
          <div>
            <Title level={3} className="!mb-0 text-slate-900">
              Phân tích &amp; Thống kê Toàn sàn
            </Title>
            <Text className="text-slate-500 text-sm">
              Theo dõi GMV 12 tháng, tỷ lệ hoàn tất đơn hàng và hiệu suất đối tác nhà hàng
            </Text>
          </div>
        </div>

        <Space>
          <Select
            value={selectedYear}
            onChange={(val) => {
              setLoading(true);
              setSelectedYear(val);
            }}
            options={yearOptions}
            className="w-32"
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Làm mới
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        {/* 5 KPI Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-2xl shadow-xs border-slate-100 h-full">
              <Statistic
                title="Tổng GMV hoàn tất"
                value={Number(summary?.totalGmv || 0)}
                precision={0}
                suffix="đ"
                prefix={<DollarCircleOutlined className="text-orange-500" />}
                valueStyle={{ color: '#ea580c', fontWeight: 800, fontSize: '22px' }}
              />
              <Text className="text-xs text-slate-400">
                Trong năm {summary?.year || selectedYear}
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-2xl shadow-xs border-slate-100 h-full">
              <Statistic
                title="Tỷ lệ hoàn tất đơn"
                value={summary?.completionRate ?? 0}
                precision={2}
                suffix="%"
                prefix={<CheckCircleOutlined className="text-emerald-500" />}
                valueStyle={{ color: '#059669', fontWeight: 800, fontSize: '22px' }}
              />
              <Text className="text-xs text-slate-400">
                {summary?.completedOrders ?? 0} / {summary?.totalOrders ?? 0} đơn ({summary?.cancelledOrders ?? 0} hủy)
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={4}>
            <Card className="rounded-2xl shadow-xs border-slate-100 h-full">
              <Statistic
                title="Người dùng"
                value={summary?.totalUsers ?? 0}
                prefix={<UserOutlined className="text-blue-500" />}
                valueStyle={{ fontWeight: 700, fontSize: '22px' }}
              />
              <Text className="text-xs text-slate-400">
                {summary?.totalMerchants ?? 0} đối tác chủ quán
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={4}>
            <Card className="rounded-2xl shadow-xs border-slate-100 h-full">
              <Statistic
                title="Quán ăn hoạt động"
                value={summary?.totalRestaurants ?? 0}
                prefix={<ShopOutlined className="text-purple-500" />}
                valueStyle={{ fontWeight: 700, fontSize: '22px' }}
              />
              <Text className="text-xs text-slate-400">Đang mở trên sàn</Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={4}>
            <Card className="rounded-2xl shadow-xs border-slate-100 h-full">
              <Statistic
                title="Tổng số món ăn"
                value={summary?.totalFoodItems ?? 0}
                prefix={<ShoppingOutlined className="text-amber-500" />}
                valueStyle={{ fontWeight: 700, fontSize: '22px' }}
              />
              <Text className="text-xs text-slate-400">Mặt hàng thực đơn</Text>
            </Card>
          </Col>
        </Row>

        {/* Chart + Top Restaurants */}
        <Row gutter={[20, 20]} className="mt-5">
          <Col xs={24} lg={14}>
            <Card
              title={
                <span className="font-bold text-slate-800">
                  Biểu đồ Doanh thu (GMV) &amp; Đơn hàng 12 tháng — {selectedYear}
                </span>
              }
              className="rounded-2xl shadow-xs border-slate-100 h-full"
            >
              {monthlyData.length > 0 ? (
                <div style={{ width: '100%', height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 16, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(val: number) =>
                          val >= 1_000_000
                            ? `${(val / 1_000_000).toFixed(1)}M`
                            : val >= 1_000
                              ? `${Math.round(val / 1_000)}k`
                              : `${val}`
                        }
                      />
                      <Tooltip
                        formatter={(value: unknown, name: unknown) => {
                          const num = Number(value ?? 0);
                          if (name === 'revenue') {
                            return [formatVnd(num), 'Doanh thu (GMV)'];
                          }
                          return [`${num} đơn`, 'Đơn hoàn tất'];
                        }}
                      />
                      <Legend
                        formatter={(value: string) =>
                          value === 'revenue' ? 'Doanh thu (VNĐ)' : 'Số đơn hoàn tất'
                        }
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#ea580c"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={36}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Empty description="Chưa có dữ liệu doanh thu trong năm này" />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card
              title={
                <Space>
                  <TrophyOutlined className="text-amber-500" />
                  <span className="font-bold text-slate-800">Top Quán ăn Doanh thu cao nhất</span>
                </Space>
              }
              className="rounded-2xl shadow-xs border-slate-100 h-full"
            >
              <Table
                columns={topColumns}
                dataSource={topRestaurants}
                rowKey="restaurantId"
                pagination={false}
                size="middle"
                locale={{
                  emptyText: <Empty description="Chưa có đơn hàng hoàn tất trong năm này" />,
                }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default AdminAnalyticsPage;

