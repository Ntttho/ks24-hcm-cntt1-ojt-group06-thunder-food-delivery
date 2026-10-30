import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock3, MapPin, Plus, Star } from 'lucide-react';
import { toast } from 'sonner';
import { APP_ROUTES } from '@/constants';
import { MOCK_RESTAURANT_DETAILS, MOCK_RESTAURANTS } from '@/data/mockExplore';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { addToCart } from '@/store/slices/cartSlice';
import { formatCurrency } from '@/utils/formatters';
import { FoodCustomizationModal, type CustomizableFood } from './FoodCustomizationModal';

export const RestaurantDetailPage: React.FC = () => {
  const { id = '' } = useParams();
  const dispatch = useAppDispatch();
  const restaurant = MOCK_RESTAURANTS.find((item) => item.id === id);
  const detail = MOCK_RESTAURANT_DETAILS[id];
  const [selectedFood, setSelectedFood] = useState<CustomizableFood | null>(null);

  if (!restaurant || !detail) {
    return <div className="min-h-screen grid place-items-center px-4"><div className="text-center"><h1 className="text-2xl font-black">Không tìm thấy nhà hàng</h1><Link to={APP_ROUTES.EXPLORE} className="inline-block mt-4 text-primary font-bold">Quay lại danh sách</Link></div></div>;
  }

  const shopNumber = Number(id.replace(/\D/g, '')) || 1;
  const handleAdd = (quantity: number, toppings: Array<{ id: number; name: string; price: number }>) => {
    if (!selectedFood) return;
    const toppingKey = toppings.map((item) => item.id).sort().join('-') || 'base';
    dispatch(addToCart({ id: `${selectedFood.id}-${toppingKey}`, productId: selectedFood.id, productName: selectedFood.name, price: selectedFood.price, quantity, imageUrl: selectedFood.image, shopId: shopNumber, shopName: restaurant.name, toppings }));
    toast.success(`Đã thêm ${selectedFood.name} vào giỏ hàng`);
    setSelectedFood(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="relative h-64 md:h-80 bg-slate-900">
        <img src={restaurant.img} alt={restaurant.name} className="w-full h-full object-cover opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/20" />
        <Link to={APP_ROUTES.EXPLORE} className="absolute left-4 md:left-[max(2rem,calc((100vw-1200px)/2))] top-5 w-10 h-10 rounded-full bg-white/95 grid place-items-center shadow"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 md:px-8 pb-6 text-white">
          <span className="text-xs font-bold bg-primary px-2.5 py-1 rounded-full">{restaurant.tag}</span>
          <h1 className="text-3xl md:text-4xl font-black mt-3">{restaurant.name}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm font-semibold"><span className="inline-flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" />{restaurant.rating}</span><span>{restaurant.area}</span></div>
        </div>
      </div>

      <main className="container mx-auto px-4 md:px-8 -mt-0">
        <section className="grid md:grid-cols-[1fr_auto] gap-5 bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-5 md:mt-6">
          <div><p className="text-sm text-slate-600 leading-relaxed">{detail.description}</p><p className="flex items-center gap-2 mt-3 text-sm font-semibold text-slate-700"><MapPin className="w-4 h-4 text-primary" />{detail.address}</p></div>
          <div className="md:border-l md:border-slate-100 md:pl-6 flex items-center gap-2 text-sm font-bold text-emerald-600"><Clock3 className="w-5 h-5" /><div><span className="block text-xs text-slate-400">Giờ mở cửa</span>{detail.hours}</div></div>
        </section>

        <div className="sticky top-0 z-20 bg-slate-50 py-4 mt-2 overflow-x-auto no-scrollbar flex gap-2">
          {detail.categories.map((category) => <a key={category.id} href={`#${category.id}`} className="shrink-0 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:border-primary hover:text-primary">{category.name}</a>)}
        </div>

        <div className="space-y-9">
          {detail.categories.map((category) => (
            <section id={category.id} key={category.id} className="scroll-mt-20">
              <h2 className="text-xl font-black text-slate-900 mb-4">{category.name}</h2>
              <div className="grid lg:grid-cols-2 gap-4">
                {category.items.map((food) => (
                  <article key={food.id} className="bg-white border border-slate-100 rounded-2xl p-3 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1 min-w-0 py-1"><h3 className="font-bold text-slate-900">{food.name}</h3><p className="text-xs text-slate-500 leading-relaxed mt-1 line-clamp-2">{food.description}</p><strong className="block mt-3 text-primary text-sm">{formatCurrency(food.price)}</strong></div>
                    <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0"><img src={food.image} alt={food.name} className="w-full h-full object-cover rounded-xl" /><button onClick={() => setSelectedFood(food)} aria-label={`Tùy chỉnh ${food.name}`} className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary text-white grid place-items-center border-2 border-white shadow-lg hover:bg-primary-hover"><Plus className="w-5 h-5" /></button></div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      {selectedFood && <FoodCustomizationModal food={selectedFood} onClose={() => setSelectedFood(null)} onAdd={handleAdd} />}
    </div>
  );
};
