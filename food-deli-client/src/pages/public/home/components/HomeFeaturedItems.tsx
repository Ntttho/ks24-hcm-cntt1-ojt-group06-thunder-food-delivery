import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col } from 'antd';
import {
  FireOutlined,
  StarFilled,
  ClockCircleOutlined,
  PlusOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '@/utils/formatters';

export interface FeaturedFoodItem {
  id: string;
  productId: number;
  productName: string;
  price: number;
  shopId: number;
  shopName: string;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  prepTime: string;
}

interface HomeFeaturedItemsProps {
  items: FeaturedFoodItem[];
  onQuickAdd: (item: FeaturedFoodItem, e: React.MouseEvent) => void;
}

export const HomeFeaturedItems: React.FC<HomeFeaturedItemsProps> = ({
  items,
  onQuickAdd,
}) => {
  const navigate = useNavigate();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FireOutlined className="text-orange-500" /> Món Ăn Bán Chạy Nhất
          </h2>
          <p className="text-gray-500 text-sm">Các món ngon được đặt nhiều nhất tuần này</p>
        </div>
        <Link to="/restaurants/1">
          <Button type="link" className="font-semibold text-orange-600 hover:text-orange-700">
            Khám phá quán ăn &rarr;
          </Button>
        </Link>
      </div>

      <Row gutter={[20, 20]}>
        {items.map((item) => (
          <Col key={item.id} xs={24} sm={12} lg={6}>
            <Card
              hoverable
              onClick={() => navigate(`/restaurants/${item.shopId}`)}
              cover={
                <div className="relative h-48 w-full overflow-hidden cursor-pointer group">
                  <img
                    alt={item.productName}
                    src={item.imageUrl}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md text-xs font-bold text-gray-700 flex items-center gap-1 shadow-xs">
                    <StarFilled className="text-amber-500" /> {item.rating}
                  </div>
                </div>
              }
              className="rounded-2xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between h-full cursor-pointer"
              bodyStyle={{ padding: 16 }}
            >
              <div>
                <div className="text-xs font-medium text-orange-600 mb-1 flex items-center gap-1">
                  <ShopOutlined /> {item.shopName}
                </div>
                <h3 className="font-bold text-gray-900 text-base line-clamp-1">{item.productName}</h3>
                <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                  <ClockCircleOutlined /> {item.prepTime}
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
                  className="bg-orange-500 hover:bg-orange-600 shadow-xs"
                  onClick={(e) => onQuickAdd(item, e)}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </section>
  );
};

export default HomeFeaturedItems;

