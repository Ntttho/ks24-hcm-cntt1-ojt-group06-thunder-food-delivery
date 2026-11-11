import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Empty,
  Image,
  Input,
  Modal,
  Pagination,
  Rate,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CarOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ShopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { restaurantApi } from '@/services/modules/restaurantApi';
import { userApi } from '@/services/modules/userApi';
import { reviewApi } from '@/services/api/reviewApi';
import type { ReviewItemDto, ReviewOrderItemDto } from '@/services/api/reviewApi';
import type { Shop } from '@/services/modules/restaurantApi';
import type { User } from '@/types/auth.types';

const { Text, Title } = Typography;

type ReviewTargetType = 'RESTAURANT' | 'DRIVER';

interface AdminReviewManagementPageProps {
  targetType: ReviewTargetType;
}

interface ReviewWithDetails extends ReviewItemDto {
  customerName: string;
  customerAvatar?: string;
  targetName: string;
  targetImage?: string;
  foodName?: string;
  licensePlate?: string;
  orderItems: Array<ReviewOrderItemDto & { imageUrl?: string; displayName: string }>;
}

const PAGE_SIZE_OPTIONS = ['10', '20', '50'];

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Đã xảy ra lỗi, vui lòng thử lại.';

const getProduct = (restaurant: Shop | undefined, productId: number | undefined) => {
  if (!restaurant || productId == null) return undefined;
  for (const category of restaurant.categories ?? []) {
    const product = category.products.find((item) => item.id === productId);
    if (product) return product;
  }
  return undefined;
};

const loadReviewDetails = async (
  reviews: ReviewItemDto[],
  targetType: ReviewTargetType,
): Promise<{ reviews: ReviewWithDetails[]; incomplete: boolean }> => {
  const typedReviews = reviews.filter((review) => review.targetType === targetType);
  const userIds = new Set<number>();
  const restaurantIds = new Set<number>();
  typedReviews.forEach((review) => {
    userIds.add(review.customerId);
    if (targetType === 'DRIVER') userIds.add(review.targetId);
    if (targetType === 'RESTAURANT') restaurantIds.add(review.targetId);
    if (review.orderRestaurantId != null) restaurantIds.add(review.orderRestaurantId);
  });

  const [userResults, restaurantResults] = await Promise.all([
    Promise.all(
      [...userIds].map(async (id) => {
        try {
          return [id, (await userApi.getUserById(id)).data] as const;
        } catch {
          return [id, undefined] as const;
        }
      }),
    ),
    Promise.all(
      [...restaurantIds].map(async (id) => {
        try {
          return [id, (await restaurantApi.getById(id)).data] as const;
        } catch {
          return [id, undefined] as const;
        }
      }),
    ),
  ]);

  const users = new Map<number, User | undefined>(userResults);
  const restaurants = new Map<number, Shop | undefined>(restaurantResults);
  const incomplete =
    typedReviews.some((review) => !review.orderContextAvailable) ||
    userResults.some(([, user]) => !user) ||
    restaurantResults.some(([, shop]) => !shop);

  return {
    incomplete,
    reviews: typedReviews.map((review) => {
      const customer = users.get(review.customerId);
      const targetUser = targetType === 'DRIVER' ? users.get(review.targetId) : undefined;
      const restaurant = targetType === 'RESTAURANT' ? restaurants.get(review.targetId) : undefined;
      const orderRestaurant = review.orderRestaurantId == null
        ? restaurant
        : restaurants.get(review.orderRestaurantId);

      return {
        ...review,
        customerName: customer?.fullName || `Khách hàng #${review.customerId}`,
        customerAvatar: customer?.avatarUrl,
        targetName:
          (targetUser?.fullName || restaurant?.name) ||
          `${targetType === 'DRIVER' ? 'Tài xế' : 'Nhà hàng'} #${review.targetId}`,
        targetImage: restaurant?.imageUrl,
        foodName: getProduct(restaurant, review.foodItemId)?.name,
        licensePlate: targetUser?.licensePlate,
        orderItems: (review.orderItems ?? []).map((item) => {
          const product = getProduct(orderRestaurant, item.foodId);
          return {
            ...item,
            displayName: item.foodName || product?.name || `Món #${item.foodId}`,
            imageUrl: product?.imageUrl,
          };
        }),
      };
    }),
  };
};

