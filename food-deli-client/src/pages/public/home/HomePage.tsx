import React, { useState, useMemo } from 'react';
import { message } from 'antd';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { addToCart } from '@/store/slices/cartSlice';
import {
  HomeHeroBanner,
  HomeRestaurantDirectory,
  HomeFeaturedItems,
  type RestaurantItem,
  type FeaturedFoodItem,
} from './components';

const CUISINES = [
  'Tất cả',
  'Việt Nam',
  'Đồ ăn nhanh',
  'Trà sữa',
  'Hàn Quốc',
  'Nhật Bản',
];

const RESTAURANTS: RestaurantItem[] = [
  {
    id: 1,
    name: 'Tiệm Cơm Gà Hoàng Gia',
    cuisine: 'Việt Nam',
    address: 'Quận 1, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600',
    rating: 4.8,
    deliveryTime: '15-20 phút',
  },
  {
    id: 2,
    name: 'The Alley Tea House',
    cuisine: 'Trà sữa',
    address: 'Quận 3, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600',
    rating: 4.9,
    deliveryTime: '10-15 phút',
  },
  {
    id: 3,
    name: 'Bún Bò Huế O Mai',
    cuisine: 'Việt Nam',
    address: 'Quận 5, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600',
    rating: 4.7,
    deliveryTime: '20-25 phút',
  },
  {
    id: 4,
    name: 'Thunder Burger & Fries',
    cuisine: 'Đồ ăn nhanh',
    address: 'Quận 7, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
    rating: 4.9,
    deliveryTime: '15-20 phút',
  },
];

const FEATURED_ITEMS: FeaturedFoodItem[] = [
  {
    id: 'item-1',
    productId: 101,
    productName: 'Cơm Gà Xối Mỡ Giòn Cay',
    price: 45000,
    shopId: 1,
    shopName: 'Tiệm Cơm Gà Hoàng Gia',
    imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 142,
    prepTime: '15-20 phút',
  },
  {
    id: 'item-2',
    productId: 102,
    productName: 'Trà Sữa Trân Châu Đường Đen',
    price: 35000,
    shopId: 2,
    shopName: 'The Alley Tea House',
    imageUrl: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 310,
    prepTime: '10-15 phút',
  },
  {
    id: 'item-3',
    productId: 103,
    productName: 'Bún Bò Huế Đặc Biệt',
    price: 55000,
    shopId: 3,
    shopName: 'Bún Bò Huế O Mai',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewsCount: 88,
    prepTime: '20-25 phút',
  },
  {
    id: 'item-4',
    productId: 104,
    productName: 'Burger Bò Phô Mai Chảy',
    price: 69000,
    shopId: 4,
    shopName: 'Thunder Burger & Fries',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 220,
    prepTime: '15-20 phút',
  },
];

export const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('Tất cả');

  const filteredRestaurants = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return RESTAURANTS.filter((restaurant) => {
      const matchesCuisine = selectedCuisine === 'Tất cả' || restaurant.cuisine === selectedCuisine;
      const matchesKeyword =
        !keyword ||
        restaurant.name.toLowerCase().includes(keyword) ||
        restaurant.cuisine.toLowerCase().includes(keyword) ||
        restaurant.address.toLowerCase().includes(keyword);
      return matchesCuisine && matchesKeyword;
    });
  }, [searchTerm, selectedCuisine]);

  const handleQuickAdd = (item: FeaturedFoodItem, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(
      addToCart({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: 1,
        imageUrl: item.imageUrl,
        shopId: item.shopId,
        shopName: item.shopName,
      })
    );
    message.success(`Đã thêm "${item.productName}" vào giỏ hàng!`);
  };

  return (
    <div className="space-y-10">
      {/* 1. Hero Banner with Search & Badges */}
      <HomeHeroBanner searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* 2. Restaurant Directory with Cuisine Chips */}
      <HomeRestaurantDirectory
        cuisines={CUISINES}
        selectedCuisine={selectedCuisine}
        onSelectCuisine={setSelectedCuisine}
        restaurants={filteredRestaurants}
      />

      {/* 3. Featured Bestseller Foods Grid */}
      <HomeFeaturedItems items={FEATURED_ITEMS} onQuickAdd={handleQuickAdd} />
    </div>
  );
};

export default HomePage;
