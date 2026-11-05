import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col } from 'antd';
import { StarFilled, ClockCircleOutlined, ShopOutlined } from '@ant-design/icons';

export interface RestaurantItem {
  id: number;
  name: string;
  address: string;
  imageUrl: string;
  rating?: number;
  openingTime?: string;
  closingTime?: string;
  isOpen?: boolean;
}

interface HomeRestaurantDirectoryProps {
  restaurants: RestaurantItem[];
}

export const HomeRestaurantDirectory: React.FC<HomeRestaurantDirectoryProps> = ({
  restaurants,
}) => {
  const navigate = useNavigate();

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Nhà hàng gần bạn</h2>
        <p className="mt-1 text-sm text-gray-500">Tìm quán phù hợp theo loại ẩm thực hoặc tên nhà hàng</p>
      </div>

      <Row gutter={[20, 20]}>
        {restaurants.map((restaurant) => (
          <Col key={restaurant.id} xs={24} sm={12} lg={6}>
            <Card
              hoverable
              onClick={() => navigate(`/restaurants/${restaurant.id}`)}
              cover={
                <div className="relative h-44 w-full overflow-hidden group">
                  <img
                    alt={restaurant.name}
                    src={restaurant.imageUrl}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {typeof restaurant.rating === 'number' && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-xs text-white">
                      <StarFilled className="text-amber-400" /> {restaurant.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              }
              className="rounded-2xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-md transition-shadow"
              bodyStyle={{ padding: 14 }}
            >
              <h3 className="font-bold text-gray-900 text-base line-clamp-1">{restaurant.name}</h3>
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                <ShopOutlined /> {restaurant.address}
              </div>
              <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1 font-semibold text-orange-600">
                  <ClockCircleOutlined />
                  {restaurant.openingTime && restaurant.closingTime
                    ? `${restaurant.openingTime.slice(0, 5)} - ${restaurant.closingTime.slice(0, 5)}`
                    : restaurant.isOpen === true
                      ? 'Đang mở cửa'
                      : restaurant.isOpen === false
                        ? 'Đang đóng cửa'
                        : ''}
                </span>
                <span className="font-medium text-gray-600">Xem quán &rarr;</span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </section>
  );
};

export default HomeRestaurantDirectory;
