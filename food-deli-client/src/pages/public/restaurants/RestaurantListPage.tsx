import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input, Pagination, Empty, Button, Skeleton } from 'antd';
import {
  SearchOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { restaurantApi, type Shop } from '@/services/modules/restaurantApi';
import { RestaurantCard, type RestaurantData } from './components/RestaurantCard';
import {
  RestaurantFilterBar,
  type FilterState,
} from './components/RestaurantFilterBar';

// Fallback rich dataset of restaurants for immediate testing & demo
const MOCK_RESTAURANTS: RestaurantData[] = [
  {
    id: 1,
    name: 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi',
    cuisine: 'Cơm',
    address: '179 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewCount: 2340,
    deliveryTime: '15-20 phút',
    distance: '1.2 km',
    distanceKm: 1.2,
    shippingFee: 0,
    isFreeship: true,
    isOpen: true,
    isPartner: true,
    promoTag: 'Freeship',
    priceRange: '45k - 95k',
  },
  {
    id: 2,
    name: 'Phê La - Trà Ô Long Đặc Sản',
    cuisine: 'Trà sữa',
    address: '125 Trương Định, Phường 9, Quận 3, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewCount: 3120,
    deliveryTime: '10-15 phút',
    distance: '0.8 km',
    distanceKm: 0.8,
    shippingFee: 15000,
    isFreeship: false,
    isOpen: true,
    isPartner: true,
    promoTag: 'Giảm 20k',
    priceRange: '35k - 65k',
  },
  {
    id: 3,
    name: 'Bún Bò Huế O Mai - Đậm Vị Cố Đô',
    cuisine: 'Bún / Phở',
    address: '42 Trần Hưng Đạo, Phường 7, Quận 5, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewCount: 1580,
    deliveryTime: '20-25 phút',
    distance: '2.5 km',
    distanceKm: 2.5,
    shippingFee: 18000,
    isFreeship: false,
    isOpen: true,
    isPartner: false,
    promoTag: 'Tặng Trà',
    priceRange: '45k - 70k',
  },
  {
    id: 4,
    name: 'Tiệm Cơm Gà Hoàng Gia',
    cuisine: 'Cơm',
    address: '88 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewCount: 980,
    deliveryTime: '15-20 phút',
    distance: '1.5 km',
    distanceKm: 1.5,
    shippingFee: 0,
    isFreeship: true,
    isOpen: true,
    isPartner: true,
    promoTag: 'Freeship',
    priceRange: '40k - 85k',
  },
  {
    id: 5,
    name: 'Thunder Burger & Fries',
    cuisine: 'Đồ ăn nhanh',
    address: '205 Nguyễn Thị Thập, Tân Phú, Quận 7, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewCount: 1890,
    deliveryTime: '15-20 phút',
    distance: '1.9 km',
    distanceKm: 1.9,
    shippingFee: 16000,
    isFreeship: false,
    isOpen: true,
    isPartner: true,
    promoTag: 'Mua 1 tặng 1',
    priceRange: '50k - 120k',
  },
  {
    id: 6,
    name: 'The Alley Tea House - Trân Châu Đường Đen',
    cuisine: 'Trà sữa',
    address: '68 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewCount: 2840,
    deliveryTime: '10-15 phút',
    distance: '0.9 km',
    distanceKm: 0.9,
    shippingFee: 0,
    isFreeship: true,
    isOpen: true,
    isPartner: true,
    promoTag: 'Freeship',
    priceRange: '45k - 80k',
  },
  {
    id: 7,
    name: 'K-Pub Korean BBQ & Tokbokki',
    cuisine: 'Món Hàn',
    address: '134 Sư Vạn Hạnh, Phường 12, Quận 10, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=600&auto=format&fit=crop&q=80',
    rating: 4.6,
    reviewCount: 760,
    deliveryTime: '25-30 phút',
    distance: '3.4 km',
    distanceKm: 3.4,
    shippingFee: 22000,
    isFreeship: false,
    isOpen: true,
    isPartner: false,
    promoTag: 'Giảm 15%',
    priceRange: '60k - 150k',
  },
  {
    id: 8,
    name: 'Sushi Hokkaido Sachi',
    cuisine: 'Món Nhật',
    address: '40 Đông Du, Phường Bến Nghé, Quận 1, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewCount: 1420,
    deliveryTime: '30-35 phút',
    distance: '2.1 km',
    distanceKm: 2.1,
    shippingFee: 20000,
    isFreeship: false,
    isOpen: true,
    isPartner: true,
    promoTag: 'Ưu đãi Pro',
    priceRange: '100k - 350k',
  },
  {
    id: 9,
    name: 'Bánh Mì Huỳnh Hoa - Đặc Sản Sài Gòn',
    cuisine: 'Đồ ăn nhanh',
    address: '26 Lê Thị Riêng, Phường Phạm Ngũ Lão, Quận 1, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewCount: 4500,
    deliveryTime: '15-20 phút',
    distance: '1.4 km',
    distanceKm: 1.4,
    shippingFee: 15000,
    isFreeship: false,
    isOpen: true,
    isPartner: true,
    promoTag: 'Quán Hot',
    priceRange: '45k - 75k',
  },
  {
    id: 10,
    name: 'Quán Chay Mandala - Hương Vị Thanh Tao',
    cuisine: 'Đồ chay',
    address: '110 Sương Nguyệt Ánh, Phường Bến Thành, Quận 1, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewCount: 630,
    deliveryTime: '20-25 phút',
    distance: '1.7 km',
    distanceKm: 1.7,
    shippingFee: 0,
    isFreeship: true,
    isOpen: false, // Demo closed status
    isPartner: false,
    promoTag: 'Freeship',
    priceRange: '35k - 80k',
  },
  {
    id: 11,
    name: 'Hủ Tiếu Nam Vang Nhân Quán',
    cuisine: 'Bún / Phở',
    address: '72 Nguyễn Trãi, Phường 3, Quận 5, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewCount: 890,
    deliveryTime: '20-25 phút',
    distance: '2.8 km',
    distanceKm: 2.8,
    shippingFee: 18000,
    isFreeship: false,
    isOpen: true,
    isPartner: false,
    promoTag: 'Món mới',
    priceRange: '50k - 85k',
  },
  {
    id: 12,
    name: 'Cà Phê Muối Chú Long - Đậm Vị Truyền Thống',
    cuisine: 'Cà phê',
    address: '417 Điện Biên Phủ, Phường 25, Bình Thạnh, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewCount: 1670,
    deliveryTime: '10-15 phút',
    distance: '0.7 km',
    distanceKm: 0.7,
    shippingFee: 0,
    isFreeship: true,
    isOpen: true,
    isPartner: true,
    promoTag: 'Freeship',
    priceRange: '20k - 40k',
  },
];

const INITIAL_FILTERS: FilterState = {
  selectedCuisine: 'ALL',
  sortBy: 'POPULAR',
  openOnly: false,
  freeshipOnly: false,
  highRatingOnly: false,
  fastDeliveryOnly: false,
  partnerOnly: false,
};

export const RestaurantListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchKeyword, setSearchKeyword] = useState<string>(
    searchParams.get('q') || ''
  );
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...INITIAL_FILTERS,
    selectedCuisine: searchParams.get('cuisine') || 'ALL',
  }));
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Fetch from API Gateway with graceful fallback
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await restaurantApi.getAll();
      const apiData = response?.data;
      const list = Array.isArray(apiData)
        ? apiData
        : Array.isArray((apiData as any)?.content)
        ? (apiData as any).content
        : null;

      if (list && list.length > 0) {
        // Map backend Shop items into rich RestaurantData
        const mapped: RestaurantData[] = list.map((s: Shop, idx: number) => {
          const fallback = MOCK_RESTAURANTS[idx % MOCK_RESTAURANTS.length];
          return {
            id: s.id,
            name: s.name,
            address: s.address || fallback.address,
            imageUrl: s.imageUrl || fallback.imageUrl,
            rating: s.rating || fallback.rating,
            reviewCount: fallback.reviewCount,
            cuisine: fallback.cuisine,
            deliveryTime: fallback.deliveryTime,
            distance: fallback.distance,
            distanceKm: fallback.distanceKm,
            shippingFee: fallback.shippingFee,
            isOpen: s.status ? s.status === 'ACTIVE' || s.status === 'OPEN' : fallback.isOpen,
            isFreeship: fallback.isFreeship,
            promoTag: fallback.promoTag,
            isPartner: fallback.isPartner,
            priceRange: fallback.priceRange,
          };
        });
        setRestaurants(mapped);
      } else {
        setRestaurants(MOCK_RESTAURANTS);
      }
    } catch {
      // Offline / Gateway down fallback
      setRestaurants(MOCK_RESTAURANTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Synchronize URL query params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchKeyword.trim()) params.q = searchKeyword.trim();
    if (filters.selectedCuisine !== 'ALL') params.cuisine = filters.selectedCuisine;
    setSearchParams(params, { replace: true });
  }, [searchKeyword, filters.selectedCuisine, setSearchParams]);

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
    setCurrentPage(1);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchKeyword('');
    setCurrentPage(1);
  };

  // Filter & Sort Logic
  const filteredAndSortedRestaurants = useMemo(() => {
    let result = [...restaurants];

    // 1. Search Query
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q)
      );
    }

    // 2. Cuisine Filter
    if (filters.selectedCuisine !== 'ALL') {
      result = result.filter((r) =>
        r.cuisine.toLowerCase().includes(filters.selectedCuisine.toLowerCase())
      );
    }

    // 3. Quick Toggles
    if (filters.openOnly) {
      result = result.filter((r) => r.isOpen);
    }
    if (filters.freeshipOnly) {
      result = result.filter((r) => r.isFreeship || r.shippingFee === 0);
    }
    if (filters.highRatingOnly) {
      result = result.filter((r) => r.rating >= 4.5);
    }
    if (filters.fastDeliveryOnly) {
      result = result.filter((r) => {
        const mins = parseInt(r.deliveryTime) || 20;
        return mins <= 20;
      });
    }
    if (filters.partnerOnly) {
      result = result.filter((r) => r.isPartner);
    }

    // 4. Sorting
    switch (filters.sortBy) {
      case 'RATING_DESC':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'DISTANCE_ASC':
        result.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
        break;
      case 'DELIVERY_FAST':
        result.sort((a, b) => (parseInt(a.deliveryTime) || 0) - (parseInt(b.deliveryTime) || 0));
        break;
      case 'SHIPPING_LOW':
        result.sort((a, b) => a.shippingFee - b.shippingFee);
        break;
      case 'POPULAR':
      default:
        result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
    }

    return result;
  }, [restaurants, searchKeyword, filters]);

  // Pagination Slice
  const paginatedRestaurants = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedRestaurants.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedRestaurants, currentPage]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. Hero Search & Banner Section */}
      <div className="relative rounded-3xl bg-linear-to-r from-orange-500 via-amber-500 to-orange-600 p-6 sm:p-10 text-white shadow-xl shadow-orange-500/15 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-black/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white tracking-wide uppercase">
            <ThunderboltFilled className="text-amber-300" />
            <span>Khám phá Ẩm thực Food Thunder</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Quán ăn ngon & Món ăn hấp dẫn gần bạn
          </h1>

          <p className="text-white/90 text-sm sm:text-base font-medium">
            Giao nhanh trong 15-20 phút • Freeship cho đối tác Thunder Pro • Đảm bảo nóng hổi
          </p>

          {/* Large Hero Search Bar */}
          <div className="pt-2">
            <Input
              size="large"
              placeholder="Tìm kiếm quán ăn, món ăn (cơm tấm, trà sữa, gà rán...)..."
              prefix={<SearchOutlined className="text-orange-500 text-lg mr-2" />}
              value={searchKeyword}
              onChange={handleSearchChange}
              allowClear
              className="h-14 rounded-2xl text-base shadow-lg hover:border-white focus:border-white"
            />
          </div>
        </div>
      </div>

      {/* 2. Filter & Sort Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
        <RestaurantFilterBar
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
          totalCount={filteredAndSortedRestaurants.length}
        />
      </div>

      {/* 3. Restaurant Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <Skeleton.Image className="!w-full !h-44 rounded-xl" active />
              <Skeleton active paragraph={{ rows: 2 }} />
            </div>
          ))}
        </div>
      ) : filteredAndSortedRestaurants.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-xs">
          <Empty
            description={
              <div className="space-y-2">
                <h3 className="font-extrabold text-gray-800 text-lg mb-0">
                  Không tìm thấy quán ăn nào phù hợp
                </h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  Rất tiếc, không có nhà hàng nào khớp với từ khóa "{searchKeyword}" hoặc bộ lọc bạn đã chọn.
                </p>
              </div>
            }
          >
            <Button
              type="primary"
              onClick={handleResetFilters}
              className="bg-orange-500 hover:bg-orange-600 rounded-xl font-bold mt-2"
            >
              Đặt lại tất cả bộ lọc
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>

          {/* Pagination */}
          {filteredAndSortedRestaurants.length > pageSize && (
            <div className="flex justify-center pt-4">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredAndSortedRestaurants.length}
                onChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
                showSizeChanger={false}
                className="font-semibold"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantListPage;
