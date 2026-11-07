import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { addToCartAsync } from '@/store/slices/cartSlice';
import { restaurantApi } from '@/services/modules/restaurantApi';
import { RestaurantConflictModal } from '@/pages/user/components/RestaurantConflictModal';
import {
  HomeHeroBanner,
  HomeRestaurantDirectory,
  HomeFeaturedItems,
  type RestaurantItem,
  type FeaturedFoodItem,
  type FoodCategoryItem,
} from './components';

const CUISINES = [
  'Tất cả',
  'Việt Nam',
  'Đồ ăn nhanh',
  'Trà sữa',
  'Hàn Quốc',
  'Nhật Bản',
];

const INITIAL_FOOD_CATEGORIES: FoodCategoryItem[] = [
  { id: null, name: 'Tất cả' },
  { id: 1, name: 'Mon chinh' },
  { id: 2, name: 'Nuoc uong' },
  { id: 4, name: 'Com tam' },
  { id: 10, name: 'Bun bo' },
  { id: 12, name: 'Tra sua' },
  { id: 18, name: 'Ga ran' },
  { id: 19, name: 'Burger' },
];

export const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const cartState = useAppSelector((state) => state.cart);

  // Global search input in hero banner
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('Tất cả');

  // Single-Shop Constraint Conflict Modal State
  const [isConflictOpen, setIsConflictOpen] = useState(false);
  const [pendingQuickItem, setPendingQuickItem] = useState<FeaturedFoodItem | null>(null);

  // =========================================================================
  // 1. Phân Hệ Món Ăn (Food Items) - Hiển thị lên trước, Phân trang & Lọc API
  // =========================================================================
  const [foods, setFoods] = useState<FeaturedFoodItem[]>([]);
  const [foodPage, setFoodPage] = useState<number>(0);
  const [foodPageSize, setFoodPageSize] = useState<number>(8);
  const [foodTotalElements, setFoodTotalElements] = useState<number>(0);
  const [foodLoading, setFoodLoading] = useState<boolean>(true);
  const [foodSearch, setFoodSearch] = useState<string>('');
  const [foodCategories, setFoodCategories] = useState<FoodCategoryItem[]>(INITIAL_FOOD_CATEGORIES);
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<number | null>(null);

  /**
   * Tải danh sách danh mục món ăn từ backend API và lọc sạch trùng lặp
   */
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await restaurantApi.getCategories();
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const seen = new Set<string>();
          const apiCats: FoodCategoryItem[] = [];
          res.data.forEach((c) => {
            const cleanName = c.name?.trim();
            if (cleanName && !seen.has(cleanName.toLowerCase()) && !cleanName.includes('Ã')) {
              seen.add(cleanName.toLowerCase());
              apiCats.push({
                id: c.id,
                name: cleanName,
              });
            }
          });
          if (apiCats.length > 0) {
            setFoodCategories([{ id: null, name: 'Tất cả' }, ...apiCats]);
          }
        }
      } catch (err) {
        console.warn('[HomePage] Categories fetch skipped:', err);
      }
    };
    loadCategories();
  }, []);

  /**
   * Gọi API backend lấy danh sách món ăn theo phân trang, tìm kiếm và lọc danh mục
   */
  const fetchLiveFoods = useCallback(
    async (
      targetPage: number,
      targetPageSize: number,
      targetSearch: string,
      targetCategoryId: number | null,
      targetCategoryName?: string
    ) => {
      setFoodLoading(true);
      try {
        const res = await restaurantApi.getProducts({
          page: targetPage,
          size: targetPageSize,
          search: targetSearch.trim() || undefined,
          categoryId: targetCategoryId !== null ? targetCategoryId : undefined,
          categoryName: targetCategoryName?.trim() || undefined,
          isAvailable: true,
        });

        if (res && res.data) {
          const raw = res.data;
          const items = Array.isArray(raw) ? raw : (raw.content || []);
          const mapped: FeaturedFoodItem[] = items.map((p: any) => ({
            id: `food-${p.id}`,
            productId: p.id,
            productName: p.name,
            description: p.description,
            price: Number(p.price),
            shopId: p.restaurantId || 1,
            shopName: p.restaurantName || 'Quán ăn đối tác',
            imageUrl:
              p.imageUrl ||
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
            rating: Number((4.6 + ((p.id * 7) % 5) / 10).toFixed(1)),
            reviewsCount: 40 + ((p.id * 19) % 200),
            prepTime: '15-20 phút',
            categoryName: p.categoryName || 'Món ngon',
          }));

          setFoods(mapped);
          setFoodTotalElements((raw as any).totalElements ?? mapped.length);
        } else {
          setFoods([]);
          setFoodTotalElements(0);
        }
      } catch (err) {
        console.warn('[HomePage] Fetch live foods error:', err);
        setFoods([]);
        setFoodTotalElements(0);
      } finally {
        setFoodLoading(false);
      }
    },
    []
  );

  // Debounce API search & category filter cho Món Ăn
  useEffect(() => {
    const timer = setTimeout(() => {
      setFoodPage(0);
      const effectiveSearch = foodSearch.trim() || searchTerm.trim();
      const selectedCat = foodCategories.find((c) => c.id === selectedFoodCategory);
      fetchLiveFoods(
        0,
        foodPageSize,
        effectiveSearch,
        selectedFoodCategory,
        selectedCat && selectedCat.name !== 'Tất cả' ? selectedCat.name : undefined
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [foodSearch, searchTerm, selectedFoodCategory, foodPageSize, foodCategories, fetchLiveFoods]);

  // Xử lý chuyển trang món ăn
  const handleFoodPageChange = (newPage: number, newPageSize: number) => {
    setFoodPage(newPage);
    setFoodPageSize(newPageSize);
    const effectiveSearch = foodSearch.trim() || searchTerm.trim();
    const selectedCat = foodCategories.find((c) => c.id === selectedFoodCategory);
    fetchLiveFoods(
      newPage,
      newPageSize,
      effectiveSearch,
      selectedFoodCategory,
      selectedCat && selectedCat.name !== 'Tất cả' ? selectedCat.name : undefined
    );
  };

  // Xử lý lọc danh mục món ăn
  const handleSelectFoodCategory = (categoryId: number | null) => {
    setSelectedFoodCategory(categoryId);
  };

  // =========================================================================
  // 2. Phân Hệ Nhà Hàng (Restaurants) - Phân trang & Tìm kiếm API
  // =========================================================================
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [restaurantPage, setRestaurantPage] = useState<number>(0);
  const [restaurantPageSize, setRestaurantPageSize] = useState<number>(8);
  const [restaurantTotalElements, setRestaurantTotalElements] = useState<number>(0);
  const [restaurantLoading, setRestaurantLoading] = useState<boolean>(false);

  const fetchLiveRestaurants = useCallback(
    async (targetPage: number, targetPageSize: number, targetSearch: string) => {
      setRestaurantLoading(true);
      try {
        const res = await restaurantApi.getAll({
          page: targetPage,
          size: targetPageSize,
          search: targetSearch.trim() || undefined,
        });

        if (res && res.data) {
          const raw = res.data;
          const items = Array.isArray(raw) ? raw : (raw.content || []);
          const mapped: RestaurantItem[] = items.map((shop: any) => ({
            id: shop.id,
            name: shop.name,
            cuisine: 'Việt Nam',
            address: shop.address || 'TP. Hồ Chí Minh',
            imageUrl:
              shop.imageUrl ||
              'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
            rating: Number(shop.ratingAvg || 4.8),
            deliveryTime: '20-25 phút',
          }));
          setRestaurants(mapped);
          setRestaurantTotalElements((raw as any).totalElements ?? mapped.length);
        } else {
          setRestaurants([]);
          setRestaurantTotalElements(0);
        }
      } catch {
        setRestaurants([]);
        setRestaurantTotalElements(0);
      } finally {
        setRestaurantLoading(false);
      }
    },
    []
  );

  // Debounce API search cho nhà hàng (dùng searchTerm từ banner)
  useEffect(() => {
    const timer = setTimeout(() => {
      setRestaurantPage(0);
      fetchLiveRestaurants(0, restaurantPageSize, searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, restaurantPageSize, fetchLiveRestaurants]);

  const handleRestaurantPageChange = (newPage: number, newPageSize: number) => {
    setRestaurantPage(newPage);
    setRestaurantPageSize(newPageSize);
    fetchLiveRestaurants(newPage, newPageSize, searchTerm);
  };

  const filteredRestaurants = useMemo(() => {
    if (selectedCuisine === 'Tất cả') return restaurants;
    return restaurants.filter((r) => r.cuisine === selectedCuisine);
  }, [restaurants, selectedCuisine]);

  // =========================================================================
  // 3. Xử Lý Thêm Nhanh Vào Giỏ Hàng & Single-Shop Constraint Modal
  // =========================================================================
  const handleQuickAdd = (item: FeaturedFoodItem, e: React.MouseEvent) => {
    e.stopPropagation();
    // Multi-Shop Cart: Thêm trực tiếp vào giỏ hàng, giữ nguyên các món của quán khác
    applyAddToCart(item, false);
  };

  const applyAddToCart = (item: FeaturedFoodItem, replaceCart: boolean) => {
    const cartItemId = `${item.productId}-base`;

    dispatch(
      addToCartAsync({
        item: {
          id: cartItemId,
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: 1,
          imageUrl: item.imageUrl,
          shopId: item.shopId,
          shopName: item.shopName,
        },
        replaceCart,
      })
    );

    message.success(`Đã thêm "${item.productName}" vào giỏ hàng!`);
  };

  const handleConfirmReplaceCart = () => {
    if (pendingQuickItem) {
      applyAddToCart(pendingQuickItem, true);
      message.success(`Đã tạo giỏ hàng mới tại "${pendingQuickItem.shopName}"!`);
      setPendingQuickItem(null);
    }
    setIsConflictOpen(false);
  };

  return (
    <div className="space-y-10 pb-12">
      {/* 1. Hero Banner with Global Search */}
      <HomeHeroBanner searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* 2. MÓN ĂN CỦA CÁC NHÀ HÀNG - HIỂN THỊ LÊN TRƯỚC, PHÂN TRANG & LỌC GỌI API */}
      <HomeFeaturedItems
        items={foods}
        loading={foodLoading}
        page={foodPage}
        pageSize={foodPageSize}
        totalElements={foodTotalElements}
        onPageChange={handleFoodPageChange}
        categories={foodCategories}
        selectedCategoryId={selectedFoodCategory}
        onSelectCategory={handleSelectFoodCategory}
        searchTerm={foodSearch}
        onSearchChange={setFoodSearch}
        onQuickAdd={handleQuickAdd}
      />

      {/* 3. DANH MỤC NHÀ HÀNG - PHÂN TRANG & TÌM KIẾM GỌI API */}
      <HomeRestaurantDirectory
        cuisines={CUISINES}
        selectedCuisine={selectedCuisine}
        onSelectCuisine={setSelectedCuisine}
        restaurants={filteredRestaurants}
        page={restaurantPage}
        pageSize={restaurantPageSize}
        totalElements={restaurantTotalElements}
        onPageChange={handleRestaurantPageChange}
        loading={restaurantLoading}
      />

      {/* 4. Single-Shop Constraint Modal (Xung Đột Quán Ăn) */}
      <RestaurantConflictModal
        isOpen={isConflictOpen}
        onClose={() => {
          setIsConflictOpen(false);
          setPendingQuickItem(null);
        }}
        onConfirmReplace={handleConfirmReplaceCart}
        currentShopName={cartState.shopName || 'Quán hiện tại'}
        currentItemsCount={cartState.totalQuantity}
        currentTotal={cartState.totalAmount}
        currentImageUrl={cartState.items[0]?.imageUrl}
        newShopName={pendingQuickItem?.shopName}
        newDishName={pendingQuickItem?.productName}
        newDishPrice={pendingQuickItem?.price}
        newImageUrl={pendingQuickItem?.imageUrl}
      />
    </div>
  );
};

export default HomePage;
