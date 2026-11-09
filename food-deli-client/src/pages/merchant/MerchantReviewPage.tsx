import React, { useState, useEffect } from 'react';
import {
  Card,
  Rate,
  Input,
  Select,
  Empty,
  Spin,
  Tag,
  Avatar,
  Row,
  Col,
  Statistic,
  Progress,
  Pagination,
} from 'antd';
import {
  SearchOutlined,
  StarFilled,
  UserOutlined,
  AppstoreOutlined,
  MessageOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { reviewApi, type ReviewItemDto, type ReviewSummaryDto } from '@/services/api/reviewApi';
import { restaurantApi } from '@/services/modules/restaurantApi';

export const MerchantReviewPage: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItemDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<ReviewSummaryDto | null>(null);

  // Filter states
  const [restaurantId, setRestaurantId] = useState<number>(1);
  const [foodItems, setFoodItems] = useState<{ id: number; name: string }[]>([]);
  const [selectedFoodItemId, setSelectedFoodItemId] = useState<number | undefined>(undefined);
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination states
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalElements, setTotalElements] = useState<number>(0);

  // 1. Fetch initial merchant restaurant info and food items
  useEffect(() => {
    const initData = async () => {
      try {
        const res = await restaurantApi.getMyRestaurants();
        const restaurants: any[] = Array.isArray(res?.data)
          ? res.data
          : (res?.data as any)?.content || [];

        if (restaurants.length > 0) {
          const currentRestId = Number(restaurants[0].id);
          setRestaurantId(currentRestId);

          // Fetch food items for filtering
          const foodRes = await restaurantApi.getProductsByRestaurant(currentRestId);
          const rawFoods: any[] = Array.isArray(foodRes?.data)
            ? foodRes.data
            : (foodRes?.data as any)?.content || [];

          setFoodItems(
            rawFoods.map((f: any) => ({
              id: Number(f.id),
              name: f.name || f.title || `Món #${f.id}`,
            }))
          );
        }
      } catch (err) {
        // Fallback default restaurant ID 1
        setRestaurantId(1);
      }
    };

    initData();
  }, []);

  // 2. Fetch reviews and summary based on filters
  useEffect(() => {
    if (!restaurantId) return;

    const fetchReviewsAndSummary = async () => {
      setLoading(true);
      try {
        const [revRes, sumRes] = await Promise.allSettled([
          reviewApi.getMerchantReviews({
            restaurantId,
            foodItemId: selectedFoodItemId,
            rating: selectedRating,
            keyword: searchTerm.trim() || undefined,
            page: page - 1,
            size: pageSize,
          }),
          reviewApi.getRestaurantSummary(restaurantId),
        ]);

        if (revRes.status === 'fulfilled' && revRes.value?.data) {
          setReviews(revRes.value.data.content || []);
          setTotalElements(revRes.value.data.totalElements || 0);
        }

        if (sumRes.status === 'fulfilled' && sumRes.value?.data) {
          setSummary(sumRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load merchant reviews', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewsAndSummary();
  }, [restaurantId, selectedFoodItemId, selectedRating, searchTerm, page]);

  return (
    <div className="space-y-6">
      {/* 1. Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <MessageOutlined className="text-orange-500" />
            <span>Quản Lý Đánh Giá & Nhận Xét</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi phản hồi chân thực từ khách hàng để không ngừng nâng cao chất lượng món ăn và dịch vụ.
          </p>
        </div>

        <Tag color="orange" className="self-start sm:self-auto px-3 py-1 rounded-xl text-xs font-bold">
          Chế độ xem: Chỉ đọc (Read-only)
        </Tag>
      </div>

      {/* 2. Rating Overview Dashboard Card */}
      {summary && (
        <Card className="rounded-3xl border-gray-100 shadow-xs overflow-hidden">
          <Row gutter={[24, 24]} align="middle">
            {/* Điểm trung bình */}
            <Col xs={24} md={8} className="text-center sm:border-r border-gray-100">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Điểm Đánh Giá Trung Bình
              </div>
              <div className="text-5xl font-black text-orange-600 flex items-center justify-center gap-2">
                <span>{summary.averageRating.toFixed(1)}</span>
                <span className="text-2xl text-gray-400 font-normal">/ 5.0</span>
              </div>
              <Rate
                disabled
                allowHalf
                value={summary.averageRating}
                className="text-amber-500 text-lg my-2"
              />
              <div className="text-xs text-gray-500 font-semibold">
                Tổng cộng {summary.totalReviews} lượt đánh giá từ khách hàng
              </div>
            </Col>

            {/* Phân bố sao */}
            <Col xs={24} md={16}>
              <div className="space-y-2 max-w-lg mx-auto">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.ratingBreakdown[star] || 0;
                  const percent =
                    summary.totalReviews > 0 ? Math.round((count / summary.totalReviews) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs">
                      <span className="w-12 font-bold text-gray-600 flex items-center gap-1">
                        {star} <StarFilled className="text-amber-400" />
                      </span>
                      <Progress
                        percent={percent}
                        strokeColor="#f97316"
                        trailColor="#f3f4f6"
                        showInfo={false}
                        className="flex-1 !m-0"
                      />
                      <span className="w-16 text-right text-gray-400 font-medium">
                        {count} ({percent}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 3. Filter Bar */}
      <Card className="rounded-2xl border-gray-100 shadow-2xs p-2">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Lọc theo món ăn */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Lọc theo món ăn:
            </label>
            <Select
              allowClear
              placeholder="Tất cả món ăn trong thực đơn"
              value={selectedFoodItemId}
              onChange={(val) => {
                setSelectedFoodItemId(val);
                setPage(1);
              }}
              className="w-full"
              options={[
                { value: undefined, label: 'Tất cả món ăn' },
                ...foodItems.map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ]}
            />
          </div>

          {/* Lọc theo số sao */}
          <div className="w-full md:w-44">
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Số sao đánh giá:
            </label>
            <Select
              allowClear
              placeholder="Tất cả sao"
              value={selectedRating}
              onChange={(val) => {
                setSelectedRating(val);
                setPage(1);
              }}
              className="w-full"
              options={[
                { value: undefined, label: 'Tất cả sao' },
                { value: 5, label: '⭐⭐⭐⭐⭐ 5 Sao' },
                { value: 4, label: '⭐⭐⭐⭐ 4 Sao' },
                { value: 3, label: '⭐⭐⭐ 3 Sao' },
                { value: 2, label: '⭐⭐ 2 Sao' },
                { value: 1, label: '⭐ 1 Sao' },
              ]}
            />
          </div>

          {/* Tìm kiếm nội dung */}
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Tìm kiếm nhận xét:
            </label>
            <Input
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Tìm theo từ khóa nhận xét..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              allowClear
              className="rounded-xl"
            />
          </div>
        </div>
      </Card>

      {/* 4. Reviews List */}
      {loading ? (
        <div className="py-20 text-center">
          <Spin size="large" />
          <div className="text-xs text-gray-400 mt-2">Đang tải danh sách đánh giá...</div>
        </div>
      ) : reviews.length === 0 ? (
        <Card className="rounded-3xl border-gray-100 text-center py-12">
          <Empty description="Chưa có đánh giá nào phù hợp với bộ lọc tìm kiếm" />
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <Card
              key={rev.id}
              className="rounded-2xl border-gray-100 hover:border-orange-200 transition-all shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                {/* User info & Stars */}
                <div className="flex items-start gap-3">
                  <Avatar
                    size={44}
                    src={rev.customerAvatar}
                    icon={<UserOutlined />}
                    className="bg-orange-100 text-orange-600 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-gray-900 text-sm">
                        {rev.customerName || `Khách hàng #${rev.customerId}`}
                      </span>
                      <Tag color="cyan" className="rounded-md text-[10px] font-bold">
                        Đã mua hàng
                      </Tag>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <Rate disabled value={rev.rating} className="text-amber-500 text-xs" />
                      <span className="text-xs text-gray-400">
                        {new Date(rev.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gắn thẻ món ăn nếu có */}
                {rev.foodItemId && (
                  <Tag
                    color="orange"
                    className="rounded-xl px-2.5 py-1 text-xs font-semibold self-start sm:self-auto flex items-center gap-1"
                  >
                    <AppstoreOutlined />
                    <span>Món: {rev.foodName || `Món ăn #${rev.foodItemId}`}</span>
                  </Tag>
                )}
              </div>

              {/* Review Content */}
              <div className="mt-3 text-sm text-gray-700 leading-relaxed bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
                {rev.comment || <span className="italic text-gray-400">Khách hàng không để lại nhận xét văn bản.</span>}
              </div>

              {/* Review Images if any */}
              {rev.images && rev.images.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {rev.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Review photo ${idx + 1}`}
                      className="w-16 h-16 object-cover rounded-xl border border-gray-200 shadow-2xs shrink-0 hover:scale-105 transition-transform cursor-pointer"
                    />
                  ))}
                </div>
              )}
            </Card>
          ))}

          {/* Pagination */}
          {totalElements > pageSize && (
            <div className="flex justify-center pt-4">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={totalElements}
                onChange={setPage}
                showTotal={(total) => `Tổng ${total} đánh giá`}
                className="font-medium"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MerchantReviewPage;
