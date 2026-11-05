import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col } from 'antd';
import { StarFilled, ClockCircleOutlined, ShopOutlined } from '@ant-design/icons';

export interface RestaurantItem {
  id: number;
  name: string;
  cuisine: string;
  address: string;
  imageUrl: string;
  rating: number;
  deliveryTime: string;
}

interface HomeRestaurantDirectoryProps {
  cuisines: string[];
  selectedCuisine: string;
  onSelectCuisine: (cuisine: string) => void;
  restaurants: RestaurantItem[];
}

export const HomeRestaurantDirectory: React.FC<HomeRestaurantDirectoryProps> = ({
  cuisines,
  selectedCuisine,
  onSelectCuisine,
  restaurants,
}) => {
  const navigate = useNavigate();

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Nhà hàng gần bạn</h2>
        <p className="mt-1 text-sm text-gray-500">Tìm quán phù hợp theo loại ẩm thực hoặc tên nhà hàng</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {cuisines.map((cuisine) => (
          <Button
            key={cuisine}
            type={selectedCuisine === cuisine ? 'primary' : 'default'}
            shape="round"
            className={selectedCuisine === cuisine ? 'border-orange-500 bg-orange-500 font-semibold' : 'font-medium'}
            onClick={() => onSelectCuisine(cuisine)}
          >
            {cuisine}
          </Button>
        ))}
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
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md text-xs font-bold text-gray-700 flex items-center gap-1 shadow-xs">
                    <StarFilled className="text-amber-500" /> {restaurant.rating}
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/65 px-2.5 py-0.5 rounded-full text-xs text-white">
                    {restaurant.cuisine}
                  </div>
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
                <span className="flex items-center gap-1 text-orange-600 font-semibold">
                  <ClockCircleOutlined /> {restaurant.deliveryTime}
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

