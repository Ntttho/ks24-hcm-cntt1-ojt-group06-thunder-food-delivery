import React, { useEffect, useState } from 'react';
import { Input, Button, Tag } from 'antd';
import {
  ThunderboltFilled,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { bannerApi, type BannerItem } from '@/services/modules/bannerApi';

interface HomeHeroBannerProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const HomeHeroBanner: React.FC<HomeHeroBannerProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const response = await bannerApi.getActiveBanners();
        setBanners(response.data || []);
      } catch (error) {
        console.warn('Banner load failed:', error);
      }
    };

    void loadBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [banners]);

  const activeBanner = banners[activeIndex] || null;

  return (
    <section className="relative min-h-[420px] overflow-hidden rounded-3xl bg-linear-to-br from-orange-600 via-orange-500 to-amber-400 text-white p-6 shadow-xl shadow-orange-500/20 sm:p-10 lg:p-12">
      {activeBanner ? (
        <>
          <div className="absolute inset-0">
            <img
              src={activeBanner.imageUrl}
              alt={activeBanner.title}
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.src =
                  'https://images.unsplash.com/photo-1547592180-85f173990554?w=1000&auto=format&fit=crop&q=90';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-950/75 via-orange-800/45 to-transparent" />
          </div>
          <div className="relative z-10 flex h-full flex-col justify-between gap-6">
            <div className="max-w-2xl space-y-4">
              <Tag color="gold" className="font-bold text-xs uppercase px-3 py-1 rounded-full border-none">
                <ThunderboltFilled className="mr-1" /> Giao hàng siêu tốc trong 20 phút
              </Tag>
              <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-white sm:text-5xl">
                {activeBanner.title}
              </h1>
              <p className="max-w-xl text-base text-orange-100 sm:text-lg">
                Hàng ngàn món ăn hấp dẫn từ các nhà hàng nổi tiếng, ưu đãi freeship và tích điểm độc quyền trên Thunder Food Delivery.
              </p>

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

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {banners.map((banner, index) => (
                <button
                  key={banner.id}
                  type="button"
                  aria-label={`Chọn banner ${banner.title}`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeIndex ? 'w-10 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
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

          <div className="relative z-20 mt-8 grid grid-cols-1 gap-4 border-t border-white/20 pt-6 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-md">
                <ClockCircleOutlined className="text-xl" />
              </div>
              <div>
                <div className="font-bold text-sm">Giao Hàng Siêu Tốc</div>
                <div className="text-xs text-orange-100">Đảm bảo đồ ăn luôn nóng sốt</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-md">
                <SafetyCertificateOutlined className="text-xl" />
              </div>
              <div>
                <div className="font-bold text-sm">Chất Lượng Vệ Sinh</div>
                <div className="text-xs text-orange-100">100% đối tác được kiểm định</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-md">
                <FireOutlined className="text-xl" />
              </div>
              <div>
                <div className="font-bold text-sm">Ưu Đãi Mỗi Ngày</div>
                <div className="text-xs text-orange-100">Voucher giảm tới 50%</div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default HomeHeroBanner;

