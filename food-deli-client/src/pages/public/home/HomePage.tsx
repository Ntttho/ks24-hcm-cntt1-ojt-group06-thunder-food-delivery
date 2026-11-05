import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Empty, Skeleton } from 'antd';
import { restaurantApi, type Shop } from '@/services/modules/restaurantApi';
import {
  HomeHeroBanner,
  HomeRestaurantDirectory,
  type RestaurantItem,
} from './components';

export const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadRestaurants = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await restaurantApi.getAll({ page: 0, size: 50 });
        if (!active) return;
        setRestaurants(
          response.data.content.map((shop: Shop): RestaurantItem => ({
            id: shop.id,
            name: shop.name,
            address: shop.address,
            imageUrl: shop.imageUrl || '',
            rating: shop.ratingAvg,
            openingTime: shop.openingTime,
            closingTime: shop.closingTime,
            isOpen: shop.isOpen,
          }))
        );
      } catch {
        if (active) setError('Không thể tải danh sách nhà hàng. Vui lòng thử lại.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadRestaurants();
    return () => {
      active = false;
    };
  }, []);

  const filteredRestaurants = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return restaurants.filter((restaurant) => {
      const matchesKeyword =
        !keyword ||
        restaurant.name.toLowerCase().includes(keyword) ||
        restaurant.address.toLowerCase().includes(keyword);
      return matchesKeyword;
    });
  }, [searchTerm, restaurants]);

  return (
    <div className="space-y-10">
      {/* 1. Hero Banner with Search & Badges */}
      <HomeHeroBanner searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {loading && (
        <section>
          <div className="mb-5 h-8 w-52 rounded bg-gray-100" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} active avatar={false} paragraph={{ rows: 4 }} className="rounded-2xl bg-white p-4" />
            ))}
          </div>
        </section>
      )}
      {!loading && error && <Alert type="error" showIcon message={error} />}
      {!loading && !error && filteredRestaurants.length === 0 && (
        <section>
          <Empty description={searchTerm ? 'Không tìm thấy nhà hàng phù hợp' : 'Hiện chưa có nhà hàng'} />
        </section>
      )}
      {!loading && !error && filteredRestaurants.length > 0 && (
        <HomeRestaurantDirectory restaurants={filteredRestaurants} />
      )}
    </div>
  );
};

export default HomePage;
