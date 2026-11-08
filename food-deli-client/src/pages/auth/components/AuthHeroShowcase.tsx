import React from 'react';
import { ThunderboltFilled, StarFilled } from '@ant-design/icons';

export const AuthHeroShowcase: React.FC = () => {
  return (
    <div className="relative h-full w-full bg-linear-to-br from-orange-600 via-amber-600 to-rose-600 p-8 lg:p-12 text-white flex flex-col justify-between overflow-hidden">
      {/* Background Ambient Glows & Vector Art */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

      {/* Brand Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
            <ThunderboltFilled className="text-2xl text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none text-white">
              THUNDER <span className="text-amber-300">FOOD</span>
            </h1>
            <span className="text-[10px] tracking-widest uppercase text-orange-200 font-semibold">
              Fast Delivery Ecosystem
            </span>
          </div>
        </div>
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 backdrop-blur-md text-xs font-medium border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Hệ thống hoạt động 24/7</span>
        </div>
      </div>

      {/* Main Promotional Feature Card */}
      <div className="relative z-10 my-auto py-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold mb-4 border border-white/20">
          <StarFilled className="text-amber-300" />
          <span>Nền tảng giao đồ ăn tốc độ hàng đầu</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight mb-4">
          Thưởng thức món ngon{' '}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-200 via-yellow-100 to-white">
            nóng hổi tận cửa
          </span>{' '}
          chỉ trong nháy mắt.
        </h2>

        <p className="text-orange-100 text-sm leading-relaxed max-w-md mb-8">
          Kết nối liền mạch hàng triệu thực khách yêu ẩm thực với hơn 15,000+ nhà hàng
          chất lượng cao và mạng lưới tài xế đối tác tận tâm.
        </p>

        {/* Floating Interactive Stat Pills */}
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
            <div className="text-2xl font-black text-amber-300">15 Phút</div>
            <div className="text-xs text-orange-100 font-medium mt-0.5">Thời gian giao trung bình</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
            <div className="text-2xl font-black text-white">4.9 / 5.0</div>
            <div className="text-xs text-orange-100 font-medium mt-0.5">Đánh giá từ 1M+ thực khách</div>
          </div>
        </div>
      </div>

      {/* Social Trust & Testimonial Footer */}
      <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-orange-100">
        <div className="flex items-center -space-x-2">
          <div className="w-8 h-8 rounded-full border-2 border-orange-600 bg-amber-200 flex items-center justify-center font-bold text-orange-900 text-xs shadow-md">
            L
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-orange-600 bg-teal-200 flex items-center justify-center font-bold text-teal-900 text-xs shadow-md">
            M
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-orange-600 bg-rose-200 flex items-center justify-center font-bold text-rose-900 text-xs shadow-md">
            K
          </div>
          <div className="pl-3 text-xs font-medium text-white">
            Đã đồng hành cùng 50,000+ tài xế & chủ quán
          </div>
        </div>
        <div className="text-[11px] opacity-75">
          © 2026 Thunder Food Inc.
        </div>
      </div>
    </div>
  );
};

export default AuthHeroShowcase;

