import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button, Card, Tag, Row, Col, message } from 'antd';
import {
  ThunderboltFilled,
  FireOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  StarFilled,
  PlusOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { addToCart } from '@/store/slices/cartSlice';
import { formatCurrency } from '@/utils/formatters';

// Mock featured foods for demonstration of base setup
const FEATURED_ITEMS = [
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

const RESTAURANTS = [
  {
    id: 1,
    name: 'Cơm Tấm Sà Bì Chưởng',
    cuisine: 'Cơm tấm',
    rating: 4.8,
    deliveryTime: '20-25 phút',
    address: 'Nguyễn Trãi, Quận 1',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    name: 'The Alley Tea House',
    cuisine: 'Trà sữa',
    rating: 4.9,
    deliveryTime: '15-20 phút',
    address: 'Hai Bà Trưng, Quận 1',
    imageUrl: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    name: 'Bún Bò Huế O Mai',
    cuisine: 'Bún - Phở',
    rating: 4.7,
    deliveryTime: '25-30 phút',
    address: 'Lê Văn Sỹ, Quận 3',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 4,
    name: 'Thunder Burger & Fries',
    cuisine: 'Đồ Tây',
    rating: 4.9,
    deliveryTime: '15-20 phút',
    address: 'Điện Biên Phủ, Bình Thạnh',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
  },
];

const CUISINES = ['Tất cả', ...Array.from(new Set(RESTAURANTS.map((restaurant) => restaurant.cuisine)))];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('Tất cả');

  const filteredRestaurants = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return RESTAURANTS.filter((restaurant) => {
      const matchesCuisine = selectedCuisine === 'Tất cả' || restaurant.cuisine === selectedCuisine;
      const matchesKeyword = !keyword ||
        restaurant.name.toLowerCase().includes(keyword) ||
        restaurant.cuisine.toLowerCase().includes(keyword) ||
        restaurant.address.toLowerCase().includes(keyword);
      return matchesCuisine && matchesKeyword;
    });
  }, [searchTerm, selectedCuisine]);

  const handleQuickAdd = (item: (typeof FEATURED_ITEMS)[0], e: React.MouseEvent) => {
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
      {/* Hero Banner Section */}
      <section className="relative min-h-[420px] overflow-hidden rounded-3xl bg-linear-to-br from-orange-600 via-orange-500 to-amber-400 text-white p-6 sm:p-10 lg:p-12 shadow-xl shadow-orange-500/20">
        <div className="absolute inset-y-0 right-0 hidden w-[52%] md:block">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-600/30 to-transparent z-10" />
          <img
            src="https://images.unsplash.com/photo-1547592180-85f173990554?w=1000&auto=format&fit=crop&q=90"
            alt="Các món ăn hấp dẫn"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-orange-950/35 via-transparent to-white/10" />
        </div>
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-sm md:hidden" />

        <div className="relative z-20 max-w-2xl space-y-4">
          <Tag color="gold" className="font-bold text-xs uppercase px-3 py-1 rounded-full border-none">
            <ThunderboltFilled className="mr-1" /> Giao hàng siêu tốc trong 20 phút
          </Tag>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Thưởng Thức Món Ngon Nóng Hổi Giao Tận Nơi
          </h1>
          <p className="text-orange-100 text-base sm:text-lg">
            Hàng ngàn món ăn hấp dẫn từ các nhà hàng nổi tiếng, ưu đãi freeship và tích điểm độc quyền trên Thunder Food Delivery.
          </p>

          {/* Search Box */}
          <div className="pt-2">
            <Input.Search
              size="large"
              placeholder="Bạn muốn ăn gì hôm nay? (cơm gà, trà sữa, bún bò...)"
              enterButton={
                <Button type="primary" className="bg-gray-900 hover:bg-black font-semibold border-none h-full">
                  Tìm kiếm
                </Button>
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xl shadow-lg rounded-xl overflow-hidden"
            />
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-20 mt-8 pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md">
              <ClockCircleOutlined className="text-xl" />
            </div>
            <div>
              <div className="font-bold text-sm">Giao Hàng Siêu Tốc</div>
              <div className="text-xs text-orange-100">Đảm bảo đồ ăn luôn nóng sốt</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md">
              <SafetyCertificateOutlined className="text-xl" />
            </div>
            <div>
              <div className="font-bold text-sm">Chất Lượng Vệ Sinh</div>
              <div className="text-xs text-orange-100">100% đối tác được kiểm định</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md">
              <FireOutlined className="text-xl" />
            </div>
            <div>
              <div className="font-bold text-sm">Ưu Đãi Mỗi Ngày</div>
              <div className="text-xs text-orange-100">Voucher giảm tới 50%</div>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant Directory */}
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Nhà hàng gần bạn</h2>
          <p className="mt-1 text-sm text-gray-500">Tìm quán phù hợp theo loại ẩm thực hoặc tên nhà hàng</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {CUISINES.map((cuisine) => (
            <Button
              key={cuisine}
              type={selectedCuisine === cuisine ? 'primary' : 'default'}
              shape="round"
              className={selectedCuisine === cuisine ? 'border-orange-500 bg-orange-500' : ''}
              onClick={() => setSelectedCuisine(cuisine)}
            >
              {cuisine}
            </Button>
          ))}
        </div>

        <Row gutter={[20, 20]}>
          {filteredRestaurants.map((restaurant) => (
            <Col key={restaurant.id} xs={24} sm={12} lg={6}>
              <Card
                hoverable
                onClick={() => navigate(`/restaurants/${restaurant.id}`)}
                cover={
                  <img
                    alt={restaurant.name}
                    src={restaurant.imageUrl}
                    className="h-44 w-full object-cover"
                  />
                }
                className="h-full overflow-hidden rounded-2xl border border-gray-100"
                bodyStyle={{ padding: 16 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-gray-900">{restaurant.name}</h3>
                    <p className="mt-1 text-xs text-gray-500">{restaurant.cuisine} · {restaurant.address}</p>
                  </div>
                  <Tag color="gold" className="m-0 border-none"><StarFilled /> {restaurant.rating}</Tag>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-gray-500">
                  <ClockCircleOutlined /> {restaurant.deliveryTime}
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {filteredRestaurants.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white py-10 text-center text-gray-500">
            Không tìm thấy nhà hàng phù hợp.
          </div>
        )}
      </section>

      {/* Featured Items Grid */}
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
          {FEATURED_ITEMS.map((item) => (
            <Col key={item.id} xs={24} sm={12} lg={6}>
              <Card
                hoverable
                onClick={() => navigate(`/restaurants/${item.shopId}`)}
                cover={
                  <div className="relative h-52 w-full overflow-hidden cursor-pointer group bg-gray-100">
                    <img
                      alt={item.productName}
                      src={item.imageUrl}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
                    <div className="absolute top-3 left-3 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-gray-800 shadow-md flex items-center gap-1.5">
                      <StarFilled className="text-amber-500" />
                      <span>{item.rating}</span>
                      <span className="font-normal text-gray-400">({item.reviewsCount})</span>
                    </div>
                  </div>
                }
                className="food-feature-card rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between h-full cursor-pointer"
                bodyStyle={{ padding: 16 }}
              >
                <div>
                  <div className="text-xs font-medium text-orange-600 mb-1 flex items-center gap-1">
                    <ShopOutlined /> {item.shopName}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base line-clamp-1">{item.productName}</h3>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                    <ClockCircleOutlined /> {item.prepTime}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div className="font-extrabold text-orange-600 text-lg">
                    {formatCurrency(item.price)}
                  </div>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="bg-orange-500 hover:bg-orange-600 shadow-sm rounded-xl font-bold px-3"
                    onClick={(e) => handleQuickAdd(item, e)}
                  >
                    <span className="hidden sm:inline">Thêm</span>
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </div>
  );
};
