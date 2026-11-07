import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Pagination, Spin, Empty, Input } from 'antd';
import {
  FireOutlined,
  StarFilled,
  ClockCircleOutlined,
  PlusOutlined,
  ShopOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '@/utils/formatters';
import { getOptimizedCloudinaryUrl } from '@/services/modules/cloudinaryService';

export interface FeaturedFoodItem {
  id: string | number;
  productId: number;
  productName: string;
  description?: string;
  price: number;
  shopId: number;
  shopName: string;
  imageUrl: string;
  rating: number;
  reviewsCount?: number;
  prepTime?: string;
  categoryName?: string;
}

export interface FoodCategoryItem {
  id: number | null;
  name: string;
}

interface HomeFeaturedItemsProps {
  items: FeaturedFoodItem[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  totalElements?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  categories: FoodCategoryItem[];
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number | null) => void;
  searchTerm?: string;
  onSearchChange?: (search: string) => void;
  onQuickAdd: (item: FeaturedFoodItem, e: React.MouseEvent) => void;
}

export const HomeFeaturedItems: React.FC<HomeFeaturedItemsProps> = ({
  items,
  loading = false,
  page = 0,
  pageSize = 8,
  totalElements = 0,
  onPageChange,
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchTerm = '',
  onSearchChange,
  onQuickAdd,
}) => {
  const navigate = useNavigate();

  return (
    <section className="space-y-5 bg-white/60 backdrop-blur-xs p-6 rounded-3xl border border-gray-100 shadow-xs">
      {/* 1. Header with Title & Inline Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FireOutlined className="text-orange-500 animate-pulse" /> Món Ăn Nổi Bật Của Các Nhà Hàng
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Khám phá các món ngon từ mọi quán ăn, đặt món nhanh chóng với dữ liệu trực tiếp từ hệ thống
          </p>
        </div>

        {onSearchChange && (
          <div className="w-full md:w-80">
            <Input
              prefix={<SearchOutlined className="text-gray-400 mr-1" />}
              placeholder="Tìm kiếm món ăn theo tên..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              allowClear
              className="rounded-xl h-10 border-gray-200 hover:border-orange-400 focus:border-orange-500 shadow-2xs"
            />
          </div>
        )}
      </div>

      {/* 2. Category Filter Chips (Lọc gọi API) */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <Button
              key={cat.id !== null ? `cat-${cat.id}` : 'cat-all'}
              type={isSelected ? 'primary' : 'default'}
              shape="round"
              className={
                isSelected
                  ? 'border-orange-500 bg-orange-500 font-semibold shadow-xs'
                  : 'font-medium hover:text-orange-500 hover:border-orange-300'
              }
              onClick={() => onSelectCategory(cat.id)}
            >
              {cat.name}
            </Button>
          );
        })}
      </div>

      {/* 3. Items Grid or Loading/Empty State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spin size="large" />
          <p className="text-gray-400 text-sm">Đang tải danh sách món ăn từ hệ thống...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 text-center">
          <Empty
            description={
              <span className="text-gray-500">
                {searchTerm
                  ? `Không tìm thấy món ăn nào phù hợp với từ khóa "${searchTerm}"`
                  : 'Chưa có món ăn nào trong danh mục này'}
              </span>
            }
          />
        </div>
      ) : (
        <Row gutter={[20, 20]}>
          {items.map((item) => (
            <Col key={item.id} xs={24} sm={12} lg={6}>
              <Card
                hoverable
                onClick={() => navigate(`/restaurants/${item.shopId}`)}
                cover={
                  <div className="relative h-48 w-full overflow-hidden cursor-pointer group bg-gray-100">
                    <img
                      alt={item.productName}
                      src={getOptimizedCloudinaryUrl(item.imageUrl, 400, 300)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-md text-xs font-bold text-gray-700 flex items-center gap-1 shadow-xs">
                      <StarFilled className="text-amber-500" /> {item.rating}
                    </div>
                    {item.categoryName && (
                      <div className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white shadow-xs">
                        {item.categoryName}
                      </div>
                    )}
                  </div>
                }
                className="rounded-2xl overflow-hidden border border-gray-100 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between h-full cursor-pointer"
                bodyStyle={{ padding: 16 }}
              >
                <div>
                  <div
                    className="text-xs font-medium text-orange-600 mb-1 flex items-center gap-1 hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/restaurants/${item.shopId}`);
                    }}
                  >
                    <ShopOutlined /> {item.shopName}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {item.productName}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                    <ClockCircleOutlined /> {item.prepTime || '15-20 phút'}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="font-extrabold text-orange-600 text-lg">
                    {formatCurrency(item.price)}
                  </div>
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<PlusOutlined />}
                    className="bg-orange-500 hover:bg-orange-600 shadow-xs active:scale-95 transition-transform"
                    onClick={(e) => onQuickAdd(item, e)}
                    title="Thêm vào giỏ hàng"
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 4. Server-Side Pagination Controls */}
      {totalElements > 0 && onPageChange && (
        <div className="flex justify-center pt-4">
          <Pagination
            current={page + 1}
            pageSize={pageSize}
            total={totalElements}
            onChange={(newPage, newPageSize) => onPageChange(newPage - 1, newPageSize)}
            showSizeChanger={false}
            showTotal={(total) => `Tổng cộng ${total} món ăn`}
          />
        </div>
      )}
    </section>
  );
};

export default HomeFeaturedItems;
