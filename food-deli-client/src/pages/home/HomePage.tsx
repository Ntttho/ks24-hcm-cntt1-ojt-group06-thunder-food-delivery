import React, { useState } from 'react';
import { Input, Button, Card, Tag, Typography, Row, Col, Space } from 'antd';
import {
  SearchOutlined,
  ThunderboltFilled,
  FireOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  StarFilled,
  PlusOutlined,
} from '@ant-design/icons';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { addToCart } from '@/store/slices/cartSlice';
import { formatCurrency } from '@/utils/formatters';
import { message } from 'antd';

const { Title, Text, Paragraph } = Typography;

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

export const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState('');

  const handleQuickAdd = (item: typeof FEATURED_ITEMS[0]) => {
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
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-r from-orange-600 via-orange-500 to-amber-500 text-white p-8 sm:p-12 shadow-xl shadow-orange-500/15">
        <div className="relative z-10 max-w-2xl space-y-4">
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
        <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Featured Items Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <FireOutlined className="text-orange-500" /> Món Ăn Bán Chạy Nhất
            </h2>
            <p className="text-gray-500 text-sm">Các món ngon được đặt nhiều nhất tuần này</p>
          </div>
          <Button type="link" className="font-semibold text-orange-600 hover:text-orange-700">
            Xem tất cả &rarr;
          </Button>
        </div>

        <Row gutter={[20, 20]}>
          {FEATURED_ITEMS.map((item) => (
            <Col key={item.id} xs={24} sm={12} lg={6}>
              <Card
                hoverable
                cover={
                  <div className="relative h-48 w-full overflow-hidden">
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
                className="rounded-2xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between h-full"
                bodyStyle={{ padding: 16 }}
              >
                <div>
                  <div className="text-xs font-medium text-orange-600 mb-1">{item.shopName}</div>
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
                    onClick={() => handleQuickAdd(item)}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </div>
  );
};
