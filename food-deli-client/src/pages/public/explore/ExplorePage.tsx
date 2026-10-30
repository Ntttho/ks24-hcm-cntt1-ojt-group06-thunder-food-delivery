import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Search, ShoppingBag, Star, UtensilsCrossed } from 'lucide-react';
import { APP_ROUTES } from '@/constants';
import { MOCK_CATEGORIES, MOCK_RESTAURANTS } from '@/data/mockExplore';

export const ExplorePage: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');

  const restaurants = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return MOCK_RESTAURANTS.filter((restaurant) => {
      const matchesKeyword = !normalized || `${restaurant.name} ${restaurant.area} ${restaurant.tag}`.toLowerCase().includes(normalized);
      const categoryWords: Record<string, string[]> = { rice: ['cơm', 'bếp'], noodles: ['phở', 'bún'], fastfood: ['burger', 'nhà hàng'], drink: ['trà', 'phê'], healthy: ['healthy', 'salad'], dessert: ['bánh', 'tráng'] };
      const matchesCategory = category === 'all' || (categoryWords[category] || []).some((word) => `${restaurant.name} ${restaurant.tag}`.toLowerCase().includes(word));
      return matchesKeyword && matchesCategory;
    });
  }, [keyword, category]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <section className="bg-gradient-to-br from-rose-50 via-white to-orange-50 border-b border-rose-100">
        <div className="container mx-auto px-4 md:px-8 py-10 md:py-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white text-primary border border-rose-100 rounded-full px-3 py-1 text-xs font-bold mb-4 shadow-sm">
              <UtensilsCrossed className="w-3.5 h-3.5" />
              Khám phá gần bạn
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Hôm nay ăn gì?</h1>
            <p className="mt-3 text-slate-600 max-w-xl">Tìm quán yêu thích và hàng trăm món ngon đang chờ bạn.</p>
            <label className="mt-6 flex items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/60 px-4 h-14 max-w-xl focus-within:border-primary focus-within:ring-4 focus-within:ring-rose-100">
              <Search className="w-5 h-5 text-slate-400" />
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm món hoặc nhà hàng..." className="w-full outline-none text-sm font-medium bg-transparent" />
            </label>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-8 py-8">
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          <button onClick={() => setCategory('all')} className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-bold border transition-colors ${category === 'all' ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
            Tất cả
          </button>
          {MOCK_CATEGORIES.map((item) => (
            <button key={item.id} onClick={() => setCategory(item.id)} className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-bold border transition-colors ${category === item.id ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-primary'}`}>
              <span className="mr-1.5">{item.emoji}</span>{item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-5">
          <div><h2 className="text-2xl font-bold text-slate-900">Nhà hàng quanh bạn</h2><p className="text-sm text-slate-500 mt-1">{restaurants.length} quán phù hợp</p></div>
        </div>
        {restaurants.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center"><Search className="w-9 h-9 mx-auto text-slate-300" /><p className="mt-3 font-bold text-slate-700">Không tìm thấy nhà hàng phù hợp</p><button onClick={() => { setKeyword(''); setCategory('all'); }} className="mt-4 text-sm font-bold text-primary">Xóa bộ lọc</button></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((shop) => (
              <Link key={shop.id} to={`${APP_ROUTES.RESTAURANTS}/${shop.id}`} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="h-44 overflow-hidden relative"><img src={shop.img} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /><span className="absolute left-3 top-3 bg-white/95 text-primary px-2.5 py-1 rounded-full text-[11px] font-black shadow">{shop.tag}</span></div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2"><h3 className="font-bold text-slate-900 leading-snug">{shop.name}</h3><span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full"><Star className="w-3 h-3 fill-amber-500" />{shop.rating}</span></div>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{shop.area}</p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-xs font-semibold text-slate-500"><span className="inline-flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" />{shop.fee}</span><span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{shop.time}</span></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
