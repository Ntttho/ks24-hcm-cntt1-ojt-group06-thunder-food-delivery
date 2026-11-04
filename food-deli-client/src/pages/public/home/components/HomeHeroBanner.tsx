import React from 'react';
import { Input, Button, Tag } from 'antd';
import {
  ThunderboltFilled,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  FireOutlined,
} from '@ant-design/icons';

interface HomeHeroBannerProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const HomeHeroBanner: React.FC<HomeHeroBannerProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  return (
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
            onChange={(e) => onSearchChange(e.target.value)}
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
  );
};

export default HomeHeroBanner;