const AdminReviewManagementPage: React.FC<AdminReviewManagementPageProps> = ({ targetType }) => {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [metadataIncomplete, setMetadataIncomplete] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [rating, setRating] = useState<number>();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setLoadError(undefined);
      try {
        const response = await reviewApi.getAdminReviews({
          targetType,
          keyword: keyword.trim() || undefined,
          rating,
          page,
          size: pageSize,
        });
        const content = (response.data?.content ?? []).filter(
          (review) => review.targetType === targetType,
        );
        const details = await loadReviewDetails(content, targetType);
        if (!active) return;
        setReviews(details.reviews);
        setMetadataIncomplete(details.incomplete);
        setTotalElements(response.data?.totalElements ?? 0);
      } catch (error) {
        if (!active) return;
        setLoadError(getErrorMessage(error));
        setReviews([]);
        setTotalElements(0);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [keyword, page, pageSize, rating, refreshKey, targetType]);

  const handleDelete = (review: ReviewWithDetails) => {
    Modal.confirm({
      title: 'Xác nhận xóa đánh giá',
      icon: <DeleteOutlined className="text-red-500" />,
      content: `Bạn có chắc chắn muốn xóa đánh giá #${review.id}? Thao tác này không thể hoàn tác.`,
      okText: 'Xóa đánh giá',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await reviewApi.deleteAdminReview(review.id);
          message.success('Đã xóa đánh giá và cập nhật điểm trung bình.');
          if (reviews.length === 1 && page > 0) setPage((current) => current - 1);
          else setRefreshKey((current) => current + 1);
        } catch (error) {
          message.error(`Không thể xóa đánh giá: ${getErrorMessage(error)}`);
        }
      },
    });
  };

  const isRestaurantReview = targetType === 'RESTAURANT';
  const title = isRestaurantReview ? 'Quản lý đánh giá nhà hàng' : 'Quản lý đánh giá tài xế';
  const description = isRestaurantReview
    ? 'Theo dõi phản hồi, món ăn được nhắc đến và hình ảnh từ khách hàng.'
    : 'Theo dõi đánh giá, nhận xét nhanh và thông tin tài xế.';
  const getReviewComment = (review: ReviewWithDetails) => {
    const comment = review.comment?.trim();
    if (!comment) return 'Khách hàng không để lại nội dung nhận xét.';
    if (!review.quickTags?.length || !comment.startsWith('[')) return comment;
    const closingBracket = comment.indexOf(']');
    return closingBracket >= 0 ? comment.slice(closingBracket + 1).trim() : comment;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-5 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Title level={3} className="!mb-1 !text-slate-800">
            {title}
          </Title>
          <Text className="text-slate-500">{description}</Text>
        </div>
        <Button
          icon={<ReloadOutlined spin={loading} />}
          onClick={() => setRefreshKey((current) => current + 1)}
          className="self-start rounded-lg sm:self-auto"
        >
          Làm mới
        </Button>
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input.Search
            allowClear
            placeholder="Tìm trong nội dung nhận xét"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(0);
            }}
            className="max-w-xl"
          />
          <Select
            aria-label="Lọc theo số sao"
            value={rating ?? 0}
            onChange={(value: number) => {
              setRating(value || undefined);
              setPage(0);
            }}
            className="w-full sm:w-44"
            options={[
              { value: 0, label: 'Tất cả số sao' },
              ...[5, 4, 3, 2, 1].map((value) => ({
                value,
                label: `${value} sao`,
              })),
            ]}
          />
        </div>
      </Card>

      {loadError && (
        <Alert
          type="error"
          showIcon
          message="Không tải được danh sách đánh giá"
          description={loadError}
          action={<Button onClick={() => setRefreshKey((current) => current + 1)}>Thử lại</Button>}
        />
      )}
      {metadataIncomplete && !loadError && (
        <Alert
          type="warning"
          showIcon
          message="Một số thông tin liên quan không tải được"
          description="Danh sách vẫn hiển thị bằng mã định danh; hãy thử làm mới để tải lại thông tin."
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <Text className="font-semibold text-slate-600">
          {totalElements.toLocaleString('vi-VN')} đánh giá
        </Text>
        {rating != null && (
          <Tag color="gold" closable onClose={() => setRating(undefined)}>
            {rating} sao
          </Tag>
        )}
      </div>

      {reviews.length === 0 && !loading && !loadError ? (
        <Card className="rounded-2xl border-slate-200">
          <Empty description="Chưa có đánh giá phù hợp" />
        </Card>
      ) : loading && reviews.length === 0 ? (
        <Card className="rounded-2xl border-slate-200">
          <Skeleton active />
        </Card>
      ) : (
        <div className="space-y-4" aria-live="polite">
          {reviews.map((review) => (
            <Card
              key={review.id}
              loading={loading}
              className="rounded-2xl border-slate-200 shadow-sm"
              styles={{ body: { padding: 20 } }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar
                      size={44}
                      src={review.targetImage}
                      icon={isRestaurantReview ? <ShopOutlined /> : <CarOutlined />}
                      className={isRestaurantReview ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}
                    />
                    <div className="min-w-0">
                      <Text className="block truncate text-base font-bold text-slate-800">
                        {review.targetName}
                      </Text>
                      <Text className="text-xs text-slate-500">
                        {isRestaurantReview
                          ? `Nhà hàng #${review.targetId}`
                          : `Tài xế #${review.targetId} · Biển số: ${review.licensePlate || 'chưa cập nhật'}`}
                      </Text>
                      {review.foodItemId != null && (
                        <div className="mt-1 text-sm text-orange-700">
                          Món ăn: {review.foodName || `Món #${review.foodItemId}`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <Text className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Món trong đơn hàng #{review.orderId}
                    </Text>
                    {!review.orderContextAvailable ? (
                      <Text type="secondary">Không tìm thấy hoặc không tải được thông tin đơn hàng.</Text>
                    ) : review.orderItems.length === 0 ? (
                      <Text type="secondary">Đơn hàng không có thông tin món ăn.</Text>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {review.orderItems.map((item, index) => (
                          <div
                            key={`${review.orderId}-${item.foodId}-${index}`}
                            className="flex items-center gap-2"
                          >
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.displayName}
                                width={40}
                                height={40}
                                className="rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-100 text-xs text-orange-700">
                                Món
                              </div>
                            )}
                            <Text className="text-sm text-slate-700">
                              {item.displayName}
                              {item.quantity != null ? ` × ${item.quantity}` : ''}
                            </Text>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Rate disabled value={review.rating} className="text-sm text-amber-500" />
                    <Tag color="gold">{review.rating}/5</Tag>
                  </div>

                  <Text className="block whitespace-pre-wrap break-words text-slate-700">
                    {getReviewComment(review)}
                  </Text>

                  {!isRestaurantReview && review.quickTags && review.quickTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {review.quickTags.map((tag) => (
                        <Tag key={tag} color="blue" className="m-0 rounded-full">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}

                  {isRestaurantReview && review.images && review.images.length > 0 && (
                    <Image.PreviewGroup>
                      <Space size={8} wrap>
                        {review.images.map((image, index) => (
                          <Image
                            key={`${review.id}-${image}`}
                            src={image}
                            alt={`Ảnh đánh giá ${index + 1}`}
                            width={76}
                            height={76}
                            className="rounded-lg object-cover"
                          />
                        ))}
                      </Space>
                    </Image.PreviewGroup>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <Avatar size={24} src={review.customerAvatar} icon={<UserOutlined />} />
                      <span className="font-medium text-slate-700">{review.customerName}</span>
                      <span>#{review.customerId}</span>
                    </span>
                    <span>
                      {review.createdAt
                        ? new Date(review.createdAt).toLocaleString('vi-VN')
                        : 'Không rõ thời gian'}
                    </span>
                    <span>Đơn hàng #{review.orderId}</span>
                  </div>
                </div>

                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(review)}
                  className="self-start rounded-lg sm:ml-4"
                >
                  Xóa
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalElements > 0 && (
        <div className="flex justify-center overflow-x-auto py-2">
          <Pagination
            current={page + 1}
            pageSize={pageSize}
            total={totalElements}
            showSizeChanger
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            showTotal={(total, range) => `${range[0]}-${range[1]} / ${total}`}
            onChange={(current, size) => {
              setPage(current - 1);
              setPageSize(size);
            }}
          />
        </div>
      )}
    </div>
  );
};

export const AdminRestaurantReviewsPage: React.FC = () => (
  <AdminReviewManagementPage targetType="RESTAURANT" />
);

export const AdminDriverReviewsPage: React.FC = () => (
  <AdminReviewManagementPage targetType="DRIVER" />
);

export default AdminReviewManagementPage;
