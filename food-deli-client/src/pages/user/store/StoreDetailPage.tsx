import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { message, Tabs, Empty } from 'antd';
import {
  AppstoreOutlined,
  CommentOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { addToCart } from '@/store/slices/cartSlice';
import { RestaurantConflictModal } from '../components/RestaurantConflictModal';
import {
  StoreHeroBanner,
  StoreMenuCategories,
  StoreFoodCard,
  StoreCartDrawer,

} from './components';
import { StoreReviewSection } from '../store-review';
import type { FoodItem, StoreDetail } from './types';

const MOCK_STORE: StoreDetail = {
  id: 1,
  name: 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi',
  address: '179 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM',
  phone: '0901 234 567',
  rating: 4.8,
  reviewCount: 384,
  openTime: '06:30',
  closeTime: '22:00',
  deliveryTime: '20-25 phút',
  distance: '1.8 km',
  shippingFee: 18000,
  coverImageUrl:
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDtI9tgPIgrm-jlcBCOaQAdaZ7uax_nnOj6tO8i1dYg7PnGakOqGrYE11BQLqno_E3a0zIB2trQQaGZ1xZQGk8q0pMejdEeU3b91-1oI_WTgvdmO_TBfDjBBSyqur1brI9LWBd1u5LA2JfUZk9fsfZkNm9oQIUuKkDnqw3uRNfTKaH3tgk6vNG7WLPAGvfUAMXDozN5k06cZiaqPv-FFhquwDPS3Cxh5O41h3ktfYk9t2uAA105WwGhGA',
  tags: ['Cơm tấm', 'Sườn nướng', 'Món Việt', 'Ăn trưa'],
  isVerified: true,
};

const MOCK_FOODS: FoodItem[] = [
  {
    id: 101,
    name: 'Cơm Tấm Sườn Bì Chả Đặc Biệt',
    price: 87000,
    originalPrice: 95000,
    description: 'Sườn cốt lết nướng than hoa thơm lừng, bì giòn dai, chả trứng hấp mềm mịn, mỡ hành tép mỡ thơm ngậy.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAIqfTI5s8Q8ASaoe0eenWqww4cUBT5Qndph9kSGOPYbs1F1lc3YSgyIp98tLIRpxAgVziH2jroEu4J3Lm7sSxvt_ZYhlJ-5cAO7yFUGC0B-zfUsVSOEQJgLrBcPS-2JM4UJWXfKrWnqYhSgqDZ0SKVb1PkH5MqQFKI-umi-MtJpVS2KNDAzQWnfvmP968_J5KRwMh_yLu3icf_iU7IHTDx3wnoXLLF2CLwt08eOsO6uO1-Vu4Km2lyEg',
    category: 'Cơm Tấm',
    isPopular: true,
    soldCount: 1240,

  },
  {
    id: 102,
    name: 'Cơm Tấm Sườn Cốt Lết Nướng',
    price: 65000,
    description: 'Miếng sườn ướp sốt bí truyền nướng đều tay, da giòn thịt ngọt nước xì xụp.',
    imageUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    category: 'Cơm Tấm',
    soldCount: 890,
  },
  {
    id: 103,
    name: 'Canh Khổ Qua Nhồi Thịt',
    price: 35000,
    description: 'Canh thanh mát, khổ qua giòn nhẹ nhồi thịt bằm mộc nhĩ ngọt nước dùng.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD5xddBWdavFNppRvgJfZ-98sSI-55_jOOTZ78Qypan6fiv63Malq-00eOk0ly36_G0fH7UuQbgBjaEijPgHIbCMNa57oRbWN8ELerPyOl-5ZtOn02rkIIaFPKLIuX-bbdIh51ICzw7yby5ewLv35H3_pFwpatAvydIXHcgyTtU3cn7vYgJsz2OOnAf7JbL8x-Irk3JkkVZOCF1TOL8TsCgRLcZG_WLb0ULMgL1dsj1Pqq9UiL5EfI59w',
    category: 'Món Canh',
    isPopular: true,
    soldCount: 512,
  },
  {
    id: 104,
    name: 'Canh Rong Biển Thịt Bằm',
    price: 25000,
    description: 'Rong biển Hàn Quốc nấu cùng thịt bằm tươi và đậu hũ non.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAiCUfFW0oIdlsdc6LxoZcF3edvStw0IbxcMFrWXOIGuBEFMWW1fjfOtgAIeO8amdHOF_Iqav19ci6H9bMDTgaRi-y6thcbrrdi8j576QmRBn6yEds_3fdwpxCNSGKIY9oLcgofaUVbTJ2h-JIZqb6ZVwHF6OvMxZdx7_8LqCesGMwoxR5Ls7OP4RqVwCciFVDsXVBw0nJCMmBq3VsuR6uCH13dSydqqrspPMgcz3YnuA9xSYtM8n4nJw',
    category: 'Món Canh',
    soldCount: 310,
  },
  {
    id: 105,
    name: 'Trà Tắc Xí Muội Khổng Lồ',
    price: 25000,
    description: 'Tắc tươi nguyên chất kết hợp xí muội mặn ngọt chua sảng khoái.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCtdW3utsF1II3NyfRaQbJ4PCJ1N_IIX1n6T3Idti3hHUbMj8r9J8C0j1BHIlAwTtA8wZxkcjJBkTLUSHMJuEDUCC2VpLRfpL8-E_ljpLGxa9sPki6e8NjNHXkMvZdBNtXNdRmgAN0hKX_Ooo-1hZtBQBexu6fdcTEZQjG317qYrBr3M1oB_CwlCNtQ2UdMy1VtkPue4bj7_wl_WxJm0yFDSxErzlcXS5eJPaQL4FS5tBY5d10FjFdQYw',
    category: 'Đồ Uống',
    isPopular: true,
    soldCount: 1450,
  },
  {
    id: 106,
    name: 'Trà Đào Cam Sả',
    price: 28000,
    description: 'Trà đen thơm thanh đào giòn giòn cùng hương sả cam ấm nồng giải nhiệt.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCYTOCsQhWpehtSfIaVBg--khW253SrSOhmMUZ9XtiQrCxyE3ikSDxd6S0ssIdrg14C8QZ5hO-SfGCYyrNXoKjo5nlOf6w4gqefYMSdF8EJ3G_xclpZ0tCqyxizipN0QaEtIM2N6YrUXrRXqinCvoRLGI62-BUWnEunIMFDXQWo8MH6es4xtnr1tOkrQxSTMw9iv4ijB75wOCheTw4cBaX_yL0GEgQmdDkn1g2YY5RnYYU0L0hfOtEQug',
    category: 'Đồ Uống',
    isNew: true,
    soldCount: 420,
  },
  {
    id: 107,
    name: 'Chả Trứng Hấp Thêm',
    price: 15000,
    description: 'Phần chả trứng hấp vàng ươm thêm vào phần ăn.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDiE6DtiK6elJx982NJFnl4-Qr1AvO2VT9kdfo9DDSTF99sswTRpIzud6brNhpbijnbmzvj9ndtgL50KytKZ8pdWOZ9vgtFh0NJNA-6daJ2hc8KKizP6wBTvlotae7G6mxkfbu3pIYKTvR-MA5lhHe8Wk8bkFJri1iNzXV2zNRY2ETiqWF-KYkYHWwDx052D2-f-LbbcBRHRoq45qEh_S10Mk7_4AcYSBa4Gc6tiH_IlW70ieTsdwWB7Q',
    category: 'Món Thêm',
    soldCount: 780,
  },
  {
    id: 108,
    name: 'Trứng Ốp La Lòng Đào',
    price: 8000,
    description: 'Trứng gà ta chiên ốp la lòng đào béo ngậy.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC9Q0wNnf-PiEQvQAIOHJ28yRQ_uj_eHz6LpBEz8l7tvprOBT-mzXDOr5pqFndvgWKuKSMi-oUsv_QqJBuB-A1dzL0Rjxd4gxMKSemll0zJnRjWDs6Ygf7R8sxa3Dx_r7DLc1v7oCQDAD48-JRINkYJS-wreV-jHyL6RqEBoccVmeAQrR1KpsvKcFfUaMvGW5en2c9zhCrQP83Jm60mgYk7BtJfm4SFzpnuPqosBmq7utSbJ6OKjU_Spw',
    category: 'Món Thêm',
    soldCount: 990,
  },
];

const CATEGORIES = ['Tất cả', 'Cơm Tấm', 'Món Canh', 'Đồ Uống', 'Món Thêm'];

export const StoreDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const cartState = useAppSelector((state) => state.cart);

  const [activeTab, setActiveTab] = useState<'menu' | 'reviews' | 'info'>('menu');
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');
  const [pendingFood, setPendingFood] = useState<FoodItem | null>(null);
  const [isConflictOpen, setIsConflictOpen] = useState(false);


  // Store data with dynamic ID support
  const store: StoreDetail = useMemo(
    () => ({
      ...MOCK_STORE,
      id: id || MOCK_STORE.id,
    }),
    [id]
  );

  const filteredFoods = useMemo(() => {
    if (activeCategory === 'Tất cả') return MOCK_FOODS;
    return MOCK_FOODS.filter((f) => f.category === activeCategory);
  }, [activeCategory]);

  const handleAddToCart = (food: FoodItem) => {
  };

  const handleConfirmReplaceCart = () => {
    if (!pendingFood) return;

    message.success(`Đã tạo giỏ hàng mới tại "${store.name}"!`);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Hero Banner */}
      <StoreHeroBanner
        store={store}
        onViewReviews={() => setActiveTab('reviews')}
      />

      {/* 2. Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-gray-100">
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as any)}
          items={[
            {
              key: 'menu',
              label: (
                <span className="flex items-center gap-2 font-bold px-3 py-1">
                  <AppstoreOutlined /> Thực đơn
                </span>
              ),
            },
            {
              key: 'reviews',
              label: (
                <span className="flex items-center gap-2 font-bold px-3 py-1">
                  <CommentOutlined /> Đánh giá ({store.reviewCount})
                </span>
              ),
            },
            {
              key: 'info',
              label: (
                <span className="flex items-center gap-2 font-bold px-3 py-1">
                  <InfoCircleOutlined /> Thông tin quán
                </span>
              ),
            },
          ]}
        />
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* Categories Bar */}
          <StoreMenuCategories
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
          />

          {/* Food Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFoods.map((food) => (
              <StoreFoodCard
                key={food.id}
                food={food}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          {filteredFoods.length === 0 && (
            <div className="py-12 bg-white rounded-2xl border border-gray-100 text-center">
              <Empty description="Không tìm thấy món ăn trong danh mục này" />
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <StoreReviewSection shopId={store.id} shopName={store.name} rating={store.rating} reviewCount={store.reviewCount} />
      )}

      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-100 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Về {store.name}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Thương hiệu cơm tấm nổi tiếng với hương vị sườn nướng đậm đà chuẩn vị Sài Gòn.
            Toàn bộ nguồn nguyên liệu được chọn lọc tươi mới mỗi ngày, đạt tiêu chuẩn an toàn
            vệ sinh thực phẩm nghiêm ngặt của Thunder Food.
          </p>
          <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong className="text-gray-900 block mb-1">Địa chỉ quán:</strong>
              {store.address}
            </div>
            <div>
              <strong className="text-gray-900 block mb-1">Giờ mở cửa phục vụ:</strong>
              {store.openTime} - {store.closeTime} hàng ngày
            </div>
          </div>
        </div>
      )}

      {/* 4. Floating Cart Drawer */}
      <StoreCartDrawer
        totalQuantity={cartState.totalQuantity}
        totalAmount={cartState.totalAmount}
      />

      {/* 5. Restaurant Conflict Modal */}
      <RestaurantConflictModal
        isOpen={isConflictOpen}
        onClose={() => setIsConflictOpen(false)}
        onConfirmReplace={handleConfirmReplaceCart}
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
