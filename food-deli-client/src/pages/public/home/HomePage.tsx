import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  ArrowRight,
  ShoppingBag,
  Clock,
  Globe,
  UtensilsCrossed,
  Smile,
  Sparkles,
  Bell,
  Search,
  Navigation,
  Zap,
} from 'lucide-react';
import { APP_ROUTES } from '@/constants';

// Popular restaurants data
const POPULAR_CARDS = [
  {
    img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
    name: 'Bếp Của Mẹ - Cơm Nhà',
    fee: '15.000đ Phí giao hàng',
    time: '15 - 20 phút',
  },
  {
    img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop',
    name: 'Nhà Hàng Steakhouse & Wine',
    fee: '20.000đ Phí giao hàng',
    time: '20 - 25 phút',
  },
  {
    img: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800&auto=format&fit=crop',
    name: 'Bếp Trưởng Hải Sản',
    fee: '10.000đ Phí giao hàng',
    time: '10 - 15 phút',
  },
  {
    img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop',
    name: 'Quán Ăn Gia Đình Tịnh Tâm',
    fee: 'Miễn phí giao hàng',
    time: '10 - 20 phút',
  },
];

// How it works steps
const HOW_IT_WORKS_STEPS = [
  {
    icon: Globe,
    title: 'Đặt món qua Website',
    description: 'Truy cập trực tiếp trên trình duyệt web, tìm kiếm nhanh món ăn ưa thích và địa chỉ giao hàng.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Lựa chọn món ăn',
    description: 'Khám phá thực đơn đa dạng phong phú từ hàng ngàn nhà hàng uy tín hàng đầu.',
  },
  {
    icon: Smile,
    title: 'Thưởng thức món ăn!',
    description: 'Nhận món ăn nóng hổi được giao tận nơi nhanh chóng và tận hưởng hương vị tuyệt hảo.',
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-4 md:px-8 h-16 md:h-18 flex items-center justify-between">
          <Link to={APP_ROUTES.HOME} className="flex items-center gap-1.5">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-2xl font-black tracking-tighter text-slate-900">
              Thunder<span className="text-primary">Food</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.EXPLORE)}
            className="group flex items-center gap-2 rounded-full px-5 py-2.5 bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-hover transition-all"
          >
            Khám phá ngay
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative h-[420px] md:h-[480px] flex items-center justify-center">
        {/* Background Image with Dark Overlay */}
        <div
          className="absolute inset-0 z-0 bg-slate-900"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=2000&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        <div className="relative z-10 text-center w-full max-w-5xl px-4">
          <h1 className="text-3xl md:text-5xl font-normal text-white mb-8 tracking-wide leading-tight">
            Món ăn yêu thích, giao tận cửa nhà bạn
          </h1>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto bg-white rounded-full flex items-center shadow-xl overflow-hidden h-14">
            {/* Location Indicator */}
            <div className="flex items-center pl-6 pr-5 border-r border-slate-200 shrink-0 text-slate-700 font-medium text-sm md:text-base cursor-pointer">
              <MapPin className="text-primary w-5 h-5 mr-2 shrink-0" />
              <span>TP.HCM</span>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Nhập món ăn hoặc địa chỉ giao hàng..."
              className="flex-grow px-5 bg-transparent border-none focus:outline-none text-slate-800 text-sm md:text-base placeholder:text-slate-400"
            />

            {/* Search Button */}
            <button
              onClick={() => navigate(APP_ROUTES.EXPLORE)}
              className="h-full px-8 bg-primary hover:bg-primary-hover text-white font-medium text-base flex items-center justify-center transition-colors shrink-0 rounded-r-full"
            >
              Tìm kiếm
            </button>
          </div>
        </div>
      </section>

      {/* ─── ABOUT SECTION ─── */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-20 lg:gap-28">
          {/* Left: Blob image */}
          <div className="w-full md:w-1/2 flex justify-center relative">
            <div
              className="absolute -inset-4 border border-primary/30 z-0 pointer-events-none"
              style={{ borderRadius: '43% 57% 70% 30% / 44% 39% 61% 56%' }}
            ></div>
            <div
              className="relative z-10 overflow-hidden w-72 h-72 md:w-96 md:h-96 shadow-xl"
              style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
            >
              <img
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop"
                alt="Delicious food"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right: Text */}
          <div className="w-full md:w-1/2 flex flex-col items-start text-left">
            <h2 className="text-3xl md:text-4xl font-normal text-slate-900 leading-tight mb-6 tracking-tight">
              Hãy thưởng thức và <br /> tham gia cùng chúng tôi. <br /> Cuộc sống là những hương vị
              bất tận.
            </h2>

            <p className="text-slate-500 text-sm md:text-base mb-8 leading-relaxed max-w-md">
              Trong mắt một nghệ sĩ thực thụ, nghệ thuật là điều cơ bản khó có thể diễn đạt bằng lời.
              Luôn có điều gì đó thiêng liêng về nghệ thuật nấu nướng. Hãy để ThunderFood mang đến
              cho bạn những trải nghiệm tuyệt vời nhất.
            </p>

            <button
              onClick={() => navigate(APP_ROUTES.EXPLORE)}
              className="group flex items-center gap-2 rounded-full px-8 py-3.5 bg-primary text-white font-medium text-base shadow-md hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <span>Khám Phá Ngay</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── POPULAR FOODS SECTION ─── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-row justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Phổ biến tại khu vực của bạn
            </h2>
            <Link
              to={APP_ROUTES.EXPLORE}
              className="group text-base font-bold text-slate-900 hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Asymmetric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Large Card */}
            <div className="md:col-span-1 flex flex-col group cursor-pointer">
              <div className="w-full h-72 md:h-[500px] rounded-3xl overflow-hidden bg-slate-100 shadow-sm group-hover:shadow-xl transition-all duration-300">
                <img
                  src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800&auto=format&fit=crop"
                  alt="Nhà hàng 5 sao"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="pt-3.5 px-1">
                <h3 className="text-base md:text-lg font-bold text-slate-900 group-hover:text-primary transition-colors mb-1.5">
                  Nhà Hàng Đẳng Cấp 5 Sao
                </h3>
                <div className="flex items-center gap-4 text-xs md:text-sm text-slate-500 font-medium">
                  <div className="flex items-center">
                    <ShoppingBag className="w-4 h-4 mr-1 text-slate-400" />
                    <span>25.000đ Phí giao hàng</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-slate-400" />
                    <span>30 - 45 phút</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 2x2 Grid */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
              {POPULAR_CARDS.map((card, idx) => (
                <div key={idx} className="flex flex-col group cursor-pointer">
                  <div className="w-full h-48 md:h-52 rounded-3xl overflow-hidden bg-slate-100 shadow-sm group-hover:shadow-xl transition-all duration-300">
                    <img
                      src={card.img}
                      alt={card.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="pt-3.5 px-1">
                    <h3 className="text-base md:text-lg font-bold text-slate-900 group-hover:text-primary transition-colors mb-1.5">
                      {card.name}
                    </h3>
                    <div className="flex items-center gap-4 text-xs md:text-sm text-slate-500 font-medium">
                      <div className="flex items-center">
                        <ShoppingBag className="w-4 h-4 mr-1 text-slate-400" />
                        <span>{card.fee}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-slate-400" />
                        <span>{card.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS SECTION ─── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-normal text-center text-slate-900 mb-16 tracking-tight">
            Cách thức hoạt động
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 md:p-10 flex flex-col items-center text-center shadow-sm border border-slate-100/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                  <div
                    className="absolute inset-0 bg-rose-100 group-hover:scale-110 transition-transform duration-300 opacity-80"
                    style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
                  />
                  <step.icon className="relative z-10 w-9 h-9 text-primary" />
                </div>
                <h3 className="text-primary font-bold text-lg mb-3 tracking-tight">{step.title}</h3>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── APP DOWNLOAD / FUTURE SECTION ─── */}
      <section className="py-12 md:py-16 bg-white overflow-hidden">
        <div className="container mx-auto px-4 md:px-8">
          <div className="bg-slate-900 rounded-[2.5rem] px-8 py-10 md:px-16 md:py-12 relative flex flex-col md:flex-row items-center justify-between overflow-hidden shadow-2xl">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-rose-500/20 rounded-full blur-3xl" />

            {/* Left Side */}
            <div className="relative z-10 w-full md:w-1/2 mb-10 md:mb-0 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/20 text-rose-300 border border-primary/40 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Định Hướng Tương Lai • Mobile App</span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
                Mở rộng hệ sinh thái <br /> với ứng dụng Di Động
              </h2>

              <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-7 max-w-md mx-auto md:mx-0">
                ThunderFood hướng tới ra mắt ứng dụng di động hỗ trợ bản đồ thời gian thực (Google
                Maps GPS Tracking), giúp bạn theo dõi từng bước di chuyển của tài xế và nhận thông
                báo món ăn nóng hổi ngay lập tức.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button className="flex items-center justify-center bg-primary hover:bg-primary-hover text-white rounded-full px-7 py-3.5 font-bold transition-all shadow-lg hover:shadow-primary/30 active:scale-95 cursor-pointer">
                  <Bell className="mr-2 h-5 w-5" />
                  Nhận thông báo khi ra mắt
                </button>
              </div>
            </div>

            {/* Right Side: Phone Mockup */}
            <div className="relative z-10 w-full md:w-5/12 flex justify-center">
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-2 bg-linear-to-r from-primary to-rose-500 rounded-[3.2rem] blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Phone Frame */}
                <div className="relative w-60 md:w-64 h-[400px] bg-slate-950 rounded-[2.5rem] border-[9px] border-slate-700 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/20 overflow-hidden flex flex-col justify-between transform rotate-2 group-hover:rotate-0 transition-transform duration-500">
                  {/* Dynamic Island */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-20 h-4 bg-black rounded-full" />

                  {/* App UI */}
                  <div className="w-full h-full bg-slate-900 text-white pt-8 px-3.5 pb-3 flex flex-col justify-between overflow-hidden select-none">
                    <div>
                      <div className="flex justify-between items-center mb-2.5">
                        <div>
                          <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider">
                            ThunderFood App
                          </span>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1">
                            <span>TP.HCM</span>
                            <MapPin className="w-3 h-3 text-primary" />
                          </h4>
                        </div>
                        <div className="w-6 h-6 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-bold text-primary">
                          TF
                        </div>
                      </div>

                      {/* Mini Search */}
                      <div className="bg-slate-800/90 rounded-xl px-2.5 py-1.5 flex items-center gap-2 mb-3 border border-slate-700/50">
                        <Search className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] text-slate-400">Tìm kiếm món ăn...</span>
                      </div>

                      {/* Active Order */}
                      <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/50 mb-2">
                        <div className="h-24 rounded-lg overflow-hidden relative mb-1.5">
                          <img
                            src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop"
                            alt="Order"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                            Đang giao
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-[11px] font-bold text-white">Burger Bò Phô Mai</div>
                            <div className="text-[9px] text-slate-400">ThunderFood Express</div>
                          </div>
                          <span className="text-[11px] font-bold text-rose-400">69.000đ</span>
                        </div>
                      </div>
                    </div>

                    {/* Live Tracking */}
                    <div className="bg-linear-to-r from-rose-900/90 to-primary/90 rounded-xl p-2.5 shadow-lg border border-rose-500/30">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-white shrink-0">
                          <Navigation className="w-3.5 h-3.5 animate-pulse" />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-white">Tài xế đang đến</div>
                          <div className="text-[9px] text-rose-100 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Dự kiến: 12 phút (1.2 km)</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-black/30 h-1 rounded-full overflow-hidden">
                        <div className="bg-white h-full w-3/4 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LANDING FOOTER ─── */}
      <footer className="bg-slate-50 border-t border-slate-100 pt-16 pb-12">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <Link to="/" className="text-2xl font-black text-primary tracking-tight">
                ThunderFood
              </Link>
              <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                Nền tảng giao đồ ăn nhanh chóng, tươi ngon và đáng tin cậy hàng đầu cho trải nghiệm ẩm
                thực hoàn hảo.
              </p>
            </div>

            <div>
              <h4 className="text-slate-900 font-bold text-sm mb-4">Về ThunderFood</h4>
              <ul className="space-y-2.5 text-sm text-slate-500 font-medium">
                <li><a href="#" className="hover:text-primary transition-colors">Giới thiệu</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Tuyển dụng</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Tin tức & Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-900 font-bold text-sm mb-4">Dịch vụ</h4>
              <ul className="space-y-2.5 text-sm text-slate-500 font-medium">
                <li><Link to={APP_ROUTES.EXPLORE} className="hover:text-primary transition-colors">Đặt món trực tuyến</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Dành cho Nhà hàng</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Dành cho Tài xế</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-900 font-bold text-sm mb-4">Hỗ trợ & Pháp lý</h4>
              <ul className="space-y-2.5 text-sm text-slate-500 font-medium">
                <li><a href="#" className="hover:text-primary transition-colors">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Điều khoản dịch vụ</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Chính sách bảo mật</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
            <p>© {new Date().getFullYear()} ThunderFood Inc. — Nhóm 06 CNTT1 OJT 2026. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span>Tiếng Việt (VN)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
