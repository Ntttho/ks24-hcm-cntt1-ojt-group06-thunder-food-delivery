import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Empty, Skeleton, Tabs, message } from 'antd';
import { AppstoreOutlined, CommentOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { restaurantApi, type ProductDetail, type ProductItem } from '@/services/modules/restaurantApi';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { addToCart } from '@/store/slices/cartSlice';
import { RestaurantConflictModal } from '../components/RestaurantConflictModal';
import { StoreHeroBanner, StoreMenuCategories, StoreFoodCard, StoreCartDrawer } from './components';
import { FoodCustomizationModal } from './components/FoodCustomizationModal';
import { StoreReviewSection } from '../store-review';
import type { CustomizationGroup, FoodItem, StoreDetail } from './types';

export const StoreDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const cartState = useAppSelector((state) => state.cart);
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews' | 'info'>('menu');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [customizingFood, setCustomizingFood] = useState<FoodItem | null>(null);
  const [pendingFood, setPendingFood] = useState<FoodItem | null>(null);
  const [isConflictOpen, setIsConflictOpen] = useState(false);

  useEffect(() => {
    let active = true;
    if (!id) {
      setError('Không xác định được nhà hàng.');
      setLoading(false);
      return;
    }
    const loadStore = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await restaurantApi.getById(id);
        if (!active) return;
        const detail = response.data;
        setStore({
          id: detail.id,
          name: detail.name,
          address: detail.address,
          phone: detail.phoneNumber,
          rating: detail.ratingAvg,
          openTime: detail.openingTime,
          closeTime: detail.closingTime,
          coverImageUrl: detail.imageUrl || '',
          avatarUrl: detail.imageUrl || '',
          tags: [],
        });
        const mappedFoods = (detail.categories || []).flatMap((category) =>
          category.products.map((product: ProductItem): FoodItem => ({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            description: product.description || '',
            imageUrl: product.imageUrl || '',
            category: category.name,
            isPopular: false,
          }))
        );
        setFoods(mappedFoods);
        setActiveCategory('Tất cả');
      } catch {
        if (active) setError('Không thể tải thông tin nhà hàng. Vui lòng thử lại.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadStore();
    return () => {
      active = false;
    };
  }, [id]);

  const categories = useMemo(
    () => ['Tất cả', ...Array.from(new Set(foods.map((food) => food.category)))],
    [foods]
  );
  const filteredFoods = useMemo(
    () => activeCategory === 'Tất cả' ? foods : foods.filter((food) => food.category === activeCategory),
    [activeCategory, foods]
  );

  const mapCustomization = (detail: ProductDetail): CustomizationGroup[] => {
    if (detail.toppingGroups?.length) {
      return detail.toppingGroups.map((group, index) => ({
        id: index + 1,
        name: group.groupName,
        required: Boolean(group.required),
        multiple: (group.maxSelection ?? 0) !== 1,
        options: group.toppings
          .filter((topping) => topping.isAvailable !== false)
          .map((topping) => ({ id: topping.id, name: topping.name, price: Number(topping.price) })),
      }));
    }
    const toppings = (detail.toppings || []).filter((topping) => topping.isAvailable !== false);
    if (!toppings.length) return [];
    return [{
      id: 1,
      name: 'Topping',
      multiple: true,
      options: toppings.map((topping) => ({ id: topping.id, name: topping.name, price: Number(topping.price) })),
    }];
  };

  const openCustomization = async (food: FoodItem) => {
    try {
      const response = await restaurantApi.getProductDetail(food.id);
      setCustomizingFood({ ...food, customizationGroups: mapCustomization(response.data) });
    } catch {
      setCustomizingFood({ ...food, customizationGroups: [] });
      message.warning('Không thể tải tùy chọn của món. Bạn vẫn có thể thêm món cơ bản.');
    }
  };

  const handleAddToCart = (food: FoodItem) => {
    if (!store) return;
    if (cartState.shopId && cartState.shopId !== Number(store.id)) {
      setPendingFood(food);
      setIsConflictOpen(true);
      return;
    }
    void openCustomization(food);
  };

  const handleConfirmReplace = () => {
    if (!pendingFood) return;
    setIsConflictOpen(false);
    void openCustomization(pendingFood);
    setPendingFood(null);
  };

  const confirmCustomization = (
    food: FoodItem,
    quantity: number,
    toppings: Array<{ id: number; name: string; price: number }>
  ) => {
    if (!store) return;
    const toppingKey = toppings.map((topping) => topping.id).sort((a, b) => a - b).join('-');
    dispatch(addToCart({
      id: `food-${food.id}-${toppingKey || 'base'}`,
      productId: Number(food.id),
      productName: food.name,
      price: food.price,
      quantity,
      imageUrl: food.imageUrl,
      shopId: Number(store.id),
      shopName: store.name,
      toppings,
    }));
    setCustomizingFood(null);
    message.success(`Đã thêm "${food.name}" vào giỏ hàng`);
  };

  if (loading) {
    return <Skeleton active paragraph={{ rows: 12 }} />;
  }
  if (error) return <Alert type="error" showIcon message={error} />;
  if (!store) return <Empty description="Không tìm thấy nhà hàng" />;

  return (
    <div className="space-y-6 pb-24">
      <StoreHeroBanner store={store} onViewReviews={() => setActiveTab('reviews')} />
      <div className="rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'menu' | 'reviews' | 'info')}
          items={[
            { key: 'menu', label: <span className="flex items-center gap-2 font-bold px-3 py-1"><AppstoreOutlined /> Thực đơn</span> },
            { key: 'reviews', label: <span className="flex items-center gap-2 font-bold px-3 py-1"><CommentOutlined /> Đánh giá</span> },
            { key: 'info', label: <span className="flex items-center gap-2 font-bold px-3 py-1"><InfoCircleOutlined /> Thông tin quán</span> },
          ]}
        />
      </div>
      {activeTab === 'menu' && (
        <div className="space-y-6">
          <StoreMenuCategories categories={categories} activeCategory={activeCategory} onSelectCategory={setActiveCategory} />
          {filteredFoods.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredFoods.map((food) => (
                <StoreFoodCard key={food.id} food={food} onAddToCart={handleAddToCart} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white py-12">
              <Empty description="Nhà hàng hiện chưa có món ăn" />
            </div>
          )}
        </div>
      )}
      {activeTab === 'reviews' && <StoreReviewSection shopId={store.id} shopName={store.name} rating={store.rating} reviewCount={store.reviewCount || 0} />}
      {activeTab === 'info' && (
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900">Về {store.name}</h2>
          <div className="grid grid-cols-1 gap-4 text-sm text-gray-600 sm:grid-cols-2">
            <div><strong className="mb-1 block text-gray-900">Địa chỉ quán:</strong>{store.address}</div>
            {store.openTime && store.closeTime && (
              <div><strong className="mb-1 block text-gray-900">Giờ mở cửa phục vụ:</strong>{store.openTime.slice(0, 5)} - {store.closeTime.slice(0, 5)}</div>
            )}
          </div>
        </div>
      )}
      <StoreCartDrawer totalQuantity={cartState.totalQuantity} totalAmount={cartState.totalAmount} />
      <FoodCustomizationModal
        food={customizingFood}
        open={Boolean(customizingFood)}
        onClose={() => setCustomizingFood(null)}
        onConfirm={confirmCustomization}
      />
      <RestaurantConflictModal
        isOpen={isConflictOpen}
        onClose={() => setIsConflictOpen(false)}
        onConfirmReplace={handleConfirmReplace}
        currentShopName={cartState.shopName || 'Quán hiện tại'}
        currentItemsCount={cartState.totalQuantity}
        currentTotal={cartState.totalAmount}
        newShopName={store.name}
        newDishName={pendingFood?.name}
        newDishPrice={pendingFood?.price}
        newImageUrl={pendingFood?.imageUrl}
      />
    </div>
  );
};

export default StoreDetailPage;
